const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const stopBtn = document.getElementById('stop-btn');
const apiKeyInput = document.getElementById('api-key');
const typingIndicator = document.getElementById('typing-indicator');

let recognizing = false;
let recognition;
let autoVoice = false; // Track if auto voice mode is on

// Store conversation as an array of {role: 'user'|'gemini', text: '...'}
let conversation = [];

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        recognizing = true;
        voiceBtn.textContent = '🎙️';
        voiceBtn.classList.add('listening');
        voiceBtn.setAttribute('aria-label', 'Listening');
        appendMessage('System', 'Listening...');
    };

    recognition.onresult = (event) => {
        recognizing = false;
        voiceBtn.textContent = '🎤';
        voiceBtn.classList.remove('listening');
        voiceBtn.setAttribute('aria-label', 'Speak');
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage(true); // Pass true to indicate auto mode
    };

    recognition.onerror = (event) => {
        recognizing = false;
        voiceBtn.textContent = '🎤';
        voiceBtn.classList.remove('listening');
        voiceBtn.setAttribute('aria-label', 'Speak');
        appendMessage('System', 'Speech recognition error.');
        if (autoVoice) {
            setTimeout(() => recognition.start(), 1000);
        }
    };

    recognition.onend = () => {
        recognizing = false;
        voiceBtn.textContent = '🎤';
        voiceBtn.classList.remove('listening');
        voiceBtn.setAttribute('aria-label', 'Speak');
    };
} else {
    voiceBtn.disabled = true;
    voiceBtn.title = "Speech recognition not supported";
}

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    let avatar = null;
    if (sender === 'User') {
        msgDiv.classList.add('user');
        avatar = document.createElement('span');
        avatar.className = 'avatar user-avatar';
        avatar.textContent = '🧑';
        msgDiv.appendChild(avatar);
    } else if (sender === 'Gemini') {
        msgDiv.classList.add('gemini');
        avatar = document.createElement('span');
        avatar.className = 'avatar gemini-avatar';
        avatar.textContent = '🤖';
        msgDiv.appendChild(avatar);
    } else {
        msgDiv.classList.add('system');
    }
    const contentDiv = document.createElement('div');
    contentDiv.style.flex = '1';
    contentDiv.innerHTML = marked.parse(text); // Render Markdown as HTML
    msgDiv.appendChild(contentDiv);
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showTypingIndicator(show = true) {
    typingIndicator.style.display = show ? 'flex' : 'none';
}

function showLoadingSpinner(show = true) {
    let spinner = document.getElementById('loading-spinner');
    if (show) {
        if (!spinner) {
            spinner = document.createElement('span');
            spinner.id = 'loading-spinner';
            spinner.className = 'loading-spinner';
            typingIndicator.appendChild(spinner);
        }
    } else {
        if (spinner) spinner.remove();
    }
}

// Strip Markdown formatting for TTS
function stripMarkdown(md) {
    // Remove code blocks
    md = md.replace(/```[\s\S]*?```/g, '');
    // Remove inline code
    md = md.replace(/`([^`]+)`/g, '$1');
    // Remove bold and italic
    md = md.replace(/\*\*\*([^\*]+)\*\*\*/g, '$1');
    md = md.replace(/\*\*([^\*]+)\*\*/g, '$1');
    md = md.replace(/\*([^\*]+)\*/g, '$1');
    md = md.replace(/__([^_]+)__/g, '$1');
    md = md.replace(/_([^_]+)_/g, '$1');
    // Remove headings
    md = md.replace(/^#+\s?/gm, '');
    // Remove images
    md = md.replace(/!\[.*?\]\(.*?\)/g, '');
    // Remove links but keep text
    md = md.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // Remove blockquotes
    md = md.replace(/^\s*>+\s?/gm, '');
    // Remove unordered list markers
    md = md.replace(/^\s*[-*+]\s+/gm, '');
    // Remove ordered list markers
    md = md.replace(/^\s*\d+\.\s+/gm, '');
    // Remove extra whitespace
    md = md.replace(/\s{2,}/g, ' ');
    return md.trim();
}

// Human-like TTS with pauses after punctuation
function speakText(text, callback) {
    if (!('speechSynthesis' in window)) {
        if (typeof callback === 'function') callback();
        return;
    }
    // Strip Markdown before speaking
    const cleanText = stripMarkdown(text);

    // Split text into sentences using punctuation
    const sentences = cleanText.match(/[^.!?]+[.!?]?/g) || [cleanText];
    let index = 0;

    function speakNext() {
        if (index >= sentences.length) {
            if (typeof callback === 'function') callback();
            return;
        }
        const sentence = sentences[index].trim();
        if (sentence.length === 0) {
            index++;
            speakNext();
            return;
        }
        const utter = new SpeechSynthesisUtterance(sentence);
        utter.rate = 0.95;
        utter.pitch = 1.08;
        utter.volume = 1.0;
        // Try to select a more natural voice
        const voices = window.speechSynthesis.getVoices();
        utter.voice = voices.find(v => v.name.includes('Google') && v.lang === 'en-US') || voices[0];

        utter.onend = () => {
            index++;
            // Add a pause (e.g., 700ms) between sentences for human-like effect
            setTimeout(speakNext, 10);
        };
        window.speechSynthesis.speak(utter);
    }

    speakNext();
}

function sendMessage(isAuto = false) {
    const apiKey = apiKeyInput.value.trim();
    const message = userInput.value.trim();
    if (!apiKey) {
        appendMessage('System', 'Please enter your Gemini API key.');
        return;
    }
    if (!message) return;
    appendMessage('User', message);
    conversation.push({ role: 'user', text: message });
    userInput.value = '';
    // Only send the last 8 exchanges for context (customize as needed)
    const history = conversation.slice(-8);

    showTypingIndicator(true);
    showLoadingSpinner(true);

    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, prompt: message, history: history })
    })
    .then(res => res.json())
    .then(data => {
        showTypingIndicator(false);
        showLoadingSpinner(false);
        if (data.response) {
            appendMessage('Gemini', data.response);
            conversation.push({ role: 'gemini', text: data.response });
            speakText(data.response, () => {
                if (autoVoice) {
                    setTimeout(() => recognition.start(), 10);
                }
            });
        } else if (data.error) {
            appendMessage('System', data.error);
            if (autoVoice) {
                setTimeout(() => recognition.start(), 100);
            }
        }
    })
    .catch(() => {
        showTypingIndicator(false);
        showLoadingSpinner(false);
        appendMessage('System', 'Network error.');
        if (autoVoice) {
            setTimeout(() => recognition.start(), 100);
        }
    });
}

sendBtn.addEventListener('click', () => sendMessage(false));

voiceBtn.addEventListener('click', () => {
    if (recognition && !recognizing) {
        autoVoice = !autoVoice;
        if (autoVoice) {
            voiceBtn.textContent = '🔄';
            recognition.start();
        } else {
            voiceBtn.textContent = '🎤';
            if (recognizing) recognition.stop();
        }
    }
});

stopBtn.addEventListener('click', () => {
    if (recognizing && recognition) recognition.stop();
    window.speechSynthesis.cancel();
    autoVoice = false;
    voiceBtn.textContent = '🎤';
    showTypingIndicator(false);
    showLoadingSpinner(false);
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(false);
});