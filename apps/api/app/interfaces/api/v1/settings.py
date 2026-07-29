# ruff: noqa: N815

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.settings_model import OperationalSettingsModel
from app.infrastructure.database.session import get_db

router = APIRouter(prefix="/settings", tags=["Configurações"])


class SettingsPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    organizationName: str = Field(min_length=2, max_length=255)
    timezone: str = "America/Sao_Paulo"
    aprApprovalRequired: bool = True
    criticalIncidentNotifications: bool = True
    checklistReminderHour: int = Field(default=7, ge=0, le=23)
    evidenceRetentionDays: int = Field(default=365, ge=30, le=3650)
    supportEmail: str | None = Field(
        default=None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    )
    reportFooter: str | None = Field(default=None, max_length=1000)


class SettingsResponse(SettingsPayload):
    id: str
    updatedAt: str


def _response(settings: OperationalSettingsModel) -> SettingsResponse:
    return SettingsResponse(
        id=settings.id,
        organizationName=settings.organization_name,
        timezone=settings.timezone,
        aprApprovalRequired=settings.apr_approval_required,
        criticalIncidentNotifications=settings.critical_incident_notifications,
        checklistReminderHour=settings.checklist_reminder_hour,
        evidenceRetentionDays=settings.evidence_retention_days,
        supportEmail=settings.support_email,
        reportFooter=settings.report_footer,
        updatedAt=settings.updated_at.isoformat(),
    )


async def _get_or_create(session: AsyncSession) -> OperationalSettingsModel:
    settings = await session.scalar(select(OperationalSettingsModel).limit(1))
    if settings:
        return settings
    settings = OperationalSettingsModel(
        organization_name="NexusOps",
        timezone="America/Sao_Paulo",
        apr_approval_required=True,
        critical_incident_notifications=True,
        checklist_reminder_hour=7,
        evidence_retention_days=365,
    )
    session.add(settings)
    await session.commit()
    await session.refresh(settings)
    return settings


@router.get("", response_model=SettingsResponse)
async def get_settings(
    session: AsyncSession = Depends(get_db),
) -> SettingsResponse:
    return _response(await _get_or_create(session))


@router.put("", response_model=SettingsResponse)
async def update_settings(
    payload: SettingsPayload, session: AsyncSession = Depends(get_db)
) -> SettingsResponse:
    settings = await _get_or_create(session)
    settings.organization_name = payload.organizationName.strip()
    settings.timezone = payload.timezone
    settings.apr_approval_required = payload.aprApprovalRequired
    settings.critical_incident_notifications = (
        payload.criticalIncidentNotifications
    )
    settings.checklist_reminder_hour = payload.checklistReminderHour
    settings.evidence_retention_days = payload.evidenceRetentionDays
    settings.support_email = (
        payload.supportEmail if payload.supportEmail else None
    )
    settings.report_footer = payload.reportFooter
    await session.commit()
    await session.refresh(settings)
    return _response(settings)
