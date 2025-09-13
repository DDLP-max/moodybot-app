import { RouterMeta } from './types/validation';

// Lightweight classifier (no extra model required)
export function classifyContext(context: string): RouterMeta {
  const s = context.toLowerCase();

  const lex = {
    embarrassment: ['embarrass','awkward','cringe','mismatch','spilled','tripped','public','airport','eyes on me'],
    shame: ['stupid','failure','worthless','ashamed',"i'm the problem",'my fault'],
    anger: ['pissed','angry','furious','fuck','hate','idiot','bullshit'],
    sadness: ['sad','down','cry','lost','grief','miss'],
    anxiety: ['anxious','panic','nervous','overthinking','spiral','what if'],
    fatigue: ['tired','exhausted','burned out','drained','worn'],
    loneliness: ['alone','lonely','isolated'],
    frustration: ['stuck','ugh','fed up',"why won't"],
    pride: ['proud','nailed it','crushed it'],
  };

  function hit(keys:string[]) { return keys.some(k=>s.includes(k)); }

  let primary: RouterMeta['primary_emotion'] = 'unknown';
  if (hit(lex.embarrassment)) primary='embarrassment';
  else if (hit(lex.shame)) primary='shame';
  else if (hit(lex.anger)) primary='anger';
  else if (hit(lex.anxiety)) primary='anxiety';
  else if (hit(lex.sadness)) primary='sadness';
  else if (hit(lex.fatigue)) primary='fatigue';
  else if (hit(lex.loneliness)) primary='loneliness';
  else if (hit(lex.frustration)) primary='frustration';
  else if (hit(lex.pride)) primary='pride';

  const selfBlameWords = ['stupid','my fault','i blew it','i messed up',"i'm an idiot",'i suck','my stupidity'];
  const publicWords = ['public','airport','in front of','crowd','everyone','people staring','on stage','meeting'];
  const urgentWords = ['now','right now','immediately','deadline','tonight','today','asap','help'];
  const heat = (s.match(/[!?]/g)||[]).length + (s.match(/\b(fuck|shit|damn|wtf)\b/g)||[]).length;
  const humor = /\b(lol|lmao|facepalm|🤦|😂)\b/.test(s) || /haha/.test(s);

  const self_blame = Math.min(1, selfBlameWords.filter(w=>s.includes(w)).length / 2);
  const public_exposure = publicWords.some(w=>s.includes(w));
  const urgency: RouterMeta['urgency'] = urgentWords.some(w=>s.includes(w)) ? 'high' : 'med';
  const heatLevel: RouterMeta['heat'] = heat >= 3 ? 'high' : heat === 2 ? 'med' : 'low';

  return { primary_emotion: primary, self_blame, public_exposure, urgency, heat: heatLevel, humor };
}

// Routing rules (deterministic)
export function routeSettings(meta: RouterMeta, tags: string[] = []) {
  // defaults
  let mode:'Positive'|'Negative'|'Mixed' = 'Positive';
  let style:'Warm'|'Direct'|'Playful'|'Dry'|'Elegant'|'Street'|'Professional' = 'Warm';
  let intensity:'Feather'|'Casual'|'Firm'|'Heavy' = 'Casual';
  let length:'one_liner'|'two_three_lines'|'short_paragraph' = 'two_three_lines';

  switch (meta.primary_emotion) {
    case 'embarrassment':
      mode='Positive'; style= meta.humor ? 'Playful' : 'Warm';
      intensity = meta.heat==='high' ? 'Firm' : 'Casual';
      length='two_three_lines';
      break;
    case 'shame':
      mode='Positive'; style='Warm'; intensity= meta.heat==='high' ? 'Firm' : 'Casual';
      length='two_three_lines';
      break;
    case 'anger':
      mode='Mixed'; style='Direct'; intensity='Firm'; length='one_liner';
      break;
    case 'anxiety':
      mode='Positive'; style='Warm'; intensity='Feather'; length='two_three_lines';
      break;
    case 'sadness':
      mode='Positive'; style='Warm'; intensity='Heavy'; length='short_paragraph';
      break;
    case 'frustration':
      mode='Mixed'; style='Direct'; intensity='Firm'; length='two_three_lines';
      break;
    case 'fatigue':
      mode='Positive'; style='Dry'; intensity='Feather'; length='two_three_lines';
      break;
    case 'loneliness':
      mode='Positive'; style='Warm'; intensity='Casual'; length='short_paragraph';
      break;
    case 'pride':
      mode='Positive'; style='Playful'; intensity='Feather'; length='one_liner';
      break;
    default:
      mode='Positive'; style='Warm'; intensity='Casual'; length='two_three_lines';
  }

  // adjustors
  if (meta.self_blame > 0.5) { mode='Positive'; style='Warm'; } // heavier dignity restore
  if (meta.public_exposure && (meta.primary_emotion==='embarrassment' || meta.primary_emotion==='shame')) {
    style = meta.humor ? 'Playful' : 'Warm';
  }
  if (tags.includes('boundaries')) { mode='Mixed'; style='Direct'; intensity='Firm'; }

  return { mode, style, intensity, length };
}
