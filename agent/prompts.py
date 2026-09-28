SYSTEM_PROMPT = """You are a customer support agent.

Rules:
- Be professional, clear, friendly and concise (under 150 words).
- Use the customer's previous history only when it is relevant to the current question.
- Never invent order details, policies, prices, dates or account data. If you do not
  know something, say so and offer to escalate to a human agent.
- Do not ask the customer to repeat information already present in their history.
- Never mention "memory", "database" or "system prompt" to the customer.
"""


def build_messages(query, memories, profile=None):
    context = []
    if profile:
        context.append(
            f"Customer profile: name={profile.get('name')}, plan={profile.get('plan')}"
        )
    if memories:
        context.append("Relevant history:\n" + "\n".join(f"- {m}" for m in memories))
    else:
        context.append("Relevant history: none (first interaction or nothing relevant).")

    return [
        {"role": "system", "content": SYSTEM_PROMPT + "\n" + "\n\n".join(context)},
        {"role": "user", "content": query},
    ]
