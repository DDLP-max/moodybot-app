import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ModeCardProps = {
  title: string;
  href: string;
  icon?: React.ReactNode;
  description?: string;
  hideHeading?: boolean; // NEW
};

export default function ModeCard({
  title,
  href,
  icon,
  description,
  hideHeading = false,   // default: show heading
}: ModeCardProps) {
  return (
    <a href={href} aria-label={title}>
      <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <CardHeader className="p-6">
          <div className="flex items-center gap-2">
            {icon}
            {!hideHeading && (                       // <-- only render if NOT hidden
              <CardTitle className="text-base">{title}</CardTitle>
            )}
          </div>

          {description && (
            <CardDescription className={hideHeading ? "mt-0" : "mt-1"}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </a>
  );
}
