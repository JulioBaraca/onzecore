"use client";

import { useActionState } from "react";
import { uploadCareerDocumentAction } from "@/lib/documents/actions";
import type { ActionResult } from "@/lib/auth/actions";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import type { DocumentType } from "@/features/documents/queries";

const initialState: ActionResult = {};

export function DocumentUploadForm({ docType, hasDocument }: { docType: DocumentType; hasDocument: boolean }) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState(uploadCareerDocumentAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="docType" value={docType} />
      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
        className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{dict.history.uploadSuccess}</p>}
      <Button type="submit" disabled={pending} size="sm" className="self-start">
        {pending ? dict.history.uploading : hasDocument ? dict.history.replaceDocument : dict.history.uploadButton}
      </Button>
    </form>
  );
}
