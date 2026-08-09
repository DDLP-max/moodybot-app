# Protect-only finalizer contract (`protect-only-v1`)

## Philosophy

Generation creates.  
Finalization protects.  
Nothing else.

The Dynamic Mode post-process is **infrastructure**, not authorship.

## The one question

Any future change to post-process must answer:

> Does this prevent a defect, or does it change the writing?

| Answer | Action |
|--------|--------|
| Prevents a defect | May belong in post-process |
| Changes the writing | Move into generation (`CORE_WRITE_DIRECTIVE` / system prompt), or delete |

## Allowed

1. Remove obvious hallucinated mechanics (when applicable)  
2. Remove generic assistant garbage / broken closers  
3. Fix broken formatting  
4. Remove duplicated ideas  
5. Enforce safety  

Brand watermark (`🥃 @MoodyBotAI`) is branding infrastructure, not a Signature Line.

## Forbidden

Any change that improves, tightens, rewrites, scores, or costumes the prose.

## Success metric

Creative rewrites ≈ 0. Fix the prompt if drafts are weak.

See also: Cursor rule `.cursor/rules/protect-only-finalizer.mdc`
