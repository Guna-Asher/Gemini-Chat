# Gemini Chat

A simple Flask-based web chat application that integrates with the Gemini API (Google's generative language API) to provide conversational AI responses. The app allows users to input their Gemini API key and chat with the AI assistant in a context-aware manner.

## Features

- User-friendly chat interface with conversation history.
- Supports voice input and text-to-speech for responses.
- Uses Gemini API for generating AI responses.
- Markdown formatting for clear and visually appealing responses.
- Runs as a Flask web app with a REST API backend.

## Project Structure

- `app.py`: Main Flask application with routes for the frontend and API.
- `templates/index.html`: HTML template for the chat interface.
- `static/style.css`: CSS styles for the UI.
- `static/script.js`: JavaScript for frontend logic, including chat handling, voice recognition, and text-to-speech.

## Prerequisites

- Python 3.7+
- Gemini API key (from Google AI)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd gemini_web_chat
   ```

2. (Optional but recommended) Create and activate a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install flask requests
   ```

## Running the App Locally

Start the Flask development server:

```bash
python app.py
```

Open your browser and navigate to `http://127.0.0.1:5000/` to access the chat interface.

## Usage

- Enter your Gemini API key in the input field.
- Type your message or use the voice input button to speak.
- The AI assistant will respond with context-aware answers.
- Responses are formatted with Markdown and read aloud using text-to-speech.

## Deployment

This app can be deployed to platforms supporting Python Flask apps, such as Vercel (with serverless functions), Heroku, or any cloud provider.

### Deploying to Vercel

- Configure the Flask app as a serverless function.
- Ensure the API key is provided by the user at runtime (not stored server-side).
- Follow Vercel's Python deployment documentation for setup.

## Notes

- The API key is required for each session and is not stored on the server.
- The app sends conversation history to the Gemini API to maintain context.
- Voice recognition uses the browser's Web Speech API (webkitSpeechRecognition).
- Text-to-speech uses the browser's SpeechSynthesis API.

## License

MIT License

## Acknowledgments

- Powered by Gemini API &mdash; [Google AI](https://ai.google.dev/)
- Uses [Marked.js](https://marked.js.org/) for Markdown rendering.
