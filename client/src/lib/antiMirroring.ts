// Anti-mirroring guard to prevent parroting user input
export function tooSimilar(context: string, output: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g,' ').trim();
  const c = norm(context).split(' ');
  const o = norm(output).split(' ');

  // 1) 5-gram check
  for (let i=0; i<=c.length-5; i++) {
    const phrase = c.slice(i, i+5).join(' ');
    if (phrase && o.join(' ').includes(phrase)) return true;
  }

  // 2) Jaccard overlap on unique tokens (stopwords removed)
  const STOP = new Set(['the','a','an','and','or','but','to','of','in','on','for','with','it','is','am','are','was','were','i','you','he','she','they','we','that','this','at','by','from','as','be','been','being','so','just','now','my','your','our','their']);
  const setC = new Set(c.filter(w => !STOP.has(w)));
  const setO = new Set(o.filter(w => !STOP.has(w)));
  const inter = [...setC].filter(w => setO.has(w)).length;
  const union = new Set([...setC, ...setO]).size || 1;
  const jaccard = inter / union;

  return jaccard > 0.35; // tune threshold as needed
}
