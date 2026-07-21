"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { DOCUMENT_BUCKET, type DocumentType } from "@/features/documents/queries";
import type { ActionResult } from "@/lib/auth/actions";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export async function uploadCareerDocumentAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const dict = await getDictionary();

  const resolution = await resolveCurrentCareer();
  if (resolution.status !== "selected") {
    return { error: dict.history.uploadError };
  }

  const docType = String(formData.get("docType") ?? "") as DocumentType;
  if (docType !== "club_history" && docType !== "career_history") {
    return { error: dict.history.uploadError };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: dict.history.noFileSelected };
  }
  if (file.type !== "application/pdf") {
    return { error: dict.history.invalidFileType };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: dict.history.fileTooLarge };
  }

  const supabase = await createClient();
  const path = `${resolution.career.career_id}/${docType}.pdf`;
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    return { error: dict.history.uploadError };
  }

  revalidatePath("/history");
  return { success: true };
}
