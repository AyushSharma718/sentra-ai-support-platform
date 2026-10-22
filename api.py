
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import TIMEZONE
from ai.gemini import generate_response
from conversation.memory import Conversation
from sentiment.analyzer import analyze
from escalation.engine import EscalationEngine
from escalation.queues import EscalationQueues
from escalation.logger import log_escalation

app = FastAPI(title="Gemini Multilingual Support Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = EscalationEngine()
queues = EscalationQueues()
conversations: dict[str, Conversation] = {}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: str | None = None


def get_conversation(conversation_id: str | None) -> Conversation:
    if conversation_id and conversation_id in conversations:
        return conversations[conversation_id]

    # A missing or unknown ID starts a new conversation.
    conversation = Conversation(
        conversation_id=str(uuid.uuid4()),
        started_at=datetime.now(ZoneInfo(TIMEZONE)),
    )
    conversations[conversation.conversation_id] = conversation
    return conversation


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Gemini Multilingual Support Bot"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    conversation = get_conversation(request.conversation_id)

    try:
        analysis = analyze(message, conversation.history_for_model())

        if analysis.get("sentiment") == "negative":
            conversation.negative_count += 1
            if conversation.last_negative_at is None:
                conversation.last_negative_at = engine.now()

        decision = engine.decide(message, analysis, conversation)

        if decision.required:
            summary = (
                f"Latest message: {message}. "
                f"Sentiment: {analysis.get('sentiment')}. "
                f"Risk: {analysis.get('risk')}. "
                f"Urgency: {analysis.get('urgency')}."
            )

            queues.add(
                decision.queue,
                {
                    "conversation_id": conversation.conversation_id,
                    "reason": decision.reason,
                    "condition": decision.condition,
                    "summary": summary,
                },
            )
            log_escalation(conversation.conversation_id, decision, summary)
            conversation.escalated = True

        answer = generate_response(
            message,
            conversation.history_for_model(),
            decision.tone,
            decision.required,
        )

        conversation.add(message, answer, analysis)

        return {
            "conversation_id": conversation.conversation_id,
            "message": message,
            "reply": answer,
            "analysis": analysis,
            "escalation": {
                "required": decision.required,
                "queue": decision.queue,
                "reason": decision.reason,
                "condition": decision.condition,
            },
            "scheduled_for_next_working_day": (
                not decision.required
                and decision.queue == "next_working_day"
            ),
            "history": conversation.history_for_model(),
        }

    except HTTPException:
        raise
    except Exception:
        # Keep API credentials and internal tracebacks out of responses.
        raise HTTPException(
            status_code=502,
            detail="The AI request failed. Check the backend terminal logs.",
        )


@app.get("/api/queues")
def get_queues():
    return queues.snapshot()


@app.get("/api/dashboard")
def dashboard():
    queue_snapshot = queues.snapshot()
    all_messages = [
        message
        for conversation in conversations.values()
        for message in conversation.messages
    ]

    risk_counts: dict[str, int] = {}
    sentiment_counts: dict[str, int] = {}

    for message in all_messages:
        analysis = message.get("analysis", {})
        risk = analysis.get("risk", "none")
        sentiment = analysis.get("sentiment", "unknown")

        if risk != "none":
            risk_counts[risk] = risk_counts.get(risk, 0) + 1

        sentiment_counts[sentiment] = (
            sentiment_counts.get(sentiment, 0) + 1
        )

    return {
        "total_conversations": len(conversations),
        "total_messages": len(all_messages),
        "escalated_conversations": sum(
            conversation.escalated
            for conversation in conversations.values()
        ),
        "queues": {
            name: len(items)
            for name, items in queue_snapshot.items()
        },
        "risk_counts": risk_counts,
        "sentiment_counts": sentiment_counts,
    }
