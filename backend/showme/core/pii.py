import re

# Same rules as browser patterns.ts (ARCH §7): email, phone, card+Luhn, UK postcode, IBAN, digit runs >=8.
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
IBAN = re.compile(r"\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?\d{1,3})?\b")
POSTCODE = re.compile(r"\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b", re.IGNORECASE)
CARD_CANDIDATE = re.compile(r"\b(?:\d[ -]?){12,18}\d\b")
PHONE = re.compile(r"\+?\d[\d ()-]{7,}\d")
DIGIT_RUN = re.compile(r"\b\d{8,}\b")


def _luhn(digits: str) -> bool:
    total, alt = 0, False
    for ch in reversed(digits):
        d = int(ch)
        if alt:
            d = d * 2 - 9 if d * 2 > 9 else d * 2
        total += d
        alt = not alt
    return total % 10 == 0


def _is_card(m: re.Match[str]) -> bool:
    digits = re.sub(r"\D", "", m.group())
    return 13 <= len(digits) <= 19 and _luhn(digits)


_PATTERNS: list[tuple[re.Pattern[str], object]] = [
    (EMAIL, None),
    (IBAN, None),
    (POSTCODE, None),
    (CARD_CANDIDATE, _is_card),
    (PHONE, None),
    (DIGIT_RUN, None),
]


def _matches(text: str) -> list[tuple[int, int]]:
    spans: list[tuple[int, int]] = []
    for pat, check in _PATTERNS:
        for m in pat.finditer(text):
            if check is not None and not check(m):  # type: ignore[operator]
                continue
            if pat is PHONE:
                digits = re.sub(r"\D", "", m.group())
                if not 9 <= len(digits) <= 15:
                    continue
            spans.append((m.start(), m.end()))
    return spans


def contains_pii(text: str) -> bool:
    return bool(_matches(text))


def mask_pii(text: str) -> str:
    spans = sorted(_matches(text))
    if not spans:
        return text
    out, pos = [], 0
    for start, end in spans:
        if start < pos:
            continue
        out.append(text[pos:start])
        out.append("[hidden]")
        pos = end
    out.append(text[pos:])
    return "".join(out)
