import base64
import io
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

NEXUS_NAVY = colors.HexColor("#061F4A")
NEXUS_BLUE = colors.HexColor("#0757C8")
NEXUS_CYAN = colors.HexColor("#00B8E6")
SURFACE = colors.HexColor("#F5F7FA")
TEXT = colors.HexColor("#17202E")
MUTED = colors.HexColor("#667085")
SUCCESS = colors.HexColor("#15803D")
DANGER = colors.HexColor("#B42318")


@dataclass(frozen=True)
class ReportAnswer:
    question: str
    value: str
    category: str = "Geral"
    notes: Optional[str] = None


@dataclass(frozen=True)
class ReportEvidence:
    description: str
    captured_at: str
    data_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@dataclass(frozen=True)
class SignaturePoint:
    x: float
    y: float


@dataclass(frozen=True)
class ReportSignature:
    signer_name: str
    signed_at: str
    strokes: list[list[SignaturePoint]] = field(default_factory=list)


@dataclass(frozen=True)
class InspectionReportData:
    inspection_id: str
    title: str
    technician_name: str
    completed_at: str
    template_version: str
    vehicle_plate: Optional[str] = None
    vehicle_model: Optional[str] = None
    service_order_number: Optional[str] = None
    notes: Optional[str] = None
    answers: list[ReportAnswer] = field(default_factory=list)
    evidences: list[ReportEvidence] = field(default_factory=list)
    signature: Optional[ReportSignature] = None


def _decode_data_url(data_url: str) -> bytes:
    header, encoded = data_url.split(",", 1)
    if ";base64" in header:
        return base64.b64decode(encoded)
    from urllib.parse import unquote_to_bytes

    return unquote_to_bytes(encoded)


def _format_datetime(value: str) -> str:
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        return parsed.strftime("%d/%m/%Y %H:%M")
    except ValueError:
        return value


def _header_footer(canvas, document) -> None:
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(NEXUS_NAVY)
    canvas.rect(0, height - 22 * mm, width, 22 * mm, fill=1, stroke=0)
    canvas.setFillColor(NEXUS_BLUE)
    canvas.roundRect(14 * mm, height - 17 * mm, 10 * mm, 10 * mm, 2 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 13)
    canvas.drawCentredString(19 * mm, height - 13.7 * mm, "N")
    canvas.setFont("Helvetica-Bold", 14)
    canvas.drawString(28 * mm, height - 12.5 * mm, "NexusOps")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#D6E0EF"))
    canvas.drawString(28 * mm, height - 17 * mm, "Laudo oficial de conformidade operacional")

    canvas.setStrokeColor(colors.HexColor("#D8E0E8"))
    canvas.line(14 * mm, 14 * mm, width - 14 * mm, 14 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(14 * mm, 9 * mm, "Documento rastreável gerado pelo backend NexusOps")
    canvas.drawRightString(width - 14 * mm, 9 * mm, f"Página {document.page}")
    canvas.restoreState()


def _signature_drawing(signature: ReportSignature, width: float, height: float):
    from reportlab.graphics.shapes import Drawing, Path

    drawing = Drawing(width, height)
    all_points = [point for stroke in signature.strokes for point in stroke]
    if not all_points:
        return drawing

    max_x = max(point.x for point in all_points) or 1
    max_y = max(point.y for point in all_points) or 1
    scale_x = width / max_x
    scale_y = height / max_y
    scale = min(scale_x, scale_y)

    for stroke in signature.strokes:
        if not stroke:
            continue
        path = Path()
        path.moveTo(stroke[0].x * scale, height - stroke[0].y * scale)
        for point in stroke[1:]:
            path.lineTo(point.x * scale, height - point.y * scale)
        path.strokeColor = NEXUS_NAVY
        path.strokeWidth = 1.4
        path.fillColor = None
        drawing.add(path)
    return drawing


def generate_inspection_report(data: InspectionReportData) -> bytes:
    output = io.BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=30 * mm,
        bottomMargin=20 * mm,
        title=f"Laudo - {data.title}",
        author="NexusOps",
        subject=f"Inspeção {data.inspection_id}",
    )
    base_styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=base_styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=17,
        leading=21,
        textColor=NEXUS_NAVY,
        spaceAfter=4 * mm,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=base_styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=NEXUS_NAVY,
        spaceBefore=4 * mm,
        spaceAfter=2 * mm,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=base_styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=TEXT,
        alignment=TA_LEFT,
    )
    small_style = ParagraphStyle(
        "Small",
        parent=body_style,
        fontSize=7.5,
        leading=10,
        textColor=MUTED,
    )

    story = [
        Paragraph(data.title, title_style),
        Paragraph(
            f"Inspeção <b>{data.inspection_id}</b> · Template v{data.template_version}",
            small_style,
        ),
        Spacer(1, 3 * mm),
    ]

    overview_rows = [
        ["Técnico responsável", data.technician_name],
        ["Concluída em", _format_datetime(data.completed_at)],
    ]
    if data.vehicle_plate:
        overview_rows.append(
            ["Veículo", f"{data.vehicle_model or 'Não informado'} · {data.vehicle_plate}"]
        )
    if data.service_order_number:
        overview_rows.append(["Ordem de serviço", data.service_order_number])

    overview = Table(overview_rows, colWidths=[42 * mm, 126 * mm])
    overview.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), SURFACE),
                ("TEXTCOLOR", (0, 0), (0, -1), NEXUS_NAVY),
                ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8E0E8")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([overview, Paragraph("Respostas do checklist", heading_style)])

    answer_rows = [["Categoria", "Verificação", "Resultado", "Observação"]]
    for answer in data.answers:
        display_value = {
            "NAO_CONFORME": "NÃO CONFORME",
            "NAO": "NÃO",
        }.get(answer.value, answer.value.replace("_", " "))
        result_color = SUCCESS if answer.value in {"CONFORME", "SIM", "APROVADO"} else (
            DANGER if answer.value in {"NAO_CONFORME", "NAO", "REPROVADO"} else MUTED
        )
        answer_rows.append(
            [
                Paragraph(answer.category, small_style),
                Paragraph(answer.question, body_style),
                Paragraph(
                    f'<font color="{result_color.hexval()}"><b>{display_value}</b></font>',
                    body_style,
                ),
                Paragraph(answer.notes or "-", small_style),
            ]
        )

    answers_table = Table(
        answer_rows,
        repeatRows=1,
        colWidths=[29 * mm, 78 * mm, 28 * mm, 33 * mm],
    )
    answers_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NEXUS_NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 7.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D8E0E8")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SURFACE]),
            ]
        )
    )
    story.append(answers_table)

    if data.notes:
        story.extend(
            [
                Paragraph("Observações gerais", heading_style),
                Table(
                    [[Paragraph(data.notes, body_style)]],
                    colWidths=[168 * mm],
                    style=TableStyle(
                        [
                            ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8E0E8")),
                            ("LEFTPADDING", (0, 0), (-1, -1), 8),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                            ("TOPPADDING", (0, 0), (-1, -1), 7),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                        ]
                    ),
                ),
            ]
        )

    if data.evidences:
        story.extend([PageBreak(), Paragraph("Evidências fotográficas", title_style)])
        for index, evidence in enumerate(data.evidences, start=1):
            evidence_content = [
                Paragraph(f"Evidência {index}: {evidence.description}", heading_style),
                Paragraph(
                    " · ".join(
                        filter(
                            None,
                            [
                                f"Capturada em {_format_datetime(evidence.captured_at)}",
                                (
                                    f"GPS {evidence.latitude:.6f}, {evidence.longitude:.6f}"
                                    if evidence.latitude is not None
                                    and evidence.longitude is not None
                                    else None
                                ),
                            ],
                        )
                    ),
                    small_style,
                ),
                Spacer(1, 2 * mm),
            ]
            if evidence.data_url:
                try:
                    image_bytes = _decode_data_url(evidence.data_url)
                    image_reader = ImageReader(io.BytesIO(image_bytes))
                    image_width, image_height = image_reader.getSize()
                    max_width = 160 * mm
                    max_height = 95 * mm
                    scale = min(max_width / image_width, max_height / image_height)
                    evidence_content.append(
                        Image(
                            io.BytesIO(image_bytes),
                            width=image_width * scale,
                            height=image_height * scale,
                        )
                    )
                except (ValueError, TypeError, base64.binascii.Error):
                    evidence_content.append(
                        Paragraph("Imagem indisponível para renderização.", small_style)
                    )
            else:
                evidence_content.append(
                    Paragraph("Arquivo armazenado no repositório de evidências.", small_style)
                )
            story.append(KeepTogether(evidence_content))

    if data.signature:
        signature = data.signature
        signature_drawing = _signature_drawing(signature, 75 * mm, 28 * mm)
        signature_table = Table(
            [
                [signature_drawing],
                [Paragraph(f"<b>{signature.signer_name}</b>", body_style)],
                [
                    Paragraph(
                        f"Assinado digitalmente em {_format_datetime(signature.signed_at)}",
                        small_style,
                    )
                ],
            ],
            colWidths=[80 * mm],
        )
        signature_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("BOX", (0, 0), (-1, 0), 0.5, colors.HexColor("#D8E0E8")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.extend(
            [
                Paragraph("Assinatura do responsável", heading_style),
                signature_table,
            ]
        )

    document.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    return output.getvalue()
