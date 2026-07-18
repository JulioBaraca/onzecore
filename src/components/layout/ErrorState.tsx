export function ErrorState({
  title = "Não foi possível carregar os dados",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-red-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-red-600">{description}</p>}
    </div>
  );
}
