# Customer Support AI Agent

A support chatbot with persistent per-customer memory.
Hindsight Cloud remembers, Groq generates, Flask coordinates.

## Problem
Chatbots forget earlier conversations, so customers repeat themselves.

## Solution
Each customer gets a separate Hindsight memory bank. For every message the backend
recalls relevant memories, asks Groq to answer using them plus the support
instructions, returns the reply, and stores the new exchange.

## Tech
Python, Flask, Groq, Hindsight Cloud, HTML/CSS/JavaScript.

## Setup
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Edit `.env` and add your `GROQ_API_KEY` and `HINDSIGHT_API_KEY`. Never commit `.env`.

## Run
```bash
python backend/app.py
```
Open http://localhost:5000, enter an ID such as `C1001`, and chat.

## Test
```bash
pytest
```

## Structure
```
backend/   app.py, routes/, services/
memory/    hindsight_client.py, memory_service.py
agent/     llm.py, prompts.py, response.py
frontend/  index.html, style.css, script.js
data/      customers.json
docs/      architecture.md, demo.md
```
See `docs/demo.md` for the demo walkthrough.
