# Grok-4 Cinematic Experience Setup

## Setup Instructions

1. **Get OpenRouter API Key**
   - Visit https://openrouter.ai/
   - Sign up for OpenRouter access
   - Generate your API key

2. **Configure Environment Variables**
   Create a `.env` file in the server directory with:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

3. **Features Enabled with Grok-4 through OpenRouter**
   - **Cinematic Responses**: Longer, more atmospheric responses
   - **Emotional Depth**: Enhanced character development and emotional arcs
   - **Poetic Language**: Rich metaphors and sensory details
   - **Higher Creativity**: Temperature set to 0.85 for more creative responses
   - **Extended Context**: 1200 max tokens for full cinematic experience

## Model Configuration
The app uses `xai/grok-beta` through OpenRouter for the cinematic experience.
If OpenRouter API key is not available, the app will automatically fallback to:
- OpenAI (GPT-4) if `OPENAI_API_KEY` is set

## Cinematic Experience Features
- **Emotional Pacing**: Responses build emotional arcs
- **Atmospheric Details**: Rich sensory descriptions
- **Character Development**: Deep personality exploration
- **Poetic Language**: Metaphorical and symbolic expression
- **Cinematic Structure**: Scene-like responses with proper pacing

The web app is now optimized for a full cinematic experience with Grok-4! 