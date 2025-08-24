# AI Provider API Keys Setup Guide

This project now supports multiple AI providers. You'll need to set up API keys for the providers you want to use.

## Environment Variables

Create a `.env.local` file in your project root and add the following API keys:

```bash
# Google Gemini (Default - works without API key for limited usage)
GOOGLE_API_KEY=your_google_api_key_here

# OpenAI Models (GPT-4, GPT-3.5, etc.)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Claude Models
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# DeepSeek Models
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Groq Models (Fast Inference - Llama, Mixtral, Gemma)
GROQ_API_KEY=your_groq_api_key_here

# Mistral Models
MISTRAL_API_KEY=your_mistral_api_key_here

# Together.ai Models
TOGETHER_API_KEY=your_together_api_key_here

# Cohere Models
COHERE_API_KEY=your_cohere_api_key_here

# Perplexity Models
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Fireworks Models
FIREWORKS_API_KEY=your_fireworks_api_key_here
```

## How to Get API Keys

### 1. Google Gemini
- Visit: https://makersuite.google.com/app/apikey
- Sign in with your Google account
- Click "Create API Key"
- Copy the generated key

### 2. OpenAI
- Visit: https://platform.openai.com/api-keys
- Sign in or create an account
- Click "Create new secret key"
- Copy the generated key

### 3. Anthropic Claude
- Visit: https://console.anthropic.com/
- Sign in or create an account
- Go to "API Keys" section
- Click "Create Key"
- Copy the generated key

### 4. DeepSeek
- Visit: https://platform.deepseek.com/
- Sign in or create an account
- Go to "API Keys" section
- Create a new API key
- Copy the generated key

### 5. Groq
- Visit: https://console.groq.com/
- Sign in or create an account
- Go to "API Keys" section
- Click "Create API Key"
- Copy the generated key

### 6. Mistral
- Visit: https://console.mistral.ai/
- Sign in or create an account
- Go to "API Keys" section
- Create a new API key
- Copy the generated key

### 7. Together.ai
- Visit: https://together.ai/
- Sign in or create an account
- Go to "API Keys" section
- Create a new API key
- Copy the generated key

### 8. Cohere
- Visit: https://cohere.ai/
- Sign in or create an account
- Go to "API Keys" section
- Create a new API key
- Copy the generated key

### 9. Perplexity
- Visit: https://www.perplexity.ai/
- Sign in or create an account
- Go to "Settings" → "API"
- Create a new API key
- Copy the generated key

### 10. Fireworks
- Visit: https://fireworks.ai/
- Sign in or create an account
- Go to "API Keys" section
- Create a new API key
- Copy the generated key

## Usage

1. **Set your API keys** in the `.env.local` file
2. **Select your preferred model** from the dropdown in the chat interface
3. **Enter your API key** in the chat interface (or it will use the environment variable)
4. **Start chatting** with your chosen AI model!

## Notes

- **Google Gemini models** will work with the default API key for limited usage
- **Other models require** you to provide an API key either in the environment or in the chat interface
- **API costs vary** by provider - check their pricing pages for details
- **Rate limits apply** - some providers have different rate limits and quotas

## Troubleshooting

- **"API key required" error**: Make sure you've set the correct API key for your chosen provider
- **"Rate limit exceeded"**: Wait a bit or check your provider's rate limits
- **"Model not found"**: Ensure you're using the exact model name from the dropdown
- **"Authentication failed"**: Verify your API key is correct and active

## Cost Optimization

- **Groq models** are typically the fastest and most cost-effective for basic tasks
- **OpenAI GPT-4** is excellent for complex reasoning but more expensive
- **Claude models** offer good balance of capability and cost
- **Gemini models** are free for limited usage, then pay-per-use

## Gemini Model Capabilities

### **Gemini 2.5 Models (Latest)**
- **Gemini 2.5 Pro**: Most capable model with enhanced thinking, reasoning, and multimodal understanding
- **Gemini 2.5 Flash**: Fast and cost-effective with adaptive thinking
- **Gemini 2.5 Flash Lite**: Most cost-efficient for high throughput tasks

### **Gemini 2.0 Models**
- **Gemini 2.0 Flash**: Next generation features with speed and real-time streaming
- **Gemini 2.0 Flash Lite**: Cost efficiency and low latency

### **Gemini 1.5 Models**
- **Gemini 1.5 Pro**: High-quality responses with long context
- **Gemini 1.5 Flash**: Fast responses with good quality
