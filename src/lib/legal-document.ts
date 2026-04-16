import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

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

function sanitizeGeneratedHtml(html: string) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  });
}

export function legalMarkdownToHtml(markdown: string) {
  try {
    const rawHtml = marked.parse(markdown, { async: false }) as string;
    return sanitizeGeneratedHtml(rawHtml);
  } catch (error) {
    console.error("Error parsing markdown", error);
    return `<p>${escapeHtml(markdown)}</p>`;
  }
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
      (() => {
        const triggerPrint = () => {
          window.requestAnimationFrame(() => {
            window.setTimeout(() => {
              window.focus();
              window.print();
            }, 220);
          });
        };

        if (document.readyState === "complete") {
          triggerPrint();
        } else {
          window.addEventListener("load", triggerPrint, { once: true });
        }
      })();
    </script>
  </body>
</html>`;
}
