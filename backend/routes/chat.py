from flask import Blueprint, current_app, jsonify, request

from agent.llm import LLMError
from backend.services.support_service import ValidationError, handle_message
from memory.memory_service import get_conversation_history


chat_bp = Blueprint("chat", __name__)


@chat_bp.get("/health")
def health():
    return jsonify(status="ok")


@chat_bp.get("/history/<customer_id>")
def history(customer_id):
    """
    Return the complete saved conversation for a customer.
    """
    customer_id = customer_id.strip()

    if not customer_id:
        return jsonify(error="Customer ID is required."), 400

    try:
        conversation = get_conversation_history(customer_id)

        return jsonify({
            "customer_id": customer_id,
            "conversation": conversation
        })

    except Exception:
        current_app.logger.exception(
            "Unexpected error loading history for %s",
            customer_id
        )

        return jsonify(
            error="Could not load conversation history."
        ), 500


@chat_bp.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}

    try:
        result = handle_message(
            data.get("customer_id", ""),
            data.get("message", "")
        )

        return jsonify(result)

    except ValidationError as e:
        return jsonify(error=str(e)), 400

    except LLMError as e:
        return jsonify(error=str(e)), 502

    except Exception:
        current_app.logger.exception(
            "Unexpected error in /api/chat"
        )

        return jsonify(
            error="Something went wrong. Please try again."
        ), 500