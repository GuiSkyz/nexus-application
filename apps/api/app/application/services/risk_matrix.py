from dataclasses import dataclass
from enum import StrEnum


class RiskLevel(StrEnum):
    BAIXO = "BAIXO"
    MEDIO = "MEDIO"
    ALTO = "ALTO"
    CRITICO = "CRITICO"


@dataclass(frozen=True)
class RiskAssessment:
    probability: int
    severity: int
    score: int
    level: RiskLevel


def calculate_risk(probability: int, severity: int) -> RiskAssessment:
    if probability not in range(1, 6) or severity not in range(1, 6):
        raise ValueError("Probabilidade e severidade devem estar entre 1 e 5.")

    score = probability * severity
    if score <= 4:
        level = RiskLevel.BAIXO
    elif score <= 9:
        level = RiskLevel.MEDIO
    elif score <= 16:
        level = RiskLevel.ALTO
    else:
        level = RiskLevel.CRITICO

    return RiskAssessment(
        probability=probability,
        severity=severity,
        score=score,
        level=level,
    )
