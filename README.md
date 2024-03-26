# ∞⚔️ INFINITE ADVENTURE ⚔️∞

Create AI Generated Text Adventures.

## Getting Started

You will need:

1. An openAI API key for DALL-E image generation, set in the env var `OPENAI_API_KEY`
2. An anthropic API key for text generation, set in the env var `ANTHROPIC_API_KEY`
3. Python 3.x
4. Install the project requirements:
   ```
   pip install -r requirements.txt
   ```

# Usage

To run the application, use:

```
python server.py
```

then navigate to `http://127.0.0.1:5000/` in a browser.

Each round of story generation can take up to a minute, but will then be cached, so it will be fast the next time.
If you do not want the same experience twice, you can delete the files in `cache/responses` and `cache/images`.

To customize the story, change the prompt in the `#Story` section of `system_prompts/system_prompt.txt`
