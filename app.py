from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import requests
import json
import PyPDF2
from werkzeug.utils import secure_filename
import openai
import whisper
from deep_translator import GoogleTranslator
import jwt
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'  # Change this in production
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/static/*": {"origins": "*"}
})

# Configuration
UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'audio_temp'
ADMIN_UPLOAD_FOLDER = 'admin_uploads'
ALLOWED_EXTENSIONS = {'pdf'}
ALLOWED_AUDIO_EXTENSIONS = {'wav', 'mp3', 'm4a', 'ogg', 'webm'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['AUDIO_FOLDER'] = AUDIO_FOLDER
app.config['ADMIN_UPLOAD_FOLDER'] = ADMIN_UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs('knowledge_base', exist_ok=True)
os.makedirs(ADMIN_UPLOAD_FOLDER, exist_ok=True)
os.makedirs('agent_data', exist_ok=True)

# Static admin credentials
ADMIN_CREDENTIALS = {
    'username': 'admin1',
    'password': 'admin1234'
}

# Initialize agent data storage
AGENTS_DATA_FILE = 'agent_data/agents.json'
CHAT_LOGS_FILE = 'agent_data/chat_logs.json'
ADMIN_SETTINGS_FILE = 'agent_data/admin_settings.json'

def load_agents_data():
    """Load agents data from file"""
    if os.path.exists(AGENTS_DATA_FILE):
        try:
            with open(AGENTS_DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    # Initialize default agents
    default_agents = {
        'agents': [
            {'id': 'agent1', 'name': 'Agent 1', 'trained': False, 'documents': []},
            {'id': 'agent2', 'name': 'Agent 2', 'trained': False, 'documents': []},
            {'id': 'agent3', 'name': 'Agent 3', 'trained': False, 'documents': []}
        ],
        'documents': {}
    }
    save_agents_data(default_agents)
    return default_agents

def save_agents_data(data):
    """Save agents data to file"""
    with open(AGENTS_DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_chat_logs():
    """Load chat logs from file"""
    if os.path.exists(CHAT_LOGS_FILE):
        try:
            with open(CHAT_LOGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {'sessions': []}

def save_chat_logs(data):
    """Save chat logs to file"""
    with open(CHAT_LOGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_admin_settings():
    """Load admin settings from file"""
    if os.path.exists(ADMIN_SETTINGS_FILE):
        try:
            with open(ADMIN_SETTINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    # Default settings
    default_settings = {
        'default_model': 'gpt-3.5-turbo',
        'available_models': ['gpt-3.5-turbo', 'gpt-4']
    }
    save_admin_settings(default_settings)
    return default_settings

def save_admin_settings(data):
    """Save admin settings to file"""
    with open(ADMIN_SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Load data
agents_data = load_agents_data()
admin_settings = load_admin_settings()

def verify_token(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.current_user = data['username']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    return decorated

# Load Whisper model (lazy loading - only load when needed)
whisper_model = None

def get_whisper_model():
    """Load Whisper model lazily"""
    global whisper_model
    if whisper_model is None:
        print("Loading Whisper model...")
        # Using 'base' model for better balance of speed and accuracy
        # Change to 'tiny', 'small', 'medium', 'large', or 'turbo' as needed
        whisper_model = whisper.load_model("base")
        print("Whisper model loaded successfully!")
    return whisper_model

# AI Configuration - Using OpenAI API for intelligent responses
# Prefer a hardcoded key if provided, else fall back to environment variable
HARDCODED_OPENAI_API_KEY = " "# <--- OPTIONAL: put your OpenAI API key here to skip env setup

openai.api_key = HARDCODED_OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")

if not openai.api_key:
    # Helpful console guidance if key is missing; the app will still run but AI calls may return fallback responses
    print("WARNING: No OpenAI API key configured. Set HARDCODED_OPENAI_API_KEY in app.py or set OPENAI_API_KEY env var.")
    print("Set it in PowerShell with: $env:OPENAI_API_KEY = 'your_key_here'")

# Global variables to store document data
documents = []

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text

def chunk_text(text, chunk_size=500, overlap=50):
    """Split text into overlapping chunks"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
    
    return chunks

def get_ai_response(query, document_context="", agent_id="agent1", model=None):
    """Get AI-powered response using OpenAI with agent-specific context"""
    # Use provided model or default from admin settings
    if not model:
        model = admin_settings.get('default_model', 'gpt-3.5-turbo')
    
    try:
        # Load agent-specific documents if available
        agent_docs_context = ""
        if agent_id in agents_data.get('documents', {}):
            agent_docs = agents_data['documents'][agent_id]
            if agent_docs:
                agent_docs_context = "\n\n".join([
                    f"Document: {doc['filename']}\nContent: {doc['text'][:2000]}..."
                    for doc in agent_docs
                ])
        
        # Combine user documents and agent-specific documents
        full_context = document_context
        if agent_docs_context:
            if full_context:
                full_context += "\n\n" + agent_docs_context
            else:
                full_context = agent_docs_context
        
        # Create a comprehensive prompt
        system_prompt = """You are a helpful MSME (Micro, Small and Medium Enterprises) support assistant. 
        Provide accurate, concise, and helpful responses about business registration, compliance, and MSME-related queries.
        If document context is provided, use it to give specific answers. Be brief but comprehensive."""
        
        user_prompt = f"""
        Query: {query}
        
        {f"Document Context: {full_context}" if full_context else ""}
        
        Please provide a helpful, accurate response. If the query is about uploaded documents, use the context provided.
        If it's a general MSME question, provide relevant information about business registration, compliance, or MSME services.
        """
        
        # Use the newer OpenAI API format
        client = openai.OpenAI(api_key=openai.api_key)
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"AI API Error: {e}")
        # Return a fallback response instead of the error message
        if "rate limit" in str(e).lower():
            return "I'm currently experiencing high demand. Please try again in a moment."
        elif "authentication" in str(e).lower() or "api key" in str(e).lower():
            return "There's an issue with the AI service configuration. Please check the API key."
        else:
            return "I'm here to help with MSME-related questions! What would you like to know about business registration, compliance, or MSME services?"

def process_document(file_path, filename):
    """Process uploaded document for AI analysis"""
    global documents
    
    # Extract text from PDF
    text = extract_text_from_pdf(file_path)
    if not text.strip():
        return False, "No text could be extracted from the PDF"
    
    # Store document data for AI context
    doc_id = str(uuid.uuid4())
    doc_data = {
        'id': doc_id,
        'filename': filename,
        'text': text
    }
    
    documents.append(doc_data)
    
    # Save to knowledge base
    knowledge_file = os.path.join('knowledge_base', f"{doc_id}.json")
    with open(knowledge_file, 'w', encoding='utf-8') as f:
        json.dump(doc_data, f, ensure_ascii=False, indent=2)
    
    return True, f"Document processed successfully and ready for AI analysis!"

def get_document_context():
    """Get all document text for AI context"""
    if not documents:
        return ""
    
    context_parts = []
    for doc in documents:
        context_parts.append(f"Document: {doc['filename']}\nContent: {doc['text'][:2000]}...")  # Limit to 2000 chars per doc
    
    return "\n\n".join(context_parts)

@app.route('/test')
def test():
    return send_from_directory('.', 'test.html')

@app.route('/static/css/<path:filename>')
def static_css(filename):
    return send_from_directory('build/static/css', filename)

@app.route('/static/js/<path:filename>')
def static_js(filename):
    return send_from_directory('build/static/js', filename)

@app.route('/favicon.ico')
def favicon():
    return '', 404

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle document upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")
        file.save(file_path)
        
        # Process the document
        success, message = process_document(file_path, filename)
        
        if success:
            return jsonify({
                'message': message,
                'filename': filename,
                'file_id': file_id
            })
        else:
            return jsonify({'error': message}), 400
    
    return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400

@app.route('/api/transcribe', methods=['POST'])
def transcribe_audio():
    """Handle audio file upload and transcribe using Whisper"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Get language parameter (optional)
    language = request.form.get('language', None)
    task = request.form.get('task', 'transcribe')  # 'transcribe' or 'translate'
    
    try:
        # Save uploaded file temporarily
        file_id = str(uuid.uuid4())
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'webm'
        
        # Ensure valid extension
        if file_extension not in ALLOWED_AUDIO_EXTENSIONS:
            return jsonify({'error': f'Invalid audio format. Allowed: {", ".join(ALLOWED_AUDIO_EXTENSIONS)}'}), 400
        
        temp_file_path = os.path.join(app.config['AUDIO_FOLDER'], f"{file_id}.{file_extension}")
        file.save(temp_file_path)
        
        # Load Whisper model and transcribe
        model = get_whisper_model()
        
        # Configure transcription options
        transcribe_options = {}
        if language:
            transcribe_options['language'] = language
        
        # Perform transcription
        result = model.transcribe(temp_file_path, task=task, **transcribe_options)
        
        # Clean up temporary file
        try:
            os.remove(temp_file_path)
        except Exception as e:
            print(f"Error deleting temp file: {e}")
        
        return jsonify({
            'text': result['text'],
            'language': result.get('language', 'unknown'),
            'segments': result.get('segments', [])
        })
        
    except Exception as e:
        # Clean up temp file in case of error
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass
        
        print(f"Transcription error: {e}")
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages with AI"""
    data = request.get_json()
    message = data.get('message', '').strip()
    agent_id = data.get('agent_id', 'agent1')  # Default to agent1
    model = data.get('model')  # User selected model (optional)
    session_id = data.get('session_id')  # Chat session ID
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Use model from request or default from admin settings
    selected_model = model or admin_settings.get('default_model', 'gpt-3.5-turbo')
    
    # Get document context if available (user uploads)
    document_context = get_document_context()
    
    # Get AI response with agent-specific context
    ai_response = get_ai_response(message, document_context, agent_id, selected_model)
    
    # If AI response is the fallback message, try a simple rule-based response
    if "I'm here to help with MSME-related questions!" in ai_response:
        ai_response = get_simple_response(message, document_context)
    
    # Store chat in history
    chat_logs = load_chat_logs()
    chat_entry = {
        'session_id': session_id,
        'user_message': message,
        'bot_response': ai_response,
        'agent_id': agent_id,
        'model': selected_model,
        'timestamp': datetime.utcnow().isoformat(),
        'feedback': None  # Will be updated when user provides feedback
    }
    
    # Find or create session
    session_found = False
    for session in chat_logs.get('sessions', []):
        if session.get('session_id') == session_id:
            session['messages'].append(chat_entry)
            session['updated_at'] = datetime.utcnow().isoformat()
            session_found = True
            break
    
    if not session_found:
        chat_logs.setdefault('sessions', []).append({
            'session_id': session_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'messages': [chat_entry]
        })
    
    save_chat_logs(chat_logs)
    
    return jsonify({
        'response': ai_response,
        'has_document_context': len(documents) > 0,
        'agent_id': agent_id,
        'session_id': session_id,
        'model': selected_model,
        'message_timestamp': chat_entry.get('timestamp')
    })

def get_simple_response(message, document_context=""):
    """Simple rule-based responses as fallback"""
    message_lower = message.lower()
    
    # Document-based responses
    if document_context and any(word in message_lower for word in ['what', 'summarize', 'explain', 'tell me about']):
        return f"Based on your uploaded document, I can see it contains relevant information. Here are the key points: {document_context[:500]}..."
    
    # General MSME responses
    if any(word in message_lower for word in ['register', 'registration', 'business']):
        return """To register your business as an MSME:
1. Visit the Udyam registration portal (udyamregistration.gov.in)
2. Provide your Aadhaar number and PAN card
3. Fill in business details (name, address, type of business)
4. Submit the application
5. You'll receive your Udyam Registration Number (URN)

Required documents: PAN card, Aadhaar card, business address proof, and bank account details."""
    
    elif any(word in message_lower for word in ['document', 'documents', 'required']):
        return """For MSME registration, you need:
• PAN Card
• Aadhaar Card  
• Business address proof
• Bank account details
• Business type and activity description
• Investment in plant & machinery details"""
    
    elif any(word in message_lower for word in ['benefit', 'benefits', 'advantage']):
        return """MSME registration benefits include:
• Priority in government tenders
• Collateral-free loans up to ₹10 lakhs
• Access to government schemes and subsidies
• Tax benefits and exemptions
• Skill development programs
• Credit guarantee schemes"""
    
    elif any(word in message_lower for word in ['hello', 'hi', 'hey']):
        return "Hello! I'm your MSME support assistant. I can help you with business registration, compliance, and MSME-related queries. What would you like to know?"
    
    else:
        return "I'm here to help with MSME-related questions! You can ask me about business registration, required documents, benefits, or upload documents for specific guidance."

@app.route('/api/translate', methods=['POST'])
def translate_text():
    """Translate text between languages using deep-translator's GoogleTranslator"""
    try:
        data = request.get_json(force=True)
        text = data.get('text', '')
        src = data.get('src', 'auto')
        dest = data.get('dest', 'en')

        if not text.strip():
            return jsonify({'error': 'No text provided'}), 400

        # deep-translator uses 'auto' for auto source detection
        translated = GoogleTranslator(source=src, target=dest).translate(text)
        return jsonify({
            'text': translated,
            'src': src,
            'dest': dest
        })
    except Exception as e:
        print(f"Translation error: {e}")
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """Get list of uploaded documents"""
    doc_list = [{'id': doc['id'], 'filename': doc['filename']} for doc in documents]
    return jsonify({'documents': doc_list})

# Admin endpoints
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if username == ADMIN_CREDENTIALS['username'] and password == ADMIN_CREDENTIALS['password']:
        # Generate JWT token
        token = jwt.encode({
            'username': username,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'message': 'Login successful'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Invalid credentials'
        }), 401

@app.route('/api/admin/logout', methods=['POST'])
@verify_token
def admin_logout():
    """Admin logout endpoint"""
    return jsonify({'success': True, 'message': 'Logout successful'})

@app.route('/api/admin/data', methods=['GET'])
@verify_token
def get_admin_data():
    """Get admin data including agents and documents"""
    global agents_data
    agents_data = load_agents_data()
    
    # Format documents for response
    all_documents = []
    for agent_id, docs in agents_data.get('documents', {}).items():
        for doc in docs:
            all_documents.append({
                **doc,
                'agent_id': agent_id
            })
    
    return jsonify({
        'success': True,
        'agents': agents_data.get('agents', []),
        'documents': all_documents
    })

@app.route('/api/admin/upload', methods=['POST'])
@verify_token
def admin_upload():
    """Admin document upload endpoint"""
    global agents_data
    
    uploaded_file = request.files.get('file')
    agent_id = request.form.get('agent_id', 'agent1')
    description = request.form.get('description', '').strip()

    if uploaded_file is None or uploaded_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(uploaded_file.filename):
        return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400

    if not description:
        return jsonify({'error': 'Description is required for uploaded documents.'}), 400

    filename = secure_filename(uploaded_file.filename)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(app.config['ADMIN_UPLOAD_FOLDER'], f"{file_id}_{filename}")
    uploaded_file.save(file_path)

    # Extract text from PDF
    text = extract_text_from_pdf(file_path)
    if not text.strip():
        return jsonify({'error': 'No text could be extracted from the PDF'}), 400

    # Store document data
    doc_data = {
        'id': file_id,
        'filename': filename,
        'text': text,
        'uploaded_at': datetime.utcnow().isoformat(),
        'description': description
    }

    # Add to agent's documents
    if 'documents' not in agents_data:
        agents_data['documents'] = {}
    if agent_id not in agents_data['documents']:
        agents_data['documents'][agent_id] = []

    agents_data['documents'][agent_id].append(doc_data)

    # Save agents data
    save_agents_data(agents_data)

    response_doc = {**doc_data, 'agent_id': agent_id}

    return jsonify({
        'success': True,
        'document': response_doc,
        'documents': [response_doc],
        'message': 'Document uploaded successfully'
    })

@app.route('/api/admin/train', methods=['POST'])
@verify_token
def admin_train():
    """Train AI agent with uploaded documents"""
    global agents_data
    
    data = request.get_json()
    agent_id = data.get('agent_id', 'agent1')
    
    # Check if agent has documents
    agent_docs = agents_data.get('documents', {}).get(agent_id, [])
    if not agent_docs:
        return jsonify({
            'success': False,
            'error': 'No documents found for this agent'
        }), 400
    
    # Update agent training status
    for agent in agents_data.get('agents', []):
        if agent['id'] == agent_id:
            agent['trained'] = True
            break
    
    # Save agents data
    save_agents_data(agents_data)
    
    return jsonify({
        'success': True,
        'message': f'Agent {agent_id} trained successfully with {len(agent_docs)} document(s)'
    })

@app.route('/api/admin/documents/<doc_id>', methods=['DELETE'])
@verify_token
def admin_delete_document(doc_id):
    """Delete a document from an agent"""
    global agents_data
    
    # Get agent_id from request JSON or query parameter
    data = request.get_json(silent=True) or {}
    agent_id = data.get('agent_id') or request.args.get('agent_id', 'agent1')
    
    # Remove document from agent's documents
    if agent_id in agents_data.get('documents', {}):
        agents_data['documents'][agent_id] = [
            doc for doc in agents_data['documents'][agent_id]
            if doc['id'] != doc_id
        ]
        
        # If no documents left, mark agent as not trained
        if not agents_data['documents'][agent_id]:
            for agent in agents_data.get('agents', []):
                if agent['id'] == agent_id:
                    agent['trained'] = False
                    break
        
        # Save agents data
        save_agents_data(agents_data)
        
        # Delete file from disk
        try:
            for filename in os.listdir(app.config['ADMIN_UPLOAD_FOLDER']):
                if filename.startswith(doc_id):
                    os.remove(os.path.join(app.config['ADMIN_UPLOAD_FOLDER'], filename))
                    break
        except:
            pass
        
        return jsonify({
            'success': True,
            'message': 'Document deleted successfully'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Document not found'
        }), 404

# Get available agents (public endpoint)
@app.route('/api/agents', methods=['GET'])
def get_agents():
    """Get list of available agents"""
    global agents_data
    agents_data = load_agents_data()
    return jsonify({
        'agents': agents_data.get('agents', [])
    })

# Get available models (public endpoint)
@app.route('/api/models', methods=['GET'])
def get_models():
    """Get list of available AI models"""
    global admin_settings
    admin_settings = load_admin_settings()
    return jsonify({
        'available_models': admin_settings.get('available_models', ['gpt-3.5-turbo', 'gpt-4']),
        'default_model': admin_settings.get('default_model', 'gpt-3.5-turbo')
    })

# Submit feedback for a chat message
@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback (good/bad) for a chat message"""
    data = request.get_json()
    session_id = data.get('session_id')
    message_timestamp = data.get('timestamp')
    feedback = data.get('feedback')  # 'good' or 'bad'
    
    if not session_id or not message_timestamp or feedback not in ['good', 'bad']:
        return jsonify({'error': 'Invalid feedback data'}), 400
    
    chat_logs = load_chat_logs()
    
    # Find and update the message
    for session in chat_logs.get('sessions', []):
        if session.get('session_id') == session_id:
            for message in session.get('messages', []):
                if message.get('timestamp') == message_timestamp:
                    message['feedback'] = feedback
                    save_chat_logs(chat_logs)
                    return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
    
    return jsonify({'error': 'Message not found'}), 404

# Admin endpoints for chat logs
@app.route('/api/admin/logs', methods=['GET'])
@verify_token
def get_chat_logs():
    """Get all chat logs for admin"""
    chat_logs = load_chat_logs()
    # Return all sessions with their messages
    return jsonify({
        'success': True,
        'sessions': chat_logs.get('sessions', [])
    })

@app.route('/api/admin/logs/stats', methods=['GET'])
@verify_token
def get_feedback_stats():
    """Get feedback statistics for admin"""
    chat_logs = load_chat_logs()
    
    total_responses = 0
    good_count = 0
    bad_count = 0
    no_feedback = 0
    
    model_stats = {}
    
    for session in chat_logs.get('sessions', []):
        for message in session.get('messages', []):
            if message.get('bot_response'):
                total_responses += 1
                feedback = message.get('feedback')
                model = message.get('model', 'unknown')
                
                if model not in model_stats:
                    model_stats[model] = {'good': 0, 'bad': 0, 'total': 0}
                
                model_stats[model]['total'] += 1
                
                if feedback == 'good':
                    good_count += 1
                    model_stats[model]['good'] += 1
                elif feedback == 'bad':
                    bad_count += 1
                    model_stats[model]['bad'] += 1
                else:
                    no_feedback += 1
    
    return jsonify({
        'success': True,
        'stats': {
            'total_responses': total_responses,
            'good_feedback': good_count,
            'bad_feedback': bad_count,
            'no_feedback': no_feedback,
            'model_stats': model_stats
        }
    })

@app.route('/api/admin/settings', methods=['GET'])
@verify_token
def get_admin_settings():
    """Get admin settings"""
    global admin_settings
    admin_settings = load_admin_settings()
    return jsonify({
        'success': True,
        'settings': admin_settings
    })

@app.route('/api/admin/settings', methods=['POST'])
@verify_token
def update_admin_settings():
    """Update admin settings (default model)"""
    global admin_settings
    data = request.get_json()
    
    if 'default_model' in data:
        available_models = admin_settings.get('available_models', ['gpt-3.5-turbo', 'gpt-4'])
        if data['default_model'] in available_models:
            admin_settings['default_model'] = data['default_model']
            save_admin_settings(admin_settings)
            return jsonify({
                'success': True,
                'message': 'Settings updated successfully',
                'settings': admin_settings
            })
        else:
            return jsonify({'error': 'Invalid model'}), 400
    
    return jsonify({'error': 'Invalid settings data'}), 400

# Catch-all route for React Router - must be LAST after all API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React app for all non-API routes (React Router handles client-side routing)"""
    # Don't interfere with API routes - they should be handled above
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    
    # Don't interfere with static files
    if path.startswith('static/'):
        return jsonify({'error': 'Not found'}), 404
    
    # Serve index.html for all other routes (React Router will handle routing)
    if os.path.exists(os.path.join('build', 'index.html')):
        return send_from_directory('build', 'index.html')
    else:
        return jsonify({'error': 'Build files not found. Please run: npm run build'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
