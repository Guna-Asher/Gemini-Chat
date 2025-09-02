from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__, static_folder='static', template_folder='templates')

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    api_key = data.get('api_key')
    prompt = data.get('prompt')
    history = data.get('history', [])

    if not api_key or not prompt:
        return jsonify({'error': 'API key and prompt are required'}), 400

    # Build conversation context
    context_lines = []
    for turn in history:
        if turn['role'] == 'user':
            context_lines.append(f"**User:** {turn['text']}")
        elif turn['role'] == 'gemini':
            context_lines.append(f"**Gemini:** {turn['text']}")
    context_lines.append(f"**User:** {prompt}")
    context = "\n\n".join(context_lines)

    headers = {
        "X-goog-api-key": api_key,
        "Content-Type": "application/json"
    }

    enhanced_prompt = (
        "You are a helpful, conversational AI assistant. "
        "Format your response using Markdown for clarity and visual appeal. "
        "Use headings, bullet points, and bold where appropriate. "
        "Use the conversation history to answer follow-up questions naturally.\n\n"
        + context
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": enhanced_prompt
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            result = response.json()
            candidates = result.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                generated_text = "".join(part.get("text", "") for part in parts)
                return jsonify({'response': generated_text.strip()})
            else:
                return jsonify({'error': 'No generated text found in response.'}), 500
        else:
            return jsonify({'error': f"Request failed with status code {response.status_code}: {response.text}"}), 500
    except Exception as e:
        return jsonify({'error': f"Error during API call: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)