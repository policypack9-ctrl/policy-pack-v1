export async function generatePdfFromHtml(htmlText: string, filename: string) {
  try {
    const opt = {
      margin: 10,
      filename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm" as const,
        format: "a4" as const,
        orientation: "portrait" as const,
      },
    };

    // Dynamically import html2pdf to avoid SSR issues
    // Using a more robust import for html2pdf which can be tricky in ESM
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;

    if (typeof html2pdf !== 'function') {
      throw new Error("html2pdf library failed to load correctly.");
    }

    // Create a temporary container in the current document to ensure styles are applied
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = "800px"; // Give it a fixed width for consistent rendering
    container.innerHTML = htmlText;
    document.body.appendChild(container);

    // Find the actual content element within the container
    const element = (container.querySelector(".page") || container) as HTMLElement;

    // Remove any script tags that might interfere
    const scripts = container.querySelectorAll("script");
    scripts.forEach(s => s.remove());

    // Generate and download the PDF, then cleanup
    await html2pdf().set(opt).from(element).save();
    
    // Cleanup
    document.body.removeChild(container);
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
}
