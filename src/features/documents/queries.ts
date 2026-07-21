import { createClient } from "@/lib/supabase/server";

export const DOCUMENT_BUCKET = "career-documents";

export type DocumentType = "club_history" | "career_history";

export interface CareerDocument {
  path: string;
  signedUrl: string;
  updatedAt: string;
}

function objectPath(careerId: string, docType: DocumentType): string {
  return `${careerId}/${docType}.pdf`;
}

/** One PDF per (career, doc type) - listing the career's folder and matching by name avoids needing a separate metadata table. */
export async function getCareerDocument(careerId: string, docType: DocumentType): Promise<CareerDocument | null> {
  const supabase = await createClient();
  const fileName = `${docType}.pdf`;

  const { data: files } = await supabase.storage.from(DOCUMENT_BUCKET).list(careerId, { search: fileName });
  const file = files?.find((f) => f.name === fileName);
  if (!file) return null;

  const path = objectPath(careerId, docType);
  const { data: signed, error } = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(path, 3600);
  if (error || !signed) return null;

  return {
    path,
    signedUrl: signed.signedUrl,
    updatedAt: file.updated_at ?? file.created_at ?? "",
  };
}
