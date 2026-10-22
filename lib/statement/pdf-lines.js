import { getDocumentProxy } from "unpdf";

// Reads a text-based PDF and returns its visual lines (items grouped by vertical position, left → right).
// Columns are separated by two spaces so the parser can tell cells apart.
export async function pdfToLines(bytes, password) {
  let pdf;
  try {
    pdf = await getDocumentProxy(new Uint8Array(bytes), password ? { password } : {});
  } catch (error) {
    if (error?.name === "PasswordException") {
      const e = new Error(password ? "Wrong PDF password" : "This PDF is password protected");
      e.code = "PDF_PASSWORD";
      throw e;
    }
    throw new Error("Could not read this PDF");
  }

  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const { items } = await page.getTextContent();

    // Bucket items whose baselines are within 2.5pt of each other
    const rows = [];
    for (const it of items) {
      if (!it.str || !it.str.trim()) continue;
      const x = it.transform[4];
      const y = it.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) <= 2.5);
      if (!row) rows.push((row = { y, items: [] }));
      row.items.push({ x, end: x + (it.width || 0), str: it.str });
    }

    rows
      .sort((a, b) => b.y - a.y) // top of page first
      .forEach((row) => {
        row.items.sort((a, b) => a.x - b.x);
        let text = "";
        let lastEnd = null;
        for (const it of row.items) {
          if (lastEnd !== null) text += it.x - lastEnd > 6 ? "  " : it.x - lastEnd > 0.5 ? " " : "";
          text += it.str;
          lastEnd = it.end;
        }
        lines.push(text.trim());
      });
  }
  await pdf.destroy?.();
  return lines;
}
