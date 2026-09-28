from agent.prompts import build_messages
from agent.response import FALLBACK, format_response
from memory.memory_service import bank_id_for


def test_bank_ids_are_separate_and_safe():
    assert bank_id_for("C1001") == "customer-c1001"
    assert bank_id_for("C1001") != bank_id_for("C1002")
    assert bank_id_for("a b/c") == "customer-a-b-c"


def test_empty_response_falls_back():
    assert format_response("   ") == FALLBACK
    assert format_response(None) == FALLBACK


def test_prompt_includes_memories():
    msgs = build_messages("Where is my order?", ["Ordered a laptop on Monday"])
    assert "Ordered a laptop" in msgs[0]["content"]
    assert msgs[1]["content"] == "Where is my order?"
