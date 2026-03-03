import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { CardData } from "../types";

// ─── Clean card: screenshot the live grid ─────────────────────────────────────

export const exportCardPdf = async (card: CardData): Promise<void> => {
  const el = document.getElementById("bingo-card-grid");
  if (!el) return;

  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`${card.name}.pdf`);
};

// ─── Full progress report ─────────────────────────────────────────────────────

export const exportReportPdf = (card: CardData): void => {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 16;
  const col = pageW - margin * 2;
  let y = margin;

  // Title
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text(card.name, margin, y);
  y += 10;

  // Subtitle
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(120);
  const completed = card.goals.filter((g) => g.completed).length;
  pdf.text(
    `${card.gridDim}×${card.gridDim} card · ${completed}/${card.goals.length} goals completed · Generated ${new Date().toLocaleDateString()}`,
    margin,
    y
  );
  y += 8;

  // Divider
  pdf.setDrawColor(220);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  pdf.setTextColor(0);

  card.goals.forEach((goal, i) => {
    // Page break
    if (y > 265) {
      pdf.addPage();
      y = margin;
    }

    const pct =
      goal.finalCount > 1
        ? `${goal.curCount}/${goal.finalCount} (${Math.round((goal.curCount / goal.finalCount) * 100)}%)`
        : goal.completed
        ? "Complete"
        : "Not started";

    // Goal title
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${i + 1}. ${goal.title || "(untitled)"}`, margin, y);

    // Status badge
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(goal.completed ? 40 : 120);
    pdf.text(pct, pageW - margin, y, { align: "right" });
    pdf.setTextColor(0);
    y += 5;

    // Description
    if (goal.description) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100);
      const lines = pdf.splitTextToSize(goal.description, col);
      pdf.text(lines, margin + 4, y);
      y += lines.length * 4 + 2;
      pdf.setTextColor(0);
    }

    // Progress bar
    if (goal.finalCount > 1) {
      const barW = 80;
      const barH = 3;
      const fillW = (goal.curCount / goal.finalCount) * barW;
      pdf.setFillColor(230);
      pdf.roundedRect(margin + 4, y, barW, barH, 1, 1, "F");
      pdf.setFillColor(245, 87, 108);
      if (fillW > 0) pdf.roundedRect(margin + 4, y, fillW, barH, 1, 1, "F");
      y += 6;
    }

    // Target date
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(`Target: ${goal.completeDate}`, margin + 4, y);
    pdf.setTextColor(0);
    y += 7;

    // Row divider
    pdf.setDrawColor(240);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;
  });

  pdf.save(`${card.name} — Progress Report.pdf`);
};
