export default function ModeCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/5 
                  backdrop-blur-sm shadow-xl ${className}`}
    >
      {children}
    </section>
  );
}
