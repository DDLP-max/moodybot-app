import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ValidationOutput } from "@/lib/types/validation";

type Props = { payload: ValidationOutput };

export default function ValidationResult({ payload }: Props) {
  const auto = Boolean(payload?.meta?.auto_formatted);
  
  return (
    <div className="space-y-3">
      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="secondary" 
          className={`${
            payload.meta.mode === 'Positive' ? 'bg-emerald-500 text-white' :
            payload.meta.mode === 'Negative' ? 'bg-amber-500 text-white' :
            'bg-gradient-to-r from-teal-500 to-amber-500 text-white'
          }`}
        >
          {payload.meta.mode === 'Positive' ? '✅' : payload.meta.mode === 'Negative' ? '⚡' : '🔄'} {payload.meta.mode}
        </Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{payload.meta.style}</Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{payload.meta.intensity}</Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          {payload.meta.length === 'one_liner' ? '1-liner' : payload.meta.length === 'two_three_lines' ? '2-3 lines' : 'paragraph'}
        </Badge>
        {payload.meta.regenerated && (
          <Badge variant="secondary" className="bg-blue-500 text-white">
            Regenerated
          </Badge>
        )}
        {auto && (
          <Badge variant="secondary" className="bg-orange-500 text-white">
            Auto-formatted
          </Badge>
        )}
      </div>

      {/* Validation Response */}
      <Card className={`border-l-4 ${
        payload.meta.mode === 'Positive' ? 'border-l-emerald-500 bg-emerald-500/10' :
        payload.meta.mode === 'Negative' ? 'border-l-amber-500 bg-amber-500/10' :
        'border-l-teal-400 bg-gradient-to-r from-teal-400/10 to-violet-500/10'
      }`}>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-gray-300 mb-2">Validation</h4>
          <div className="text-white text-lg whitespace-pre-line">
            {payload.response}
          </div>
        </CardContent>
      </Card>

      {auto && (
        <Card className="bg-amber-950/30 border border-amber-500/20">
          <CardContent className="p-2">
            <p className="text-xs text-amber-300 text-center">
              Auto-formatted result while the model re-learns the schema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
