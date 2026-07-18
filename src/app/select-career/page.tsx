import { listAccessibleCareers } from "@/lib/career/current-career";
import { CareerSelectorList } from "@/app/select-career/CareerSelectorList";
import { EmptyState } from "@/components/layout/EmptyState";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function SelectCareerPage() {
  const [careers, dict] = await Promise.all([listAccessibleCareers(), getDictionary()]);

  if (careers.length === 0) {
    return (
      <EmptyState
        title={dict.careerSelector.noAccessTitle}
        description={dict.careerSelector.noAccessDescription}
      />
    );
  }

  return <CareerSelectorList careers={careers} />;
}
