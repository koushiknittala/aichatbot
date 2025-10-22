<<<<<<< HEAD
# MSME ONE Chatbot

A modern chatbot application for MSME ONE with document upload and RAG (Retrieval-Augmented Generation) capabilities.

## Features

- **Modern React Frontend**: Clean, responsive UI matching the MSME ONE design
- **Document Upload**: Upload PDF documents for analysis
- **RAG System**: Ask questions about uploaded documents using Hugging Face API
- **Real-time Chat**: Interactive chat with typing indicators
- **Multi-language Support**: Supports English and Telugu input
- **Cloud-based AI**: Uses Hugging Face API instead of local models

## Technology Stack

- **Backend**: Python Flask (minimal dependencies)
- **Frontend**: React.js with modern UI components
- **Document Processing**: PyPDF2 for PDF text extraction
- **AI/ML**: Hugging Face API for embeddings and semantic search
- **Vector Search**: Cosine similarity for document retrieval

## Installation

### Quick Start (Recommended)

**Windows (2 simple steps):**
1) Double‑click `quick-setup.bat` (first time only) – installs deps and builds frontend
2) Double‑click `start.bat` – starts the Flask server at http://localhost:5000

Optional (to enable real OpenAI answers instead of fallback):
- Open `app.py` and set `HARDCODED_OPENAI_API_KEY = "sk-..."` near the top, or set an env var before starting: `$env:OPENAI_API_KEY = 'sk-...'`

**Linux/Mac:**
```bash
pip install -r requirements.txt
npm install && npm run build
python app.py
```

### Manual Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd chatbotrag
   ```

2. **Install Python dependencies**:
   ```bash
   pip install Flask==2.3.3 Flask-CORS==4.0.0 PyPDF2==3.0.1 requests==2.31.0 Werkzeug==2.3.7
   ```

3. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

4. **Build React frontend**:
   ```bash
   npm run build
   ```

5. **Configure OpenAI API (optional but recommended)**:
   - Quickest: open `app.py` and set `HARDCODED_OPENAI_API_KEY = "sk-..."`
   - Or use an environment variable:
     - PowerShell: `$env:OPENAI_API_KEY = 'sk-...'`
     - Bash: `export OPENAI_API_KEY='sk-...'`

6. **Run the application**:
   ```bash
   python app.py
   ```

7. **Access the application**:
   Open your browser and go to `http://localhost:5000`

### Prerequisites

- Python 3.8+
- Node.js 16+
- OpenAI API key (optional for AI responses)

## Usage

### Basic Chat
- Type your message in the input field
- Press Enter or click the send button
- The bot will respond with relevant information

### Document Upload
1. Click the paperclip icon to open the upload section
2. Drag and drop PDF files or click "Choose Files"
3. Upload PDF documents (up to 16MB each)
4. Ask questions about the uploaded documents

### Document-based Q&A
After uploading documents, you can ask questions like:
- "What is mentioned about business registration?"
- "What are the requirements for MSME registration?"
- "Summarize the key points from the document"

## API Endpoints

- `POST /api/upload` - Upload PDF documents
- `POST /api/chat` - Send chat messages
- `GET /api/documents` - Get list of uploaded documents

## File Structure

```
chatbotrag/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── static/
│   └── index.html        # Frontend HTML/CSS/JS
├── uploads/              # Uploaded files storage
└── knowledge_base/       # Stored processed document snapshots
```

## Configuration

- **Upload Folder**: `uploads/` (created automatically)
- **Knowledge Base**: `knowledge_base/` (stores processed document snapshots)
- **Max File Size**: 16MB
- **Supported Formats**: PDF only

## Dependencies

- Flask 2.3.3
- Flask-CORS 4.0.0
- PyPDF2 3.0.1
- openai 0.28.1
- Werkzeug 2.3.7

## Development

To run in development mode:
```bash
python app.py
```

The application will start on `http://localhost:5000` with debug mode enabled.

## One-liners

- Windows, first time setup and run (in project folder):
  - `quick-setup.bat` then `start.bat`
- Windows, start only:
  - `start.bat`
- Curl health check:
  - `curl http://localhost:5000/`

## Features in Detail

### Document Processing
1. **PDF Text Extraction**: Uses PyPDF2 to extract text from uploaded PDFs
2. **Text Chunking**: Splits large documents into manageable chunks (500 words with 50-word overlap)
3. **Embedding Generation**: Creates vector embeddings using Sentence Transformers
4. **Semantic Search**: Uses cosine similarity to find relevant document sections

### Chat System
1. **Message Handling**: Processes both general queries and document-specific questions
2. **Context Awareness**: Distinguishes between general MSME questions and document-based queries
3. **Real-time Response**: Shows typing indicators during processing
4. **Multi-language**: Supports English and Telugu input

### UI/UX Features
1. **Responsive Design**: Works on desktop and mobile devices
2. **Modern Interface**: Clean, professional design matching MSME ONE branding
3. **Drag & Drop**: Easy file upload with visual feedback
4. **Real-time Updates**: Live chat with typing indicators

## Troubleshooting

### Common Issues

1. **PDF Upload Fails**:
   - Ensure file is a valid PDF
   - Check file size (max 16MB)
   - Verify file is not corrupted

2. **No Response from Bot**:
   - Check if Flask server is running
   - Verify API endpoints are accessible
   - Check browser console for errors

3. **Document Processing Issues**:
   - Ensure PDF contains extractable text
   - Check if document is password-protected
   - Verify sufficient disk space

### Performance Tips

1. **Large Documents**: Processing time increases with document size
2. **Multiple Documents**: Each document is processed independently
3. **Memory Usage**: Embeddings are stored in memory for fast retrieval

## License

This project is licensed under the MIT License.
=======
# aichatbot
>>>>>>> eb580296c5807ef61931f51fb3e2170c4da38a14
