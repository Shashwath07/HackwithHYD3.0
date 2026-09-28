import json
import os
import re

from agent.llm import generate
from agent.prompts import build_messages
from agent.response import format_response
from memory.memory_service import get_relevant_memories, store_interaction

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CUSTOMERS_FILE = os.path.join(ROOT, "data", "customers.json")
ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,32}$")
MAX_MESSAGE_LEN = 1000


class ValidationError(Exception):
    pass


def _load_customers():
    try:
        with open(CUSTOMERS_FILE, encoding="utf-8") as f:
            return {c["id"].lower(): c for c in json.load(f)["customers"]}
    except (OSError, ValueError, KeyError):
        return {}


def _validate(customer_id, message):
    customer_id = (customer_id or "").strip()
    message = (message or "").strip()
    if not ID_PATTERN.match(customer_id):
        raise ValidationError("Enter a customer ID of 3-32 letters, numbers, - or _.")
    if not message:
        raise ValidationError("Type a message before sending.")
    if len(message) > MAX_MESSAGE_LEN:
        raise ValidationError(f"Keep messages under {MAX_MESSAGE_LEN} characters.")
    return customer_id, message


def handle_message(customer_id, message):
    customer_id, message = _validate(customer_id, message)

    profile = _load_customers().get(customer_id.lower())
    strict = os.getenv("STRICT_CUSTOMER_VALIDATION", "false").lower() == "true"
    if strict and not profile:
        raise ValidationError("Customer ID not found.")

    memories = get_relevant_memories(customer_id, message)
    raw = generate(build_messages(message, memories, profile))
    reply = format_response(raw)
    saved = store_interaction(customer_id, message, reply)

    return {
        "reply": reply,
        "customer_id": customer_id,
        "memories_used": len(memories),
        "memory_saved": saved,
    }
