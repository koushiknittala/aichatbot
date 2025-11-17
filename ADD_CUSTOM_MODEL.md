# How to Add Your Own AI Model

## ✅ Quick Answer

**Yes!** You can use any Ollama model or train your own. The system now **automatically detects** all models you have installed in Ollama.

## 🚀 Simple Steps

### Step 1: Download/Create Your Model

**Option A: Use any Ollama model**
```powershell
ollama pull <model-name>
```

**Option B: Create custom model**
```powershell
# Create Modelfile
ollama create my-custom-model -f Modelfile
```

### Step 2: That's It!

The system **automatically detects** all models installed in Ollama. No code changes needed!

Just restart your server:
```powershell
python app.py
```

Your new model will appear in the model selector automatically!

## 📋 Example: Adding a New Model

Let's add `mixtral`:

1. **Download:**
   ```powershell
   ollama pull mixtral
   ```

2. **Restart server:**
   ```powershell
   python app.py
   ```

3. **Done!** `mixtral` now appears in model selector

## 🎓 Training Your Own Model

### Create Custom Model with Modelfile:

1. **Create a file called `Modelfile`:**
   ```bash
   FROM llama3.2
   
   SYSTEM """You are a specialized MSME support assistant.
   You help with business registration, compliance, and MSME services.
   Always be helpful, accurate, and concise."""
   
   TEMPLATE """{{ .System }}
   
   User: {{ .Prompt }}
   Assistant: {{ .Response }}"""
   ```

2. **Create the model:**
   ```powershell
   ollama create msme-expert -f Modelfile
   ```

3. **Test it:**
   ```powershell
   ollama run msme-expert
   ```

4. **Restart your server** - it will automatically appear!

## 🔧 Manual Configuration (Optional)

If you want to manually configure models, edit `agent_data/admin_settings.json`:

```json
{
  "default_model": "llama3.2",
  "available_models": [
    "llama3.2",
    "llama3",
    "my-custom-model",
    "another-model"
  ]
}
```

## 💡 Tips

1. **Automatic Detection**: The system now auto-detects all Ollama models
2. **Custom Models**: Any model you create with `ollama create` will be detected
3. **No Code Changes**: You don't need to edit code anymore!
4. **Model Names**: Use any name you want for custom models

## 🎯 Popular Models You Can Use

- `llama3.2` (current default)
- `llama3.1`
- `llama3`
- `mixtral`
- `mistral`
- `codellama`
- `neural-chat`
- `starling-lm`
- `wizardcoder`
- `deepseek-coder`
- And hundreds more!

Browse: https://ollama.ai/library

## ✅ Summary

1. Download/create model: `ollama pull <name>` or `ollama create <name>`
2. Restart server: `python app.py`
3. Done! Model appears automatically

**No code changes needed!** 🎉

