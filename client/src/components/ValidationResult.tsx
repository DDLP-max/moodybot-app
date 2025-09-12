import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { payload: any };

export default function ValidationResult({ payload }: Props) {
  const auto = Boolean(payload?._auto);
  
  return (
    <div className="space-y-3">
      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="secondary" 
          className={`${
            payload.chips.polarity === 'positive' ? 'bg-emerald-500 text-white' :
            payload.chips.polarity === 'negative' ? 'bg-amber-500 text-white' :
            'bg-gradient-to-r from-teal-500 to-amber-500 text-white'
          }`}
        >
          {payload.chips.polarity === 'positive' ? '✅' : payload.chips.polarity === 'negative' ? '⚡' : '🔄'} {payload.chips.polarity}
        </Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{payload.chips.style}</Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">{payload.chips.intensity}</Badge>
        <Badge variant="secondary" className="bg-gray-700 text-gray-300">
          {payload.chips.length === 'one_liner' ? '1-liner' : payload.chips.length === 'two_three' ? '2-3 lines' : 'paragraph'}
        </Badge>
        {auto && (
          <Badge variant="secondary" className="bg-orange-500 text-white">
            Auto-formatted
          </Badge>
        )}
      </div>

      {/* Validation */}
      <Card className={`border-l-4 ${
        payload.chips.polarity === 'positive' ? 'border-l-emerald-500 bg-emerald-500/10' :
        payload.chips.polarity === 'negative' ? 'border-l-amber-500 bg-amber-500/10' :
        'border-l-teal-400 bg-gradient-to-r from-teal-400/10 to-violet-500/10'
      }`}>
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-gray-300 mb-2">Validation</h4>
          <p className="text-white text-lg">{payload.messages.validation}</p>
        </CardContent>
      </Card>

      {/* Because */}
      <Card className="bg-gray-800/50 border border-gray-600">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm text-gray-300 mb-2 italic">Because</h4>
          <p className="text-white italic">{payload.messages.because}</p>
        </CardContent>
      </Card>

      {/* Depth (hide if empty) */}
      {payload?.messages?.depth ? (
        <Card className="bg-gray-800/50 border border-gray-600">
          <CardContent className="p-3">
            <h4 className="font-semibold text-sm text-gray-300 mb-2">Validation Depth</h4>
            <p className="text-sm text-gray-400 italic">{payload.messages.depth}</p>
          </CardContent>
        </Card>
      ) : null}

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
