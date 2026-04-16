type PdfTextBlock = {
  text: string;
  kind: "title" | "meta" | "h1" | "h2" | "h3" | "p" | "li" | "table";
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

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
    const href = node.getAttribute("href")?.trim() ?? "";
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
      const text = normalizeWhitespace(extractNodeText(child));
      if (text) blocks.push({ text, kind: "p" });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(child.querySelectorAll(":scope > li"));
      items.forEach((item, index) => {
        const text = normalizeWhitespace(extractNodeText(item));
        if (!text) return;
        const prefix = tag === "ol" ? `${index + 1}. ` : "- ";
        blocks.push({ text: `${prefix}${text}`, kind: "li" });
      });
      continue;
    }

    if (tag === "table") {
      const text = extractTableText(child as HTMLTableElement);
      if (text) blocks.push({ text, kind: "table" });
      continue;
    }

    if (tag === "hr") {
      blocks.push({ text: "________________________________________", kind: "meta" });
      continue;
    }

    blocks.push(...collectBlocksFromElement(child));
  }

  return blocks;
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

    const writeBlock = (
      text: string,
      options: {
        fontSize: number;
        lineHeight: number;
        fontStyle?: "normal" | "bold";
        gapAfter: number;
      },
    ) => {
      const lines = doc.splitTextToSize(text, contentWidth) as string[];
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

    const metaText = normalizeWhitespace(
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
