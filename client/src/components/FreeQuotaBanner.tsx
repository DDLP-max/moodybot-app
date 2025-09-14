interface FreeQuotaBannerProps {
  remaining?: number;
  limit?: number;
  isLoading?: boolean;
}

export default function FreeQuotaBanner({ 
  remaining = 3, 
  limit = 3, 
  isLoading = false 
}: FreeQuotaBannerProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/60 p-3 text-sm text-center">
        Loading quota...
      </div>
    );
  }

  const hasFreeLeft = remaining > 0;

  return (
    <div className={`rounded-xl p-3 text-sm text-center ${
      hasFreeLeft 
        ? 'bg-gradient-to-r from-green-800/60 to-emerald-700/60' 
        : 'bg-gradient-to-r from-slate-800/60 to-slate-700/60'
    }`}>
      {hasFreeLeft ? (
        <span className="text-green-300">
          {remaining} free question{remaining === 1 ? '' : 's'} remaining
        </span>
      ) : (
        <span className="text-gray-300">
          No free questions remaining
        </span>
      )}
    </div>
  );
}
