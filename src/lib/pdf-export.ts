type PdfTextBlock = {
  text: string;
  kind: "title" | "meta" | "h1" | "h2" | "h3" | "p" | "li" | "table" | "rule";
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMultilineText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter((line, index, lines) => line.length > 0 || (index > 0 && lines[index - 1] !== ""))
    .join("\n")
    .trim();
}

type JsPdfLineWrapper = {
  splitTextToSize: (text: string, width: number) => string[];
};

function extractNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }

  if (!(node instanceof Element)) {
    return "";
  }

  if (node.tagName === "BR") {
    return "\n";
  }

  if (node.tagName === "A") {
    const label = normalizeWhitespace(node.textContent ?? "");
    const href = (node.getAttribute("href")?.trim() ?? "").replace(/[`"' ]+/g, "");
    if (href && label && href !== label) {
      return `${label} (${href})`;
    }
    return label || href;
  }

  return Array.from(node.childNodes)
    .map((child) => extractNodeText(child))
    .join("");
}

function extractTableText(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll("tr"));
  return rows
    .map((row) =>
      Array.from(row.querySelectorAll("th, td"))
        .map((cell) => normalizeWhitespace(extractNodeText(cell)))
        .filter(Boolean)
        .join(" | "),
    )
    .filter(Boolean)
    .join("\n");
}

function collectBlocksFromElement(element: Element): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];

  for (const child of Array.from(element.children)) {
    const tag = child.tagName.toLowerCase();

    if (tag === "h1") {
      const text = normalizeWhitespace(extractNodeText(child));
      if (text) blocks.push({ text, kind: "h1" });
      continue;
    }

    if (tag === "h2") {
      const text = normalizeWhitespace(extractNodeText(child));
      if (text) blocks.push({ text, kind: "h2" });
      continue;
    }

    if (tag === "h3") {
      const text = normalizeWhitespace(extractNodeText(child));
      if (text) blocks.push({ text, kind: "h3" });
      continue;
    }

    if (tag === "p") {
      const text = normalizeMultilineText(extractNodeText(child));
      if (text) blocks.push({ text, kind: "p" });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(child.querySelectorAll(":scope > li"));
      items.forEach((item, index) => {
        const normalizedItem = normalizeMultilineText(extractNodeText(item));
        if (!normalizedItem) return;
        const prefix = tag === "ol" ? `${index + 1}. ` : "- ";
        blocks.push({ text: `${prefix}${normalizedItem}`, kind: "li" });
      });
      continue;
    }

    if (tag === "table") {
      const text = extractTableText(child as HTMLTableElement);
      if (text) blocks.push({ text, kind: "table" });
      continue;
    }

    if (tag === "hr") {
      blocks.push({ text: "", kind: "rule" });
      continue;
    }

    blocks.push(...collectBlocksFromElement(child));
  }

  return blocks;
}

function splitTextIntoWrappedLines(
  doc: JsPdfLineWrapper,
  text: string,
  width: number,
) {
  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  paragraphs.forEach((paragraph, index) => {
    const cleanParagraph = paragraph.trim();

    if (!cleanParagraph) {
      if (index !== paragraphs.length - 1) {
        lines.push("");
      }
      return;
    }

    const wrapped = doc.splitTextToSize(cleanParagraph, width) as string[];
    lines.push(...wrapped);
  });

  return lines;
}

function isLabelValueLine(line: string) {
  return /^[A-Za-z][A-Za-z\s/()&-]{1,40}:\s+.+$/.test(line.trim());
}

export async function generatePdfFromHtml(htmlText: string, filename: string) {
  try {
    const [{ jsPDF }] = await Promise.all([import("jspdf")]);
    const parser = new DOMParser();
    const parsed = parser.parseFromString(htmlText, "text/html");

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const topMargin = 20;
    const bottomMargin = 18;
    const contentWidth = pageWidth - marginX * 2;
    let cursorY = topMargin;

    const ensurePageSpace = (neededHeight: number) => {
      if (cursorY + neededHeight <= pageHeight - bottomMargin) {
        return;
      }

      doc.addPage();
      cursorY = topMargin;
    };

    const drawDivider = (gapBefore: number, gapAfter: number) => {
      ensurePageSpace(gapBefore + gapAfter + 2);
      cursorY += gapBefore;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.35);
      doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
      cursorY += gapAfter;
    };

    const writeLabelValueLine = (
      line: string,
      options: {
        fontSize: number;
        lineHeight: number;
        gapAfter: number;
      },
    ) => {
      const matched = line.match(/^([^:]+:\s*)([\s\S]+)$/);
      if (!matched) {
        const fallbackLines = splitTextIntoWrappedLines(doc, line, contentWidth);
        const blockHeight = Math.max(fallbackLines.length, 1) * options.lineHeight;
        ensurePageSpace(blockHeight + options.gapAfter);
        doc.setFont("times", "normal");
        doc.setFontSize(options.fontSize);
        doc.text(fallbackLines, marginX, cursorY);
        cursorY += blockHeight + options.gapAfter;
        return;
      }

      const label = matched[1].trimEnd();
      const value = matched[2].trim();
      const labelWidth = Math.min(doc.getTextWidth(label), contentWidth * 0.38);
      const valueWidth = Math.max(contentWidth - labelWidth - 1.5, contentWidth * 0.55);
      const valueLines = splitTextIntoWrappedLines(doc, value, valueWidth);
      const blockHeight = Math.max(valueLines.length, 1) * options.lineHeight;
      ensurePageSpace(blockHeight + options.gapAfter);
      doc.setFontSize(options.fontSize);
      doc.setFont("times", "bold");
      doc.text(label, marginX, cursorY);
      doc.setFont("times", "normal");
      doc.text(valueLines, marginX + labelWidth + 1.5, cursorY);
      cursorY += blockHeight + options.gapAfter;
    };

    const writeBlock = (
      text: string,
      options: {
        fontSize: number;
        lineHeight: number;
        fontStyle?: "normal" | "bold";
        gapAfter: number;
      },
    ) => {
      const labelLines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (labelLines.length > 1 && labelLines.every(isLabelValueLine)) {
        labelLines.forEach((line, index) => {
          writeLabelValueLine(line, {
            fontSize: options.fontSize,
            lineHeight: options.lineHeight,
            gapAfter: index === labelLines.length - 1 ? options.gapAfter : 1.1,
          });
        });
        return;
      }

      const lines = splitTextIntoWrappedLines(doc, text, contentWidth);
      const blockHeight = Math.max(lines.length, 1) * options.lineHeight;
      ensurePageSpace(blockHeight + options.gapAfter);
      doc.setFont("times", options.fontStyle ?? "normal");
      doc.setFontSize(options.fontSize);
      doc.text(lines, marginX, cursorY);
      cursorY += blockHeight + options.gapAfter;
    };

    const title =
      normalizeWhitespace(
        parsed.querySelector("main.page > h1")?.textContent ??
          parsed.querySelector("title")?.textContent ??
          "Policy Document",
      ) || "Policy Document";

    const metaText = normalizeMultilineText(
      extractNodeText(parsed.querySelector(".meta") ?? parsed.body),
    );

    writeBlock("POLICYPACK EXPORT", {
      fontSize: 10,
      lineHeight: 4.5,
      fontStyle: "normal",
      gapAfter: 3,
    });
    writeBlock(title, {
      fontSize: 22,
      lineHeight: 8,
      fontStyle: "bold",
      gapAfter: 4,
    });

    if (metaText) {
      writeBlock(metaText, {
        fontSize: 11,
        lineHeight: 5,
        fontStyle: "normal",
        gapAfter: 6,
      });
    }

    drawDivider(0.5, 6);

    const article = parsed.querySelector("article.doc");
    const blocks = article ? collectBlocksFromElement(article) : [];

    for (const block of blocks) {
      if (!block.text) continue;

      if (block.kind === "h1") {
        writeBlock(block.text, {
          fontSize: 18,
          lineHeight: 6.5,
          fontStyle: "bold",
          gapAfter: 3,
        });
        continue;
      }

      if (block.kind === "h2") {
        writeBlock(block.text, {
          fontSize: 15,
          lineHeight: 6,
          fontStyle: "bold",
          gapAfter: 2.5,
        });
        continue;
      }

      if (block.kind === "h3") {
        writeBlock(block.text, {
          fontSize: 13,
          lineHeight: 5.5,
          fontStyle: "bold",
          gapAfter: 2,
        });
        continue;
      }

      if (block.kind === "meta") {
        writeBlock(block.text, {
          fontSize: 11,
          lineHeight: 4.5,
          fontStyle: "normal",
          gapAfter: 2,
        });
        continue;
      }

      if (block.kind === "rule") {
        drawDivider(1.5, 4.5);
        continue;
      }

      if (block.kind === "li") {
        writeBlock(block.text, {
          fontSize: 12,
          lineHeight: 5.5,
          fontStyle: "normal",
          gapAfter: 1.5,
        });
        continue;
      }

      if (block.kind === "table") {
        writeBlock(block.text, {
          fontSize: 11,
          lineHeight: 5,
          fontStyle: "normal",
          gapAfter: 3,
        });
        continue;
      }

      writeBlock(block.text, {
        fontSize: 12,
        lineHeight: 5.5,
        fontStyle: "normal",
        gapAfter: 3,
      });
    }

    doc.save(filename);
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
}
