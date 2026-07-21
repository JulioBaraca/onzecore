"use client";

import dynamic from "next/dynamic";

// react-pdf renders to <canvas> via a Web Worker - both are browser-only
// APIs, so this must be excluded from the server render entirely (a plain
// "use client" component still gets an SSR pass in the App Router).
const PdfViewer = dynamic(() => import("@/components/documents/PdfViewer").then((m) => m.PdfViewer), {
  ssr: false,
});

export { PdfViewer as PdfViewerClient };
