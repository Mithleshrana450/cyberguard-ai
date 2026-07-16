import json

from sqlalchemy.orm import Session

from app.models.phishing import AnalysisType, PhishingAnalysis
from app.services import phishing_analysis as pa
from app.services.phishing_ai import generate_explanation


def _findings_to_summary(findings: list[pa.Finding]) -> str:
    if not findings:
        return "No suspicious indicators detected."
    return "\n".join(f"- [{f.severity.upper()}] {f.title}: {f.description}" for f in findings)


def _findings_to_json(findings: list[pa.Finding]) -> str:
    return json.dumps([{"severity": f.severity, "title": f.title, "description": f.description} for f in findings])


def analyze_url_for_phishing(db: Session, user_id, url: str) -> PhishingAnalysis:
    findings = pa.analyze_url(url)
    score = pa.compute_risk_score(findings)
    level = pa.risk_level_from_score(score)
    explanation = generate_explanation(_findings_to_summary(findings), score)

    record = PhishingAnalysis(
        user_id=user_id,
        analysis_type=AnalysisType.URL,
        input_preview=url[:320],
        risk_score=score,
        risk_level=level,
        findings_json=_findings_to_json(findings),
        ai_explanation=explanation,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def analyze_email_for_phishing(db: Session, user_id, raw_email: str) -> PhishingAnalysis:
    email_findings, urls_found = pa.analyze_email(raw_email)

    all_findings = list(email_findings)
    for url in urls_found[:10]:  # cap to avoid pathological emails with hundreds of links
        all_findings.extend(pa.analyze_url(url))

    score = pa.compute_risk_score(all_findings)
    level = pa.risk_level_from_score(score)
    explanation = generate_explanation(_findings_to_summary(all_findings), score)

    record = PhishingAnalysis(
        user_id=user_id,
        analysis_type=AnalysisType.EMAIL,
        input_preview=raw_email[:320],
        risk_score=score,
        risk_level=level,
        findings_json=_findings_to_json(all_findings),
        ai_explanation=explanation,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
