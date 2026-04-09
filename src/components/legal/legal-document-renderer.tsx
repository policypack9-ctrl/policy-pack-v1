import { legalMarkdownToHtml } from "@/lib/legal-document";

type LegalDocumentRendererProps = {
  markdown: string;
  className?: string;
};

export function LegalDocumentRenderer({
  markdown,
  className,
}: LegalDocumentRendererProps) {
  return (
    <article
      className={className}
      dangerouslySetInnerHTML={{ __html: legalMarkdownToHtml(markdown) }}
    />
  );
}
