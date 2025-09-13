import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ValidationOutput } from "@/lib/types/validation";

type Props = { payload: ValidationOutput };

export default function ValidationResult({ payload }: Props) {
  const auto = Boolean(payload?.meta?.auto_used);
  const resolved = payload.meta.resolved;
  
  return (
    <div className="space-y-3">
      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="secondary" 
          className={`${
            resolved.mode === 'Positive' ? 'bg-emerald-500 text-white' :
            resolved.mode === 'Negative' ? 'bg-amber-500 text-white' :
            'bg-gradient-to-r from-teal-500 to-amber-500 text-white'
          }`}
        >
          {resolved.mode === 'Positive' ? '✅' : resolved.mode === 'Negative' ? '⚡' : '🔄'} {resolved.mode}
        </Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{resolved.style}</Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{resolved.intensity}</Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          {resolved.length === 'one_liner' ? '1-liner' : resolved.length === 'two_three_lines' ? '2-3 lines' : 'paragraph'}
        </Badge>
        {auto && (
          <Badge variant="secondary" className="bg-blue-500 text-white">
            Auto Mode
          </Badge>
        )}
        {payload.meta.regenerated && (
          <Badge variant="secondary" className="bg-orange-500 text-white">
            Regenerated
          </Badge>
        )}
        {payload.meta.router && (
          <Badge variant="secondary" className="bg-purple-500 text-white">
            {payload.meta.router.primary_emotion}
          </Badge>
        )}
      </div>

      {/* Validation Response */}
      <Card className={`border-l-4 ${
        resolved.mode === 'Positive' ? 'border-l-emerald-500 bg-emerald-500/10' :
        resolved.mode === 'Negative' ? 'border-l-amber-500 bg-amber-500/10' :
        'border-l-teal-400 bg-gradient-to-r from-teal-400/10 to-violet-500/10'
      }`}>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-gray-300 mb-2">Validation</h4>
          <div className="text-white text-lg whitespace-pre-line">
            {payload.response}
          </div>
        </CardContent>
      </Card>

      {/* Router Debug Info */}
      {auto && payload.meta.router && (
        <Card className="bg-blue-950/30 border border-blue-500/20">
          <CardContent className="p-3">
            <h5 className="text-xs text-blue-300 font-semibold mb-2">Auto Mode Analysis</h5>
            <div className="text-xs text-blue-200 space-y-1">
              <div>Emotion: {payload.meta.router.primary_emotion}</div>
              <div>Self-blame: {(payload.meta.router.self_blame * 100).toFixed(0)}%</div>
              <div>Public exposure: {payload.meta.router.public_exposure ? 'Yes' : 'No'}</div>
              <div>Urgency: {payload.meta.router.urgency}</div>
              <div>Heat level: {payload.meta.router.heat}</div>
              <div>Humor detected: {payload.meta.router.humor ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
