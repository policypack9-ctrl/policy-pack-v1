"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, LoaderCircle, X } from "lucide-react";

import { LegalDocumentRenderer } from "@/components/legal/legal-document-renderer";
import { Button } from "@/components/ui/button";

type LegalDocumentModalProps = {
  isOpen: boolean;
  title: string;
  markdown: string;
  metaLabel: string;
  generatedAt: string;
  isLoading: boolean;
  loadingMessage?: string;
  canExport: boolean;
  onClose: () => void;
  onExport: () => void;
};

export function LegalDocumentModal({
  isOpen,
  title,
  markdown,
  metaLabel,
  generatedAt,
  isLoading,
  loadingMessage,
  canExport,
  onClose,
  onExport,
}: LegalDocumentModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 py-6 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="soft-panel flex max-h-[88vh] w-full max-w-5xl flex-col rounded-[30px]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-teal-200/72">
                  Generated Document
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-white/50">
                  {metaLabel} | {generatedAt}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="h-10 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-3 text-white/70 hover:bg-white/[0.05] hover:text-white"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {isLoading ? (
                <div className="flex min-h-[320px] items-center justify-center">
                  <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] px-6 py-5 text-center">
                    <LoaderCircle className="mx-auto size-6 animate-spin text-teal-200" />
                    <p className="mt-4 text-sm font-medium text-white">
                      {loadingMessage && loadingMessage.length > 0 ? loadingMessage : "Preparing your document..."}
                    </p>
                    <p className="mt-2 text-sm text-white/54">
                      {loadingMessage?.startsWith("Searching") || loadingMessage?.startsWith("Found")
                        ? "Scanning the latest regulations for your region..."
                        : loadingMessage?.startsWith("Drafting")
                          ? "Writing your document with live regulation data..."
                          : "PolicyPack is generating your document, this takes 20-40 seconds."}
                    </p>
                  </div>
                </div>
              ) : (
                <LegalDocumentRenderer
                  markdown={markdown}
                  className="legal-doc text-white/78"
                />
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.08] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs uppercase tracking-[0.24em] text-white/36">
                Formal legal layout
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="h-10 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onExport}
                  disabled={isLoading || !canExport}
                  className="h-10 rounded-[16px] border border-white/[0.08] bg-white/[0.02] px-4 text-sm text-white/72 hover:bg-white/[0.05] hover:text-white"
                >
                  <Download className="size-4" />
                  {canExport ? "Export PDF" : "Upgrade to Download"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
