import anthropic
import json
import os
from openai import OpenAI
import base64
from pathlib import Path
import requests
oAIclient = OpenAI()

api_key = os.environ.get("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(
    # defaults to 
    api_key=api_key,
)

def get_hash_string(data):
    hashed_value = hash(data)
    return  hex(hashed_value)

def get_AI_response(system_prompt, ai_responses, player_responses):
    hash_str = get_hash_string((system_prompt, tuple(ai_responses), tuple(player_responses)))
    cached_filepath = Path("cache/responses") / f"{hash_str}.txt"
    if cached_filepath.exists():
        return open(cached_filepath).read()
    
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "new game"
                }
            ]
        }
    ]
    for ai_response, player_response in zip(ai_responses, player_responses):
        messages.append({
            'role': "assistant",
            "content": [
                {
                    'type': "text",
                    "text": ai_response
                }
            ]
        })
        messages.append({
            'role': "user",
            "content": [
                {
                    'type': "text",
                    "text": player_response
                }
            ]
        })

    response = client.messages.create(
        model="claude-3-opus-20240229",
        max_tokens=1000,
        temperature=0.7,
        system=system_prompt,
        messages=messages
    )

    result = response.content[0].text
    with open(cached_filepath, 'w') as f:
        f.write(result)
    return result

def generate_image(prompt):
    hash_str = get_hash_string(prompt)
    image_filename = f"{hash_str}.png"
    cached_filepath = Path("cache/images") / image_filename
    if cached_filepath.exists():
        return open(cached_filepath, 'rb').read()

    print("GENERATING!!")
    print(prompt)
    response = oAIclient.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )

    image_url = response.data[0].url
    print("DALL-E's returned image url::")
    print(image_url)
    image_data = requests.get(image_url).content
    with open(cached_filepath, "wb") as f:
        f.write(image_data)

    return image_data
