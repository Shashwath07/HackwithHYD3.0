# Architecture

```
Browser (frontend) -> Flask (backend) -> Hindsight Cloud (recall)
                                      -> Groq (generate reply)
                                      -> Hindsight Cloud (retain)
```

| Layer | File | Job |
|---|---|---|
| Frontend | `frontend/*` | Collects customer ID + message, shows the reply |
| Routes | `backend/routes/chat.py` | `POST /api/chat`, `GET /api/health` |
| Service | `backend/services/support_service.py` | Validate -> recall -> generate -> format -> store |
| Memory | `memory/memory_service.py` | One Hindsight bank per customer (`customer-<id>`) |
| Agent | `agent/prompts.py`, `llm.py`, `response.py` | Instructions, Groq call, output cleanup |

Request flow:
1. Customer sends `customer_id` + `message`.
2. Service validates input and loads the optional profile from `data/customers.json`.
3. Relevant memories are recalled from the customer's own bank.
4. Groq gets: support instructions + profile + memories + current question.
5. The reply is cleaned and returned.
6. The exchange is retained in Hindsight for future conversations.

If Hindsight fails, the customer still gets a reply (memory is skipped, and the error is logged).
