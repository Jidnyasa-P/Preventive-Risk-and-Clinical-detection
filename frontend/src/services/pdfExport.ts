import jsPDF from 'jspdf';
import { RiskResult } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTE  (RGB tuples)
// ─────────────────────────────────────────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  headerBg:   [22,  101, 87]  as RGB,   // deep teal
  accent:     [16,  185, 129] as RGB,   // emerald
  danger:     [185, 28,  28]  as RGB,   // red-700
  warning:    [180, 120, 10]  as RGB,   // amber-700
  success:    [21,  128, 61]  as RGB,   // green-700
  textDark:   [15,  23,  42]  as RGB,   // slate-900
  textMid:    [71,  85,  105] as RGB,   // slate-600
  textLight:  [148, 163, 184] as RGB,   // slate-400
  border:     [203, 213, 225] as RGB,   // slate-300
  bgLight:    [241, 245, 249] as RGB,   // slate-100
  bgWhite:    [255, 255, 255] as RGB,
  white:      [255, 255, 255] as RGB,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fill(doc: jsPDF, rgb: RGB)  { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function stroke(doc: jsPDF, rgb: RGB){ doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function ink(doc: jsPDF, rgb: RGB)   { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

function rect(doc: jsPDF, x: number, y: number, w: number, h: number, rgb: RGB) {
  fill(doc, rgb);
  doc.rect(x, y, w, h, 'F');
}

function box(doc: jsPDF, x: number, y: number, w: number, h: number, bgRgb: RGB, borderRgb?: RGB) {
  fill(doc, bgRgb);
  doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
  if (borderRgb) {
    stroke(doc, borderRgb);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 1.5, 1.5, 'S');
  }
}

/** Strip markdown and special unicode chars to plain ASCII-safe text */
function clean(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/[^\x00-\x7E]/g, (ch) => {
      const map: Record<string, string> = {
        '\u2013': '-', '\u2014': '-', '\u2018': "'", '\u2019': "'",
        '\u201C': '"', '\u201D': '"', '\u2022': '-', '\u2026': '...',
        '\u00B0': ' deg', '\u00B1': '+/-', '\u00D7': 'x', '\u00F7': '/',
        '\u2192': '->', '\u2190': '<-', '\u2191': '^', '\u2193': 'v',
        '\u2264': '<=', '\u2265': '>=', '\u00A0': ' ',
      };
      return map[ch] ?? ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function safeLines(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(clean(text), maxW);
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE CHROME
// ─────────────────────────────────────────────────────────────────────────────
function pageHeader(doc: jsPDF, W: number, subtitle: string) {
  rect(doc, 0, 0, W, 22, C.headerBg);
  rect(doc, 0, 0, 5, 22, C.accent);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  ink(doc, C.white);
  doc.text('PreventAI', 12, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  ink(doc, [134, 239, 172]);
  doc.text('Clinical Decision Support System', 12, 15.5);

  doc.setFontSize(7.5);
  ink(doc, [134, 239, 172]);
  doc.text(subtitle, W - 12, 9, { align: 'right' });
  doc.text('Generated: ' + new Date().toLocaleString(), W - 12, 15.5, { align: 'right' });
}

function pageFooter(doc: jsPDF, W: number, H: number, page: number, total: number) {
  stroke(doc, C.border);
  doc.setLineWidth(0.25);
  doc.line(12, H - 12, W - 12, H - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  ink(doc, C.textLight);
  doc.text('CONFIDENTIAL - For clinical use only. AI-generated report must be reviewed by a qualified healthcare professional.', 12, H - 7);
  doc.text('Page ' + page + ' of ' + total, W - 12, H - 7, { align: 'right' });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADING
// ─────────────────────────────────────────────────────────────────────────────
function sectionHeading(doc: jsPDF, label: string, x: number, y: number, w: number): number {
  rect(doc, x, y, 3, 7, C.accent);
  box(doc, x, y, w, 7, C.bgLight);
  rect(doc, x, y, 3, 7, C.accent);   // accent stripe on top

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  ink(doc, C.headerBg);
  doc.text(label.toUpperCase(), x + 6, y + 5);
  return y + 11;
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK GAUGE  (semicircle drawn with line segments - ASCII-safe)
// ─────────────────────────────────────────────────────────────────────────────
function drawGauge(doc: jsPDF, cx: number, cy: number, score: number, category: string) {
  const R = 22;
  const catColor: RGB = category === 'High' ? C.danger : category === 'Moderate' ? C.warning : C.success;

  // Outer ring (white bg)
  fill(doc, C.bgLight);
  doc.circle(cx, cy, R + 2, 'F');

  // Draw colored arc segments (semicircle from 180deg to 360deg)
  const arcSegments: { color: RGB; from: number; to: number }[] = [
    { color: C.success, from: 180, to: 240 },
    { color: C.warning, from: 240, to: 300 },
    { color: C.danger,  from: 300, to: 360 },
  ];
  for (const seg of arcSegments) {
    stroke(doc, seg.color);
    doc.setLineWidth(5);
    for (let a = seg.from; a < seg.to; a += 1.5) {
      const r1 = (a * Math.PI) / 180;
      const r2 = ((a + 1.5) * Math.PI) / 180;
      doc.line(cx + R * Math.cos(r1), cy + R * Math.sin(r1),
               cx + R * Math.cos(r2), cy + R * Math.sin(r2));
    }
  }

  // Inner white fill to make it look like a ring
  fill(doc, C.bgWhite);
  doc.circle(cx, cy, R - 6, 'F');

  // Needle
  const needleDeg = 180 + (score / 100) * 180;
  const nRad = (needleDeg * Math.PI) / 180;
  stroke(doc, catColor);
  doc.setLineWidth(1.5);
  doc.line(cx, cy, cx + (R - 2) * Math.cos(nRad), cy + (R - 2) * Math.sin(nRad));
  fill(doc, catColor);
  doc.circle(cx, cy, 2, 'F');

  // Score label inside
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  ink(doc, catColor);
  doc.text(score + '%', cx, cy + 5, { align: 'center' });

  // Category label below
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  ink(doc, C.textMid);
  doc.text(category + ' Risk', cx, cy + 11, { align: 'center' });

  // Zone labels
  doc.setFontSize(5.5);
  ink(doc, C.success);  doc.text('Low', cx - R - 2, cy + 2, { align: 'center' });
  ink(doc, C.warning);  doc.text('Mod', cx,          cy - R - 2, { align: 'center' });
  ink(doc, C.danger);   doc.text('High', cx + R + 4, cy + 2, { align: 'center' });
}

// ─────────────────────────────────────────────────────────────────────────────
// HORIZONTAL BAR CHART
// ─────────────────────────────────────────────────────────────────────────────
function drawBars(
  doc: jsPDF,
  data: { feature: string; importance: number }[],
  x: number, y: number, w: number,
  barColors?: RGB[]
) {
  const LABEL_W = 52;
  const BAR_H   = 6;
  const GAP     = 3.5;
  const chartW  = w - LABEL_W - 18;
  const defaultColors: RGB[] = [C.accent, C.headerBg, [59, 130, 246], [168, 85, 247], C.textLight];

  for (let i = 0; i < data.length; i++) {
    const { feature, importance } = data[i];
    const by = y + i * (BAR_H + GAP);
    const color = (barColors ?? defaultColors)[i % (barColors ?? defaultColors).length];

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    ink(doc, C.textDark);
    doc.text(clean(feature), x, by + BAR_H - 1);

    // Track
    fill(doc, C.bgLight);
    doc.roundedRect(x + LABEL_W, by, chartW, BAR_H, 1, 1, 'F');

    // Fill
    const fw = Math.max((importance / 100) * chartW, 3);
    fill(doc, color);
    doc.roundedRect(x + LABEL_W, by, fw, BAR_H, 1, 1, 'F');

    // Value label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    ink(doc, C.white);
    if (fw > 12) {
      doc.text(importance.toFixed(1) + '%', x + LABEL_W + fw - 2, by + BAR_H - 1, { align: 'right' });
    } else {
      ink(doc, C.textMid);
      doc.text(importance.toFixed(1) + '%', x + LABEL_W + fw + 3, by + BAR_H - 1);
    }
  }
  return y + data.length * (BAR_H + GAP);
}

// ─────────────────────────────────────────────────────────────────────────────
// BULLET LIST
// ─────────────────────────────────────────────────────────────────────────────
function bulletList(
  doc: jsPDF,
  items: string[],
  x: number, y: number, w: number,
  bgRgb?: RGB, dotRgb?: RGB
): number {
  const DOT  = dotRgb ?? C.accent;
  const BG   = bgRgb;
  const LINE_H = 5;
  const PAD    = 3;

  for (const item of items) {
    const text = clean(item);
    const lines = doc.splitTextToSize(text, w - 8);
    const rowH = Math.max(lines.length * LINE_H + PAD * 2, 10);

    if (BG) {
      fill(doc, BG);
      doc.roundedRect(x, y, w, rowH, 1, 1, 'F');
    }

    // Dot
    fill(doc, DOT);
    doc.circle(x + 4, y + LINE_H, 1.2, 'F');

    // Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    ink(doc, C.textDark);
    doc.text(lines, x + 8, y + LINE_H);

    y += rowH + 2;
  }
  return y;
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO-COLUMN LAYOUT HELPER
// ─────────────────────────────────────────────────────────────────────────────
function twoColSection(
  doc: jsPDF,
  leftTitle: string, leftItems: string[], leftDot: RGB, leftBg: RGB,
  rightTitle: string, rightItems: string[], rightDot: RGB, rightBg: RGB,
  x: number, y: number, totalW: number
): number {
  const colW = (totalW - 5) / 2;

  // Left header
  fill(doc, leftDot);
  doc.roundedRect(x, y, colW, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  ink(doc, C.white);
  doc.text(leftTitle, x + colW / 2, y + 5, { align: 'center' });

  // Right header
  fill(doc, rightDot);
  doc.roundedRect(x + colW + 5, y, colW, 7, 1, 1, 'F');
  ink(doc, C.white);
  doc.text(rightTitle, x + colW + 5 + colW / 2, y + 5, { align: 'center' });

  y += 9;
  const startY = y;

  // Left items
  let ly = startY;
  for (const item of leftItems) {
    const lines = doc.splitTextToSize(clean(item), colW - 8);
    const rowH = Math.max(lines.length * 5 + 6, 10);
    fill(doc, leftBg);
    doc.roundedRect(x, ly, colW, rowH, 1, 1, 'F');
    fill(doc, leftDot);
    doc.circle(x + 4, ly + 5.5, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    ink(doc, C.textDark);
    doc.text(lines, x + 8, ly + 5.5);
    ly += rowH + 2;
  }

  // Right items
  let ry = startY;
  for (const item of rightItems) {
    const lines = doc.splitTextToSize(clean(item), colW - 8);
    const rowH = Math.max(lines.length * 5 + 6, 10);
    fill(doc, rightBg);
    doc.roundedRect(x + colW + 5, ry, colW, rowH, 1, 1, 'F');
    fill(doc, rightDot);
    doc.circle(x + colW + 5 + 4, ry + 5.5, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    ink(doc, C.textDark);
    doc.text(lines, x + colW + 5 + 8, ry + 5.5);
    ry += rowH + 2;
  }

  return Math.max(ly, ry) + 4;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE BREAK HELPER
// ─────────────────────────────────────────────────────────────────────────────
function maybeNewPage(
  doc: jsPDF, y: number, needed: number,
  W: number, H: number, subtitle: string,
  pageRef: { page: number; total: number }
): number {
  if (y + needed > H - 20) {
    pageFooter(doc, W, H, pageRef.page, pageRef.total);
    doc.addPage();
    pageRef.page++;
    pageHeader(doc, W, subtitle);
    return 30;
  }
  return y;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT CLINICAL REPORT  (2 pages)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPatientReportPDF(result: RiskResult, patientInfo?: any) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const W    = 210;
  const H    = 297;
  const M    = 14;   // margin
  const CW   = W - M * 2;
  const SUB  = 'Patient Risk Assessment Report';
  const TOTAL_PAGES = 2;
  let y = 28;

  // ── PAGE 1 ────────────────────────────────────────────────────────────────
  pageHeader(doc, W, SUB);

  // ── Report Title Block ───────────────────────────────────────────────────
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  ink(doc, C.textDark);
  doc.text('Diabetes Risk Assessment Report', M, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  ink(doc, C.textMid);
  doc.text('PreventAI Clinical Decision Support System  |  Confidential Medical Document', M, y);
  y += 4;
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;

  // ── Risk Summary Card ────────────────────────────────────────────────────
  const catColor: RGB = result.riskCategory === 'High' ? C.danger
                      : result.riskCategory === 'Moderate' ? C.warning
                      : C.success;

  // Card background
  box(doc, M, y, CW, 58, C.bgLight, C.border);

  // Left: Gauge
  drawGauge(doc, M + 33, y + 30, result.riskScore, result.riskCategory);

  // Right: Info grid
  const infoX = M + 75;
  const col2X = M + 140;
  const rowH  = 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  ink(doc, C.textDark);
  doc.text('Risk Assessment Summary', infoX, y + 9);

  // Risk badge
  fill(doc, catColor);
  doc.roundedRect(infoX, y + 12, 45, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  ink(doc, C.white);
  doc.text(result.riskCategory.toUpperCase() + ' RISK  -  ' + result.riskScore + '%', infoX + 22.5, y + 17, { align: 'center' });

  const infoItems: [string, string][] = [
    ['Risk Score',       result.riskScore + '%'],
    ['Risk Category',    result.riskCategory],
    ['Report Date',      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Report ID',        'PAI-' + Date.now().toString().slice(-8)],
  ];
  if (patientInfo) {
    if (patientInfo.age)               infoItems.push(['Patient Age', patientInfo.age + ' years']);
    if (patientInfo.gender)            infoItems.push(['Gender', patientInfo.gender]);
    if (patientInfo.bmi)               infoItems.push(['BMI', String(patientInfo.bmi)]);
    if (patientInfo.hba1cLevel)        infoItems.push(['HbA1c Level', patientInfo.hba1cLevel + '%']);
    if (patientInfo.bloodGlucoseLevel) infoItems.push(['Blood Glucose', patientInfo.bloodGlucoseLevel + ' mg/dL']);
    if (patientInfo.smokingHistory)    infoItems.push(['Smoking History', patientInfo.smokingHistory]);
    if (patientInfo.hypertension !== undefined) infoItems.push(['Hypertension', patientInfo.hypertension ? 'Yes' : 'No']);
    if (patientInfo.heartDisease !== undefined)  infoItems.push(['Heart Disease', patientInfo.heartDisease ? 'Yes' : 'No']);
  }

  let gy = y + 22;
  const leftItems  = infoItems.slice(0, 4);
  const rightItems = infoItems.slice(4);

  for (const [label, value] of leftItems) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    ink(doc, C.textMid);
    doc.text(label + ':', infoX, gy);
    doc.setFont('helvetica', 'normal');
    ink(doc, C.textDark);
    doc.text(value, infoX + 32, gy);
    gy += rowH;
  }

  let gy2 = y + 22;
  for (const [label, value] of rightItems) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    ink(doc, C.textMid);
    doc.text(label + ':', col2X, gy2);
    doc.setFont('helvetica', 'normal');
    ink(doc, C.textDark);
    doc.text(value, col2X + 32, gy2);
    gy2 += rowH;
  }

  y += 65;

  // ── Feature Importance ───────────────────────────────────────────────────
  y = sectionHeading(doc, 'Key Risk Contributors  (SHAP Feature Importance)', M, y, CW);
  box(doc, M, y, CW, result.featureImportance.length * 9.5 + 6, C.bgWhite, C.border);
  y += 4;
  drawBars(doc, result.featureImportance, M + 4, y, CW - 6);
  y += result.featureImportance.length * 9.5 + 8;

  // ── Clinical Assessment ──────────────────────────────────────────────────
  y = sectionHeading(doc, 'Clinical Assessment  (Doctor View)', M, y, CW);
  const explLines = safeLines(doc, result.doctorView.explanation, CW - 8);
  const explH = explLines.length * 4.8 + 8;
  box(doc, M, y, CW, explH, C.bgLight, C.border);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  ink(doc, C.textDark);
  doc.text(explLines, M + 5, y + 6);
  y += explH + 6;

  // ── Diagnostic Tests + Recommendations ───────────────────────────────────
  y = sectionHeading(doc, 'Diagnostic Tests  &  Follow-up Recommendations', M, y, CW);
  y = twoColSection(
    doc,
    'SUGGESTED DIAGNOSTIC TESTS', result.doctorView.diagnosticTests,
    C.accent, [240, 253, 244],
    'FOLLOW-UP RECOMMENDATIONS', result.doctorView.recommendations,
    C.headerBg, [240, 253, 244],
    M, y, CW
  );

  pageFooter(doc, W, H, 1, TOTAL_PAGES);

  // ── PAGE 2 ────────────────────────────────────────────────────────────────
  doc.addPage();
  pageHeader(doc, W, SUB);
  y = 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  ink(doc, C.textDark);
  doc.text('Patient Health Guide', M, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  ink(doc, C.textMid);
  doc.text('Personalised guidance and actionable advice for the patient', M, y);
  y += 4;
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;

  // ── Patient Summary ──────────────────────────────────────────────────────
  y = sectionHeading(doc, 'Patient Summary', M, y, CW);
  const patLines = safeLines(doc, result.patientView.explanation, CW - 8);
  const patH = patLines.length * 4.8 + 8;
  box(doc, M, y, CW, patH, C.bgLight, C.border);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  ink(doc, C.textDark);
  doc.text(patLines, M + 5, y + 6);
  y += patH + 6;

  // ── Three columns: Diet / Lifestyle / Exercise ───────────────────────────
  y = sectionHeading(doc, 'Lifestyle, Diet & Exercise Recommendations', M, y, CW);

  const thirdW = (CW - 8) / 3;
  const colHeaders: { title: string; color: RGB }[] = [
    { title: 'DIETARY SUGGESTIONS', color: [161, 98, 7] },
    { title: 'LIFESTYLE ADVICE',    color: [30, 64, 175] },
    { title: 'EXERCISE PLAN',       color: [21, 128, 61] },
  ];
  const colBgs: RGB[] = [
    [255, 251, 235],
    [239, 246, 255],
    [240, 253, 244],
  ];
  const colItems = [
    result.patientView.dietSuggestions,
    result.patientView.lifestyleAdvice,
    result.patientView.exerciseRecommendations,
  ];

  // Draw column headers
  for (let ci = 0; ci < 3; ci++) {
    const cx = M + ci * (thirdW + 4);
    fill(doc, colHeaders[ci].color);
    doc.roundedRect(cx, y, thirdW, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    ink(doc, C.white);
    doc.text(colHeaders[ci].title, cx + thirdW / 2, y + 5, { align: 'center' });
  }
  y += 9;

  // Draw column items
  const colYs = [y, y, y];
  for (let ci = 0; ci < 3; ci++) {
    const cx = M + ci * (thirdW + 4);
    for (const item of colItems[ci]) {
      const lines = doc.splitTextToSize(clean(item), thirdW - 8);
      const rowH = Math.max(lines.length * 4.5 + 6, 10);
      fill(doc, colBgs[ci]);
      doc.roundedRect(cx, colYs[ci], thirdW, rowH, 1, 1, 'F');
      fill(doc, colHeaders[ci].color);
      doc.circle(cx + 4, colYs[ci] + 5, 1.2, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      ink(doc, C.textDark);
      doc.text(lines, cx + 8, colYs[ci] + 5);
      colYs[ci] += rowH + 2;
    }
  }
  y = Math.max(...colYs) + 6;

  // ── Risk Reduction Insights ──────────────────────────────────────────────
  y = sectionHeading(doc, 'Risk Reduction Insights', M, y, CW);
  for (let i = 0; i < result.counterfactuals.length; i++) {
    const cf = clean(result.counterfactuals[i]);
    const lines = doc.splitTextToSize((i + 1) + '. ' + cf, CW - 12);
    const rowH = Math.max(lines.length * 4.8 + 6, 11);

    const bgCol: RGB = i % 2 === 0 ? C.bgLight : [240, 253, 244];
    fill(doc, bgCol);
    doc.roundedRect(M, y, CW, rowH, 1, 1, 'F');

    // Left accent bar
    fill(doc, C.accent);
    doc.roundedRect(M, y, 2.5, rowH, 1, 1, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    ink(doc, C.textDark);
    doc.text(lines, M + 6, y + 5.5);
    y += rowH + 3;
  }

  y += 5;

  // ── Medical Disclaimer ───────────────────────────────────────────────────
  if (y > H - 50) {
    pageFooter(doc, W, H, 2, TOTAL_PAGES);
    doc.addPage();
    pageHeader(doc, W, SUB);
    y = 30;
  }

  // Red border disclaimer box
  fill(doc, [254, 242, 242]);
  doc.roundedRect(M, y, CW, 24, 2, 2, 'F');
  stroke(doc, [220, 38, 38]);
  doc.setLineWidth(0.5);
  doc.roundedRect(M, y, CW, 24, 2, 2, 'S');

  // Red left accent
  fill(doc, [220, 38, 38]);
  doc.roundedRect(M, y, 3, 24, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  ink(doc, C.danger);
  doc.text('MEDICAL DISCLAIMER', M + 7, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  ink(doc, [127, 29, 29]);
  const disclaimerText = 'This report is generated by an AI-powered clinical decision support system and is intended solely to assist qualified healthcare professionals. It is NOT a substitute for professional medical advice, diagnosis, or treatment. All AI-generated findings must be independently reviewed and validated by a licensed physician before any clinical decisions are made. Patient data is processed in accordance with applicable healthcare data protection regulations.';
  const discLines = doc.splitTextToSize(disclaimerText, CW - 12);
  doc.text(discLines, M + 7, y + 13);

  pageFooter(doc, W, H, 2, TOTAL_PAGES);

  const fname = 'PreventAI_Clinical_Report_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(fname);
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATE CLINICAL REPORT  (1 page)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportAggregateReportPDF() {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const W    = 210;
  const H    = 297;
  const M    = 14;
  const CW   = W - M * 2;
  const SUB  = 'Clinical Aggregate Report';
  let y = 28;

  pageHeader(doc, W, SUB);

  // ── Title ─────────────────────────────────────────────────────────────────
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  ink(doc, C.textDark);
  doc.text('Clinical Aggregate Report', M, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  ink(doc, C.textMid);
  doc.text('Period: Last 30 Days  |  Generated: ' + new Date().toLocaleString(), M, y);
  y += 4;
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;

  // ── KPI Cards ─────────────────────────────────────────────────────────────
  const kpis = [
    { label: 'Total Assessments', value: '1,284', change: '+12%', up: true },
    { label: 'High Risk Patients', value: '156',   change: '-4%',  up: false },
    { label: 'Avg. Risk Score',    value: '32%',   change: '+2%',  up: true },
    { label: 'Active Clinicians',  value: '24',    change: 'Stable', up: true },
  ];
  const kpiW = (CW - 9) / 4;
  for (let i = 0; i < kpis.length; i++) {
    const kx = M + i * (kpiW + 3);
    box(doc, kx, y, kpiW, 24, C.bgWhite, C.border);

    // Accent top bar
    fill(doc, i === 1 ? C.danger : C.accent);
    doc.roundedRect(kx, y, kpiW, 2, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    ink(doc, C.textDark);
    doc.text(kpis[i].value, kx + kpiW / 2, y + 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    ink(doc, C.textMid);
    doc.text(kpis[i].label, kx + kpiW / 2, y + 19, { align: 'center' });

    const changeRgb: RGB = kpis[i].up ? C.success : C.danger;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    ink(doc, changeRgb);
    doc.text(kpis[i].change, kx + kpiW / 2, y + 23, { align: 'center' });
  }
  y += 30;

  // ── Risk Distribution ─────────────────────────────────────────────────────
  y = sectionHeading(doc, 'Risk Distribution  (Current Period)', M, y, CW);

  const distData = [
    { feature: 'Low Risk  (842 patients)',      importance: 65, color: C.success },
    { feature: 'Moderate Risk  (286 patients)', importance: 22, color: C.warning },
    { feature: 'High Risk  (156 patients)',      importance: 13, color: C.danger  },
  ];
  box(doc, M, y, CW, distData.length * 9.5 + 10, C.bgWhite, C.border);
  y += 5;
  drawBars(doc, distData, M + 4, y, CW - 6,
    distData.map(d => d.color));
  y += distData.length * 9.5 + 10;

  // ── Monthly Trend Table ───────────────────────────────────────────────────
  y = sectionHeading(doc, 'Monthly Assessment Trend  (Aug - Jan)', M, y, CW);

  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const totals = [980, 1050, 1120, 1200, 1240, 1284];
  const highs  = [128, 140,  148,  152,  155,  156];

  // Table header
  const colCount = months.length + 1;
  const tColW    = CW / colCount;

  fill(doc, C.headerBg);
  doc.roundedRect(M, y, CW, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  ink(doc, C.white);
  doc.text('METRIC', M + tColW / 2, y + 5.5, { align: 'center' });
  for (let i = 0; i < months.length; i++) {
    doc.text(months[i], M + (i + 1) * tColW + tColW / 2, y + 5.5, { align: 'center' });
  }
  y += 8;

  // Row 1: Total Assessments
  fill(doc, C.bgLight);
  doc.rect(M, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  ink(doc, C.textMid);
  doc.text('Total Assessments', M + tColW / 2, y + 5.5, { align: 'center' });
  for (let i = 0; i < totals.length; i++) {
    doc.setFont('helvetica', 'normal');
    ink(doc, C.textDark);
    doc.text(String(totals[i]), M + (i + 1) * tColW + tColW / 2, y + 5.5, { align: 'center' });
  }
  y += 8;

  // Row 2: High Risk
  fill(doc, C.bgWhite);
  doc.rect(M, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  ink(doc, C.textMid);
  doc.text('High Risk Cases', M + tColW / 2, y + 5.5, { align: 'center' });
  for (let i = 0; i < highs.length; i++) {
    doc.setFont('helvetica', 'normal');
    ink(doc, C.danger);
    doc.text(String(highs[i]), M + (i + 1) * tColW + tColW / 2, y + 5.5, { align: 'center' });
  }
  y += 8;

  // Row 3: High Risk %
  fill(doc, C.bgLight);
  doc.rect(M, y, CW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  ink(doc, C.textMid);
  doc.text('High Risk %', M + tColW / 2, y + 5.5, { align: 'center' });
  for (let i = 0; i < highs.length; i++) {
    doc.setFont('helvetica', 'normal');
    ink(doc, C.warning);
    doc.text(((highs[i] / totals[i]) * 100).toFixed(1) + '%', M + (i + 1) * tColW + tColW / 2, y + 5.5, { align: 'center' });
  }
  y += 10;

  // ── Top Risk Factors ──────────────────────────────────────────────────────
  y = sectionHeading(doc, 'Top Risk Factors  (Average SHAP Importance Across All Patients)', M, y, CW);
  const factors = [
    { feature: 'HbA1c Level',         importance: 82 },
    { feature: 'Blood Glucose Level',  importance: 74 },
    { feature: 'BMI',                  importance: 68 },
    { feature: 'Age',                  importance: 55 },
    { feature: 'Hypertension',         importance: 42 },
  ];
  box(doc, M, y, CW, factors.length * 9.5 + 6, C.bgWhite, C.border);
  y += 4;
  drawBars(doc, factors, M + 4, y, CW - 6);
  y += factors.length * 9.5 + 10;

  // ── AI Clinical Insights ──────────────────────────────────────────────────
  y = sectionHeading(doc, 'AI Clinical Insights Summary', M, y, CW);

  const insights = [
    '15% increase in high-risk assessments among patients aged 45-60. Early intervention protocols have been triggered for 82% of these cases, resulting in timely referrals.',
    'Screening efficiency improved by 24% compared to the previous period. Average assessment completion time has been reduced to 3.2 minutes per patient.',
    'HbA1c monitoring frequency increased following implementation of the new clinical protocol. Overall compliance rate reached 91% this period.',
    'BMI remains the strongest modifiable risk factor across all assessed patients, with an average SHAP importance of 34.2%. Targeted weight management programmes are recommended.',
  ];

  for (let i = 0; i < insights.length; i++) {
    const lines = doc.splitTextToSize(clean(insights[i]), CW - 14);
    const rowH = Math.max(lines.length * 4.8 + 7, 12);
    const bgCol: RGB = i % 2 === 0 ? C.bgLight : C.bgWhite;
    fill(doc, bgCol);
    doc.roundedRect(M, y, CW, rowH, 1, 1, 'F');
    fill(doc, C.accent);
    doc.roundedRect(M, y, 2.5, rowH, 1, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    ink(doc, C.textDark);
    doc.text(lines, M + 7, y + 5.5);
    y += rowH + 2;
  }

  y += 5;

  // ── Disclaimer ────────────────────────────────────────────────────────────
  fill(doc, [254, 242, 242]);
  doc.roundedRect(M, y, CW, 18, 2, 2, 'F');
  stroke(doc, [220, 38, 38]);
  doc.setLineWidth(0.4);
  doc.roundedRect(M, y, CW, 18, 2, 2, 'S');
  fill(doc, [220, 38, 38]);
  doc.roundedRect(M, y, 3, 18, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  ink(doc, C.danger);
  doc.text('MEDICAL DISCLAIMER', M + 7, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  ink(doc, [127, 29, 29]);
  const disc2 = doc.splitTextToSize(
    'This aggregate report is generated by an AI clinical decision support system. Data is presented for informational purposes only and must not be used as a sole basis for clinical decisions. All findings require independent review by qualified healthcare professionals.',
    CW - 12
  );
  doc.text(disc2, M + 7, y + 11.5);

  pageFooter(doc, W, H, 1, 1);

  const fname = 'PreventAI_Aggregate_Report_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(fname);
}
