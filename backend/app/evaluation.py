import io
import json
import csv
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from .model_loader import model_manager
from .config import REPORTS_DIR

def calculate_evaluation_metrics(y_true: List[str], y_pred: List[str], inference_times: List[float], classes: Optional[List[str]] = None) -> Dict[str, Any]:
    if not classes:
        classes = sorted(list(set(y_true + y_pred)))
    
    total = len(y_true)
    if total == 0:
        raise ValueError("Cannot calculate metrics on empty dataset")

    acc = float(accuracy_score(y_true, y_pred))
    prec_macro = float(precision_score(y_true, y_pred, labels=classes, average="macro", zero_division=0))
    rec_macro = float(recall_score(y_true, y_pred, labels=classes, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_true, y_pred, labels=classes, average="macro", zero_division=0))

    prec_weighted = float(precision_score(y_true, y_pred, labels=classes, average="weighted", zero_division=0))
    rec_weighted = float(recall_score(y_true, y_pred, labels=classes, average="weighted", zero_division=0))
    f1_weighted = float(f1_score(y_true, y_pred, labels=classes, average="weighted", zero_division=0))

    cm = confusion_matrix(y_true, y_pred, labels=classes).tolist()
    report_dict = classification_report(y_true, y_pred, labels=classes, output_dict=True, zero_division=0)

    avg_time = float(np.mean(inference_times)) if inference_times else 0.0
    med_time = float(np.median(inference_times)) if inference_times else 0.0

    eval_result = {
        "accuracy": round(acc, 4),
        "precision_macro": round(prec_macro, 4),
        "recall_macro": round(rec_macro, 4),
        "f1_macro": round(f1_macro, 4),
        "precision_weighted": round(prec_weighted, 4),
        "recall_weighted": round(rec_weighted, 4),
        "f1_weighted": round(f1_weighted, 4),
        "total_samples": total,
        "successful_predictions": total,
        "failed_predictions": 0,
        "avg_inference_time_ms": round(avg_time, 2),
        "median_inference_time_ms": round(med_time, 2),
        "confusion_matrix": cm,
        "classes": classes,
        "classification_report": report_dict,
        "evaluation_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "model_name": model_manager.model_path.name if model_manager.model_path else "crop_disease_model.tflite"
    }

    # Save latest evaluation result to disk
    result_path = REPORTS_DIR / "latest_evaluation.json"
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(eval_result, f, indent=2)

    return eval_result

def get_latest_evaluation() -> Optional[Dict[str, Any]]:
    result_path = REPORTS_DIR / "latest_evaluation.json"
    if result_path.exists():
        with open(result_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def export_predictions_csv(predictions: List[Dict[str, Any]]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Filename", "Predicted Class", "Confidence (%)", "Inference Time (ms)", "Ground Truth", "Is Correct", "Timestamp"])
    for p in predictions:
        writer.writerow([
            p.get("filename", ""),
            p.get("predicted_class", ""),
            f"{p.get('confidence', 0) * 100:.2f}",
            p.get("inference_time_ms", 0),
            p.get("ground_truth", "N/A"),
            p.get("is_correct", "N/A"),
            p.get("timestamp", "")
        ])
    return output.getvalue()

def export_classification_report_csv(report_dict: Dict[str, Any]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Class Name", "Precision", "Recall", "F1-Score", "Support"])
    for key, metrics in report_dict.items():
        if isinstance(metrics, dict):
            writer.writerow([
                key,
                round(metrics.get("precision", 0), 4),
                round(metrics.get("recall", 0), 4),
                round(metrics.get("f1-score", 0), 4),
                metrics.get("support", 0)
            ])
    return output.getvalue()

def generate_pdf_report(metrics: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#166534'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1f2937'),
        spaceBefore=10,
        spaceAfter=8
    )
    normal_style = ParagraphStyle(
        'NormalSmall',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#374151')
    )

    story = []
    story.append(Paragraph("Crop Disease AI — Model Evaluation Report", title_style))
    story.append(Paragraph(f"Model: <b>{metrics.get('model_name')}</b> | Date: {metrics.get('evaluation_date')} | Samples: {metrics.get('total_samples')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e5e7eb'), spaceAfter=15))

    story.append(Paragraph("1. Primary Performance Metrics", h2_style))
    summary_data = [
        ["Metric", "Value", "Metric", "Value"],
        ["Overall Accuracy", f"{metrics.get('accuracy', 0)*100:.2f}%", "Macro F1-Score", f"{metrics.get('f1_macro', 0)*100:.2f}%"],
        ["Macro Precision", f"{metrics.get('precision_macro', 0)*100:.2f}%", "Weighted F1-Score", f"{metrics.get('f1_weighted', 0)*100:.2f}%"],
        ["Macro Recall", f"{metrics.get('recall_macro', 0)*100:.2f}%", "Avg Inference Time", f"{metrics.get('avg_inference_time_ms', 0):.2f} ms"],
        ["Total Test Samples", str(metrics.get('total_samples', 0)), "Median Inference Time", f"{metrics.get('median_inference_time_ms', 0):.2f} ms"]
    ]
    t = Table(summary_data, colWidths=[130, 130, 130, 130])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0fdf4')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#166534')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('FONTSIZE', (0,0), (-1,-1), 9)
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    story.append(Paragraph("2. Per-Class Performance Summary (Top Classes)", h2_style))
    class_headers = ["Class / Condition", "Precision", "Recall", "F1-Score", "Support"]
    class_rows = [class_headers]
    rep = metrics.get("classification_report", {})
    count = 0
    for k, v in rep.items():
        if isinstance(v, dict) and k not in ("accuracy", "macro avg", "weighted avg") and count < 18:
            short_name = k.replace("___", " : ").replace("_", " ")[:32]
            class_rows.append([
                short_name,
                f"{v.get('precision', 0)*100:.1f}%",
                f"{v.get('recall', 0)*100:.1f}%",
                f"{v.get('f1-score', 0)*100:.1f}%",
                str(v.get('support', 0))
            ])
            count += 1
    
    t_classes = Table(class_rows, colWidths=[220, 75, 75, 75, 75])
    t_classes.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f9fafb')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#374151')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('FONTSIZE', (0,0), (-1,-1), 8)
    ]))
    story.append(t_classes)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Model Operational Notes & Disclaimer", h2_style))
    disclaimer_text = (
        "This evaluation report reflects testing on the specified local dataset sample. "
        "Reported metrics quantify visual classification performance of the MobileNetV3 TensorFlow Lite model. "
        "Predictions should be used as decision-support guidance for agricultural extension rather than definitive chemical treatment mandates."
    )
    story.append(Paragraph(disclaimer_text, normal_style))

    doc.build(story)
    return buffer.getvalue()
