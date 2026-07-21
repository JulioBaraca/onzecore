import { redirect } from "next/navigation";
import { resolveCurrentCareer } from "@/lib/career/current-career";
import { getCareerDocument, type CareerDocument, type DocumentType } from "@/features/documents/queries";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploadForm } from "@/app/(protected)/history/DocumentUploadForm";
import { formatDateTime } from "@/lib/format/number";

export default async function HistoryPage() {
  const [resolution, dict] = await Promise.all([resolveCurrentCareer(), getDictionary()]);
  if (resolution.status !== "selected") {
    redirect("/select-career");
  }
  const career = resolution.career;

  const [clubHistory, careerHistory] = await Promise.all([
    getCareerDocument(career.career_id, "club_history"),
    getCareerDocument(career.career_id, "career_history"),
  ]);

  const sections: { docType: DocumentType; title: string; doc: CareerDocument | null }[] = [
    { docType: "club_history", title: dict.history.clubHistoryTitle, doc: clubHistory },
    { docType: "career_history", title: dict.history.careerHistoryTitle, doc: careerHistory },
  ];

  return (
    <>
      <PageHeader title={dict.nav.history} description={career.friendly_name} />

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <Card key={section.docType}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {section.doc ? (
                <>
                  <p className="text-xs text-slate-500">
                    {dict.history.lastUpdated} {formatDateTime(section.doc.updatedAt)}
                  </p>
                  <iframe
                    src={section.doc.signedUrl}
                    title={section.title}
                    className="h-[70vh] w-full rounded-lg border border-slate-200"
                  />
                </>
              ) : (
                <p className="text-sm text-slate-400">{dict.history.noDocument}</p>
              )}
              <DocumentUploadForm docType={section.docType} hasDocument={section.doc !== null} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
