from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.csv_export import dicts_to_csv
from app.services.pdf_report import generate_security_report_pdf
from app.services.report_data import REPORT_TYPES, get_report_rows, get_summary

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_summary(db, current_user.id)


@router.get("/csv/{report_type}")
def export_csv(
    report_type: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if report_type not in REPORT_TYPES:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"Unknown report type. Must be one of: {', '.join(REPORT_TYPES)}"
        )

    rows = get_report_rows(db, current_user.id, report_type)
    csv_content = dicts_to_csv(rows)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="cyberguard_{report_type}.csv"'},
    )


@router.get("/pdf")
def export_pdf(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    summary_data = get_summary(db, current_user.id)
    pdf_bytes = generate_security_report_pdf(summary_data, current_user.email)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="cyberguard_security_report.pdf"'},
    )
