export async function generatePdfFromHtml(htmlText: string, filename: string) {
  let iframe: HTMLIFrameElement | null = null;

  try {
    const opt = {
      margin: 10,
      filename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: "#ffffff",
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

    // Render inside an isolated iframe so html2canvas does not parse the app's
    // Tailwind v4 color functions (like lab/oklch) from the dashboard styles.
    iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "900px";
    iframe.style.height = "1200px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      throw new Error("Unable to create an isolated PDF rendering document.");
    }

    const sanitizedHtml = htmlText.replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      "",
    );

    iframeDoc.open();
    iframeDoc.write(sanitizedHtml);
    iframeDoc.close();

    await new Promise<void>((resolve) => {
      if (iframe?.contentWindow?.document.readyState === "complete") {
        resolve();
        return;
      }

      iframe?.addEventListener("load", () => resolve(), { once: true });
      window.setTimeout(() => resolve(), 250);
    });

    const element = (iframeDoc.querySelector(".page") || iframeDoc.body) as HTMLElement;
    if (!element) {
      throw new Error("Unable to find the PDF content element.");
    }

    // Generate and download the PDF, then cleanup
    await html2pdf().set(opt).from(element).save();
    
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  } finally {
    if (iframe?.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
}
