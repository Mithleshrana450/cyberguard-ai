import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.assistant import MessageRole


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatReplyResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
