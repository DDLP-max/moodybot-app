export default function PageTitle({
  title,
  subtitle,
  back = false,
}: { 
  title: string; 
  subtitle?: string; 
  back?: boolean; 
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div>
        <h1 className="text-xl font-semibold leading-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-white/60 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {back ? (
        <a 
          href="/"
          className="text-sm text-white/70 hover:text-white/90 underline-offset-2 hover:underline"
        >
          ← Back
        </a>
      ) : null}
    </div>
  );
}
