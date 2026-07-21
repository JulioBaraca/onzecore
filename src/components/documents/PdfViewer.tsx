"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/providers/i18n-provider";
import { formatTemplate } from "@/lib/i18n/format-template";

// Rendering PDFs as canvas via pdf.js (rather than an <iframe> pointed at the
// signed URL) is deliberate: browsers decide whether to display or download
// application/pdf based on the visitor's own settings, so an iframe silently
// renders blank for anyone whose browser is set to download PDFs instead of
// opening them - a real, reproducible failure mode, not a hypothetical one.
// This guarantees the same in-page reading experience for every visitor.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewer({ fileUrl }: { fileUrl: string }) {
  const { dict } = useI18n();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="max-h-[75vh] w-full overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-2">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            setPageNumber(1);
            setFailed(false);
          }}
          onLoadError={() => setFailed(true)}
          loading={<p className="p-8 text-center text-sm text-slate-400">{dict.common.loading}</p>}
          error={<p className="p-8 text-center text-sm text-red-600">{dict.history.viewerError}</p>}
          className="flex justify-center"
        >
          <Page pageNumber={pageNumber} width={680} />
        </Document>
      </div>

      {!failed && numPages !== null && numPages > 1 && (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            {dict.history.previousPage}
          </Button>
          <span className="text-sm text-slate-600 tabular-nums">
            {formatTemplate(dict.history.pageIndicator, { current: pageNumber, total: numPages })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          >
            {dict.history.nextPage}
          </Button>
        </div>
      )}
    </div>
  );
}
