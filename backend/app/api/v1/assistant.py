from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.assistant import ChatMessage
from app.models.user import User
from app.schemas.assistant import ChatReplyResponse, ChatRequest, ChatMessageResponse
from app.services.assistant_service import clear_history, send_message

router = APIRouter(prefix="/assistant", tags=["AI Security Assistant"])


@router.post("/chat", response_model=ChatReplyResponse, status_code=status.HTTP_201_CREATED)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_msg, assistant_msg = send_message(db, current_user.id, payload.message)
    return ChatReplyResponse(user_message=user_msg, assistant_message=assistant_msg)


@router.get("/history", response_model=list[ChatMessageResponse])
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    clear_history(db, current_user.id)
