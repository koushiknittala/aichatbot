# Using Custom AI Models with Ollama

## 🎯 Current Setup

Your project uses **Ollama** which supports many AI models. Currently configured models:
- llama3.2 (default, recommended)
- llama3
- llama2
- mistral
- phi

## ✅ Adding Your Own Models

### Option 1: Use Any Ollama Model

Ollama supports **hundreds of models**. You can use any of them:

1. **Download any model:**
   ```powershell
   ollama pull <model-name>
   ```

2. **Popular models you can use:**
   - `llama3.2` (current default)
   - `llama3.1`
   - `llama3`
   - `mistral`
   - `mixtral`
   - `codellama`
   - `neural-chat`
   - `starling-lm`
   - `wizardcoder`
   - `deepseek-coder`
   - And many more!

3. **Add to your project:**
   - Edit `app.py` line 101-102
   - Add your model to `available_models` list

### Option 2: Fine-tune Your Own Model

You can fine-tune models for your specific use case:

1. **Create a Modelfile:**
   ```bash
   # Create a file called Modelfile
   FROM llama3.2
   
   # Add your custom instructions
   SYSTEM """You are a specialized MSME support assistant..."""
   
   # Add training data
   # PARAMETER temperature 0.7
   ```

2. **Create custom model:**
   ```powershell
   ollama create my-custom-model -f Modelfile
   ```

3. **Use it:**
   ```powershell
   ollama run my-custom-model
   ```

4. **Add to project:**
   - Edit `app.py` to include `my-custom-model` in available models

### Option 3: Import Pre-trained Models

You can import models from:
- Hugging Face
- Custom trained models
- Community models

```powershell
# Import from file
ollama import <model-file>
```

## 🔧 How to Add Custom Models

### Step 1: Download/Create Model
```powershell
ollama pull your-model-name
```

### Step 2: Update app.py
Edit line 101-102 in `app.py`:

```python
'available_models': [
    'llama3.2',      # Default
    'llama3',
    'llama2',
    'mistral',
    'phi',
    'your-model-name',  # Add your model here
    'another-model'      # Add more models
]
```

### Step 3: Update Frontend (Optional)
If you want to show custom names in UI, edit:
- `src/components/UserChat.js` - availableModels state
- `src/components/AdminPanel.js` - adminSettings state

### Step 4: Rebuild
```powershell
npm run build
```

## 📋 Example: Adding a Custom Model

Let's say you want to add `mixtral`:

1. **Download:**
   ```powershell
   ollama pull mixtral
   ```

2. **Update app.py:**
   ```python
   'available_models': ['llama3.2', 'llama3', 'llama2', 'mistral', 'phi', 'mixtral']
   ```

3. **Rebuild:**
   ```powershell
   npm run build
   ```

4. **Done!** Now `mixtral` appears in model selector

## 🎓 Training Your Own Model

### Using Ollama Modelfile:

1. **Create Modelfile:**
   ```bash
   FROM llama3.2
   
   SYSTEM """You are an expert MSME consultant specializing in:
   - Business registration
   - Compliance requirements
   - Financial planning
   - Market analysis"""
   
   TEMPLATE """{{ .System }}
   
   User: {{ .Prompt }}
   Assistant: {{ .Response }}"""
   ```

2. **Create model:**
   ```powershell
   ollama create msme-expert -f Modelfile
   ```

3. **Test:**
   ```powershell
   ollama run msme-expert
   ```

4. **Add to project** (as shown above)

## 🔍 Finding Models

Browse available models:
- **Ollama Library**: https://ollama.ai/library
- **Hugging Face**: https://huggingface.co/models
- **Community**: Search for "ollama models"

## 💡 Tips

1. **Model Size**: Larger models = better quality but slower
2. **Specialized Models**: Use domain-specific models for better results
3. **Fine-tuning**: Fine-tune on your documents for best results
4. **Testing**: Test models before adding to production

## 🚀 Quick Add

To quickly add a new model:

1. `ollama pull <model-name>`
2. Add to `app.py` line 101-102
3. `npm run build`
4. Restart server

That's it! Your custom model is now available.

