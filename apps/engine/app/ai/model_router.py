import re

from app.config import settings

# Heuristics for "query semplice -> modello economico, query complessa -> modello
# capace" (spec 4). This is intentionally a cheap keyword/length check, not a
# learned classifier -- good enough to cut AI spend on the common case ("qual è
# il fatturato di luglio?") while still routing reasoning-heavy asks ("perché è
# calato il margine, e cosa dovrei aspettarmi il prossimo trimestre?") to the
# stronger model.
COMPLEX_SIGNALS = re.compile(
    r"\bperch[eé]\b|\bprevision|\bforecast|\bconfronta|\bspiega|\btrend\b|\bcorrelazion",
    re.IGNORECASE,
)


def choose_model(message: str) -> str:
    if len(message) > 220 or COMPLEX_SIGNALS.search(message):
        return settings.ai_capable_model
    return settings.ai_cheap_model
