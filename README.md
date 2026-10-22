# Gemini Multilingual Support Bot

AI customer-support bot using Gemini, multilingual sentiment analysis, risk detection, escalation queues, audit logging, conversation memory, and tests.

## Features
- Gemini AI responses
- Multilingual sentiment and emotion analysis
- Sarcasm and urgency detection
- Account-compromise, duplicate-payment and legal-threat risk detection
- Conversation-history analysis
- Deterministic escalation rules
- Business-hours and after-hours routing
- On-call queue for urgent issues
- Next-working-day queue for normal after-hours complaints
- Escalation audit log
- Injectable clock for simulated-time tests
- Automated tests

## Setup
1. python -m venv venv
2. Windows: venv\\Scripts\\activate
3. pip install -r requirements.txt
4. Create .env with GEMINI_API_KEY=your_key
5. python app.py

Never commit .env or expose your API key.
