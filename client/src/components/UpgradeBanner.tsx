export default function UpgradeBanner({ left, cta }: { left: React.ReactNode; cta: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-[#2DD4BF]/15 to-[#8B5CF6]/15 
                    border border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="text-white/80 text-sm">{left}</div>
      <div>{cta}</div>
    </div>
  );
}
