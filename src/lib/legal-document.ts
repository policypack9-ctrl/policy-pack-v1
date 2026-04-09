type PrintDocumentMeta = {
  title: string;
  productName: string;
  websiteUrl: string;
  generatedAt: string;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function legalMarkdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let paragraph: string[] = [];
  let orderedListItems: string[] = [];
  let unorderedListItems: string[] = [];
  let orderedListStart = 1;

  function renderInline(value: string) {
    return escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  }

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }

    html.push(
      `<p>${renderInline(paragraph.join(" ").replace(/\s+/g, " ").trim())}</p>`,
    );
    paragraph = [];
  }

  function flushOrderedList() {
    if (orderedListItems.length === 0) {
      return;
    }

    html.push(
      `<ol start="${orderedListStart}">${orderedListItems.join("")}</ol>`,
    );
    orderedListItems = [];
    orderedListStart = 1;
  }

  function flushUnorderedList() {
    if (unorderedListItems.length === 0) {
      return;
    }

    html.push(`<ul>${unorderedListItems.join("")}</ul>`);
    unorderedListItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushOrderedList();
      flushUnorderedList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      flushOrderedList();
      flushUnorderedList();
      const level = headingMatch[1].length;
      const text = renderInline(headingMatch[2]);
      html.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    const orderedMatch = /^(\d+)\.\s+(.+)$/.exec(line);
    if (orderedMatch) {
      flushParagraph();
      flushUnorderedList();
      if (orderedListItems.length === 0) {
        orderedListStart = Number(orderedMatch[1]);
      }

      orderedListItems.push(`<li>${renderInline(orderedMatch[2])}</li>`);
      continue;
    }

    const unorderedMatch = /^[-*]\s+(.+)$/.exec(line);
    if (unorderedMatch) {
      flushParagraph();
      flushOrderedList();
      unorderedListItems.push(`<li>${renderInline(unorderedMatch[1])}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushOrderedList();
  flushUnorderedList();

  return html.join("");
}

export function buildLegalPrintHtml(
  markdown: string,
  meta: PrintDocumentMeta,
) {
  const contentHtml = legalMarkdownToHtml(markdown);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(meta.title)}</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        background: #f8f7f4;
        color: #111827;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 12pt;
      }
      .page {
        max-width: 840px;
        margin: 0 auto;
        background: #ffffff;
        padding: 72px 84px;
        min-height: 100vh;
      }
      .eyebrow {
        font-family: Inter, Arial, sans-serif;
        font-size: 11px;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: #6b7280;
      }
      h1 {
        margin: 14px 0 10px;
        font-size: 34px;
        line-height: 1.2;
      }
      .meta {
        margin: 0 0 34px;
        font-family: Inter, Arial, sans-serif;
        font-size: 13px;
        line-height: 1.8;
        color: #4b5563;
      }
      .doc {
        border-top: 1px solid #d1d5db;
        padding-top: 26px;
      }
      .doc h1, .doc h2, .doc h3 {
        page-break-after: avoid;
      }
      .doc h1 {
        font-size: 28px;
        margin: 28px 0 14px;
      }
      .doc h2 {
        font-size: 20px;
        margin: 24px 0 12px;
        font-weight: 700;
      }
      .doc h3 {
        font-size: 16px;
        margin: 18px 0 10px;
        font-weight: 700;
      }
      .doc p, .doc li {
        font-size: 12pt;
        line-height: 1.9;
      }
      .doc p {
        margin: 0 0 14px;
      }
      .doc ol {
        margin: 0 0 18px 0;
        padding-left: 24px;
      }
      .doc ul {
        margin: 0 0 18px 0;
        padding-left: 22px;
      }
      .doc li {
        margin-bottom: 10px;
      }
      .doc strong {
        font-weight: 700;
      }
      .doc code {
        font-family: "Times New Roman", Georgia, serif;
        background: #f3f4f6;
        padding: 2px 4px;
        border-radius: 4px;
      }
      @page {
        margin: 18mm;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .page {
          max-width: none;
          min-height: auto;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="eyebrow">PolicyPack Export</div>
      <h1>${escapeHtml(meta.title)}</h1>
      <p class="meta">
        Generated for ${escapeHtml(meta.productName)}<br />
        Website: ${escapeHtml(meta.websiteUrl)}<br />
        Generated at: ${escapeHtml(meta.generatedAt)}
      </p>
      <article class="doc">${contentHtml}</article>
    </main>
    <script>
      window.addEventListener("load", () => {
        setTimeout(() => {
          window.print();
        }, 140);
      });
    </script>
  </body>
</html>`;
}
