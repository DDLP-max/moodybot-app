import * as React from "react";
import { generateValidation } from "@/lib/generateValidation";

export default function ValidationForm() {
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [output, setOutput] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput("");

    try {
      const resp = await generateValidation(input);
      setOutput(resp);
    } catch (err: any) {
      setOutput("Something glitched on my end. Try again in a moment.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Say what happened, in plain sentences."
        className="w-full min-h-32 rounded-md border bg-zinc-900/30 p-3"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md px-4 py-2 bg-indigo-600 text-white disabled:opacity-50"
      >
        {loading ? "Validating…" : "Generate Validation"}
      </button>

      {output && (
        <pre className="whitespace-pre-wrap rounded-md bg-zinc-900/40 p-3">
          {output}
        </pre>
      )}
    </form>
  );
}
