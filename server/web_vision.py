# -*- coding: utf-8 -*-
"""Web entry to the Telegram vision pipeline.

Image turns use the same personality modules as the Telegram bot
(prompt runtime, response plan, finalizer). MOODYBOT_RUNTIME points at
that source tree. This process never prints image bytes or API keys.
"""
import ast
import base64
import json
import logging
import os
import random
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from moodybot_vision import (  # noqa: E402
    ImageMemory,
    ImageRejected,
    _git_commit,
    _prepare_model_turn,
    classify_vision_intent,
    memory_limit,
    normalize_image,
    retention_days,
)

MEMORY_ROOT = ROOT / "data" / "web_vision"
MODEL = "x-ai/grok-4.3"
_HOST = None


def memory_for(user_id: int) -> ImageMemory:
    return ImageMemory(MEMORY_ROOT / str(user_id), retention_days(), memory_limit())


def _ensure_pillow() -> None:
    """The Node host does not ship Pillow. Install it for this interpreter once."""
    local = ROOT / "pydeps"
    entries = [entry for entry in (os.environ.get("PYTHONPATH") or "").split(os.pathsep) if entry]
    entries.append(str(local))
    for entry in entries:
        if entry not in sys.path:
            sys.path.insert(0, entry)
    missing = []
    try:
        import PIL  # noqa: F401
    except ImportError:
        missing.append("pillow")
    try:
        import pillow_heif  # noqa: F401
    except ImportError:
        missing.append("pillow-heif")
    if not missing:
        return
    local.mkdir(parents=True, exist_ok=True)
    import subprocess
    completed = subprocess.run(
        [
            sys.executable, "-m", "pip", "install",
            "--disable-pip-version-check",
            "--target", str(local),
            *missing,
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if completed.returncode != 0:
        subprocess.run([sys.executable, "-m", "ensurepip", "--upgrade"], capture_output=True, text=True, timeout=90)
        completed = subprocess.run(
            [
                sys.executable, "-m", "pip", "install",
                "--disable-pip-version-check",
                "--target", str(local),
                *missing,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
    if completed.returncode != 0:
        print("pillow install failed", file=sys.stderr)
        raise RuntimeError("The image reader isn't installed on this server.")
    import importlib
    importlib.invalidate_caches()
    try:
        import PIL  # noqa: F401
    except ImportError as exc:
        raise RuntimeError("The image reader isn't installed on this server.") from exc


def _project_root() -> Path:
    for candidate in (ROOT, *ROOT.parents):
        if (candidate / "package.json").is_file():
            return candidate
    return Path.cwd()


def _runtime_candidates() -> list:
    project = _project_root()
    configured = os.environ.get("MOODYBOT_RUNTIME")
    found = []
    if configured:
        found.append(Path(configured))
    found.extend([
        project / "runtime",
        Path.cwd() / "runtime",
        ROOT.parent / "runtime",
    ])
    if len(ROOT.parents) > 1:
        found.append(ROOT.parents[1] / "_render_src")
    if len(ROOT.parents) > 2:
        found.append(ROOT.parents[2] / "_render_src")
    return found


def _runtime_root() -> Path:
    for root in _runtime_candidates():
        if (root / "prompt_runtime.py").is_file():
            return root
    dest = _project_root() / "runtime"
    import subprocess
    if dest.exists() and not (dest / "prompt_runtime.py").is_file():
        import shutil
        shutil.rmtree(dest, ignore_errors=True)
    try:
        subprocess.run(
            [
                "git", "clone", "--depth", "1",
                "https://github.com/DDLP-max/moodybot-telegram.git",
                str(dest),
            ],
            check=True,
            timeout=120,
            capture_output=True,
        )
    except Exception:
        print("runtime checkout failed", file=sys.stderr)
    if (dest / "prompt_runtime.py").is_file():
        return dest
    raise RuntimeError("MoodyBot personality runtime is not available.")


def _load_bot_functions(path: Path) -> dict:
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source)
    wanted = {
        "route_command",
        "is_parasocial_bond",
        "select_best_command",
        "auto_paragraph",
        "clean_response",
        "safe_emoji",
    }
    chunks = []
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name in wanted:
            segment = ast.get_source_segment(source, node)
            if segment:
                chunks.append(segment)
    namespace = {
        "re": re,
        "random": random,
        "logger": logging.getLogger("moodybot"),
    }
    exec("\n\n".join(chunks), namespace)
    return namespace


def host():
    global _HOST
    if _HOST is not None:
        return _HOST
    root = _runtime_root()
    runtime = str(root)
    if runtime not in sys.path:
        sys.path.insert(0, runtime)
    import gold_shape
    import moody_categories
    import postprocessing
    import response_finalization

    functions = _load_bot_functions(root / "moodybot.py")
    _HOST = SimpleNamespace(
        route_command=functions["route_command"],
        select_best_command=functions["select_best_command"],
        build_response_plan=response_finalization.build_response_plan,
        process_bot_output=postprocessing.process_bot_output,
        polish_sentences=postprocessing.polish_sentences,
        detect_category=moody_categories.detect_category,
        replace_category_descriptors=moody_categories.replace_category_descriptors,
        paragraph_count=gold_shape.paragraph_count,
        finalize_response=response_finalization.finalize_response,
        auto_paragraph=functions["auto_paragraph"],
        clean_response=functions["clean_response"],
        safe_emoji=functions["safe_emoji"],
        re=re,
    )
    return _HOST


def _gather(payload: dict):
    user_id = int(payload["userId"])
    session_id = int(payload["sessionId"])
    text = payload.get("text") or ""
    memory = memory_for(user_id)
    raw_b64 = payload.get("imageBase64") or ""
    if raw_b64:
        _ensure_pillow()
        raw = base64.b64decode(raw_b64)
        jpeg, mime = normalize_image(raw, payload.get("mime"))
        return {
            "memory": memory,
            "session_id": session_id,
            "text": text,
            "images": [(jpeg, mime)],
            "prior": [],
            "fresh": True,
            "intent": classify_vision_intent(text),
        }
    prior = memory.select(session_id, text, None)
    images = memory.load_images(prior)
    return {
        "memory": memory,
        "session_id": session_id,
        "text": text,
        "images": images,
        "prior": prior,
        "fresh": False,
        "intent": classify_vision_intent(text) if images else "",
    }


def _empty(gathered) -> dict:
    return {
        "ok": True,
        "hasImages": False,
        "fresh": gathered["fresh"],
        "intent": gathered["intent"],
        "recordIds": [item.get("id") for item in gathered["prior"] if item.get("id")],
        "reply": "",
        "anchor": "",
    }


def _finish(runtime, spoken, planner_text, response_plan, selected, prompt_hash) -> str:
    content = runtime.process_bot_output(spoken)
    content = content.replace(" indeed", "").replace("Indeed, ", "").replace("Indeed.", "")
    category = runtime.detect_category(planner_text)
    content = runtime.replace_category_descriptors(content, category)
    if content.lower().startswith("ah,"):
        content = content[3:].lstrip()
    content = runtime.clean_response(content)
    content = runtime.re.sub(r"\(([A-Z][a-z]+(?: ?&? [A-Z][a-z]+)?)\)", "", content)
    content = content.replace("—", ", ")
    content = runtime.re.sub(r"[ \t]+([.,;!?])", r"\1", content)
    content = runtime.polish_sentences(content)
    if "\n\n" not in content and content.count("\n") > 6:
        content = runtime.auto_paragraph(content)
    try:
        finalized = runtime.finalize_response(
            content,
            planner_text,
            response_plan,
            selected_command=selected,
            channel="telegram",
            mode=response_plan.mode,
            prompt_hash=prompt_hash,
            git_commit=_git_commit(),
        )
        content = finalized.text or content
    except Exception as exc:
        print(type(exc).__name__, file=sys.stderr)
    return runtime.safe_emoji(content)


def _ask(messages, api_key: str) -> str:
    if not api_key:
        raise RuntimeError("MoodyBot has no model key configured.")
    body = json.dumps({
        "model": MODEL,
        "messages": messages,
        "max_tokens": 1000,
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://moodybot.ai",
            "X-Title": "MoodyBot",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        print(f"openrouter {exc.code}", file=sys.stderr)
        raise RuntimeError("MoodyBot's signal got scrambled. Try again in a bit.")
    choices = result.get("choices") if isinstance(result, dict) else None
    if not choices:
        raise RuntimeError("MoodyBot's signal got scrambled. Try again in a bit.")
    content = choices[0].get("message", {}).get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("MoodyBot couldn't generate a proper response. Try again.")
    return content


def complete(payload: dict) -> dict:
    gathered = _gather(payload)
    if not gathered["images"]:
        return _empty(gathered)
    runtime = host()
    planner_text = (gathered["text"] or "").strip() or "Look at this image."
    messages, response_plan, prompt_hash, selected = _prepare_model_turn(
        runtime,
        planner_text,
        gathered["text"],
        gathered["intent"] or "auto",
        gathered["images"],
        gathered["prior"],
    )
    from moodybot_vision import split_anchor

    raw = _ask(messages, payload.get("apiKey") or os.environ.get("OPENROUTER_API_KEY") or "")
    spoken, anchor = split_anchor(raw)
    reply = _finish(runtime, spoken, planner_text, response_plan, selected, prompt_hash)
    if not reply or len(reply.strip()) < 10:
        raise RuntimeError("MoodyBot couldn't generate a proper response. Try again.")
    if gathered["fresh"]:
        gathered["memory"].save(
            gathered["session_id"],
            gathered["images"],
            caption=gathered["text"],
            intent=gathered["intent"] or "auto",
            anchor=anchor,
            reply=reply,
            user_message_ids=[],
        )
    elif gathered["prior"]:
        gathered["memory"].touch(
            gathered["session_id"],
            gathered["prior"],
            reply=reply,
            anchor=anchor,
            user_message_id=None,
        )
    return {
        "ok": True,
        "hasImages": True,
        "fresh": gathered["fresh"],
        "intent": gathered["intent"],
        "recordIds": [item.get("id") for item in gathered["prior"] if item.get("id")],
        "reply": reply,
        "anchor": anchor,
    }


def main() -> int:
    try:
        payload = json.load(sys.stdin)
        action = payload.get("action")
        if action == "complete":
            result = complete(payload)
        else:
            result = {"ok": False, "error": "Unknown vision action."}
    except ImageRejected as exc:
        result = {"ok": False, "error": str(exc)}
    except Exception as exc:
        message = str(exc).strip() or "Could not read that image."
        if "key" in message.lower() or "bearer" in message.lower():
            message = "MoodyBot has no model key configured."
        result = {"ok": False, "error": message}
        print(type(exc).__name__, file=sys.stderr)
    json.dump(result, sys.stdout)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
