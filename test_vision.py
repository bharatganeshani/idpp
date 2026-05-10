import requests
import os
import base64
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

api_key = os.getenv("api_key")

def test_vision():
    # tiny valid base64 image (1x1 red pixel)
    b64_img = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json"
    }
    payload = {
        "model": "meta/llama-3.2-11b-vision-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is the color of this image?"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64_img}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 100
    }
    res = requests.post("https://integrate.api.nvidia.com/v1/chat/completions", headers=headers, json=payload)
    print(res.status_code)
    print(res.text)

if __name__ == "__main__":
    test_vision()
