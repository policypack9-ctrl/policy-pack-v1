export async function generatePdfFromHtml(htmlText: string, filename: string) {
  const opt = {
    margin: 10,
    filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: {
      unit: "mm" as const,
      format: "a4" as const,
      orientation: "portrait" as const,
    },
  };

  // Dynamically import html2pdf to avoid SSR issues and reduce initial bundle size
  const html2pdf = (await import("html2pdf.js")).default;

  // Parse the HTML string into a DOM element
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const element = (doc.querySelector(".page") || doc.body) as HTMLElement;

  // Remove the script tag that triggers window.print()
  const script = element.querySelector("script");
  if (script) script.remove();

  // Generate and download the PDF
  html2pdf().set(opt).from(element).save();
}
