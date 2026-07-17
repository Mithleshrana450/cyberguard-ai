from sqlalchemy.orm import Session

from app.models.assistant import ChatMessage, MessageRole
from app.services.assistant_ai import generate_assistant_reply
from app.services.assistant_context import build_context_summary, gather_user_security_context

MAX_HISTORY_MESSAGES = 10  # caps token cost - older context isn't dropped
# from the database, just excluded from what's SENT to the API each turn.


def send_message(db: Session, user_id, user_message: str) -> tuple[ChatMessage, ChatMessage]:
    user_msg = ChatMessage(user_id=user_id, role=MessageRole.USER, content=user_message)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    recent_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(MAX_HISTORY_MESSAGES)
        .all()
    )
    recent_messages.reverse()  # oldest first, matching conversational order

    conversation = [{"role": m.role.value, "content": m.content} for m in recent_messages]

    context = gather_user_security_context(db, user_id)
    context_summary = build_context_summary(context)

    reply_text = generate_assistant_reply(context_summary, conversation)

    assistant_msg = ChatMessage(user_id=user_id, role=MessageRole.ASSISTANT, content=reply_text)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return user_msg, assistant_msg


def clear_history(db: Session, user_id) -> None:
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
    db.commit()
