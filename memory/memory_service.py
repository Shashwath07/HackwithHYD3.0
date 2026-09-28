import json
import logging
import os
import re
from datetime import datetime, timezone

from memory.hindsight_client import run_hindsight


log = logging.getLogger(__name__)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
CONVERSATIONS_FILE = os.path.join(DATA_DIR, "conversations.json")


def bank_id_for(customer_id):
    """Create one isolated Hindsight memory bank per customer."""
    safe = re.sub(r"[^a-z0-9_-]", "-", customer_id.strip().lower())
    return f"customer-{safe}"


def _ensure_storage():
    """Create the persistent conversation storage if it doesn't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(CONVERSATIONS_FILE):
        with open(CONVERSATIONS_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, indent=2)


def _load_conversations():
    """Load all persistent conversations from disk."""
    _ensure_storage()

    try:
        with open(CONVERSATIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        return data if isinstance(data, dict) else {}

    except (OSError, ValueError):
        log.exception("Could not load conversation history.")
        return {}


def _save_conversations(data):
    """Save all conversations permanently to disk."""
    _ensure_storage()

    temp_file = CONVERSATIONS_FILE + ".tmp"

    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    os.replace(temp_file, CONVERSATIONS_FILE)


def get_conversation_history(customer_id):
    """
    Return the complete chronological conversation for one customer.
    This is used to restore the visible chat after refresh/reopening.
    """
    customer_id = customer_id.strip()

    conversations = _load_conversations()

    history = conversations.get(customer_id, [])

    if not isinstance(history, list):
        return []

    return history


def store_interaction(customer_id, message, reply):
    """
    Save the conversation locally and retain it in Hindsight.
    """

    customer_id = customer_id.strip()

    # Save local conversation
    conversations = _load_conversations()

    history = conversations.setdefault(customer_id, [])

    timestamp = datetime.now(timezone.utc).isoformat()

    history.append({
        "role": "user",
        "content": message,
        "timestamp": timestamp
    })

    history.append({
        "role": "agent",
        "content": reply,
        "timestamp": timestamp
    })

    _save_conversations(conversations)

    # Save to Hindsight
    content = (
        f"Customer said: {message}\n"
        f"Support agent replied: {reply}"
    )

    try:
        run_hindsight(
            lambda client: client.retain(
                bank_id=bank_id_for(customer_id),
                content=content,
                context="Customer support conversation"
            )
        )

        return True

    except Exception as e:
        log.warning(
            "Hindsight retain failed for %s: %s",
            customer_id,
            e
        )

        return False

def get_relevant_memories(customer_id, query, limit=5):
    """
    Retrieve semantically relevant long-term memories from Hindsight.
    """
    try:
        response = run_hindsight(
            lambda client: client.recall(
                bank_id=bank_id_for(customer_id),
                query=query
            )
        )

        results = getattr(response, "results", response) or []

        return [
            r.text
            for r in list(results)[:limit]
            if getattr(r, "text", None)
        ]

    except Exception as e:
        log.warning(
            "Hindsight recall failed for %s: %s",
            customer_id,
            e
        )

        return []