from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.phishing import PhishingAnalysis
from app.models.user import User
from app.schemas.phishing import EmailAnalysisRequest, PhishingAnalysisResponse, UrlAnalysisRequest
from app.services.phishing_service import analyze_email_for_phishing, analyze_url_for_phishing

router = APIRouter(prefix="/phishing", tags=["Phishing Detection"])


@router.post("/analyze-url", response_model=PhishingAnalysisResponse, status_code=status.HTTP_201_CREATED)
def analyze_url(
    payload: UrlAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analyze_url_for_phishing(db, current_user.id, payload.url)


@router.post("/analyze-email", response_model=PhishingAnalysisResponse, status_code=status.HTTP_201_CREATED)
def analyze_email(
    payload: EmailAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analyze_email_for_phishing(db, current_user.id, payload.raw_email)


@router.get("/history", response_model=list[PhishingAnalysisResponse])
def get_history(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user), limit: int = 50
):
    return (
        db.query(PhishingAnalysis)
        .filter(PhishingAnalysis.user_id == current_user.id)
        .order_by(PhishingAnalysis.created_at.desc())
        .limit(limit)
        .all()
    )
