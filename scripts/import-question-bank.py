#!/usr/bin/env python3
"""Import licensed question-bank PDFs into a compact, server-side JSON bank.

Usage: python scripts/import-question-bank.py /path/to/pdfs
The original PDFs are never copied into the repository or client assets.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import pdfplumber
from pypdf import PdfReader
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "server" / "data" / "question-bank.json"
IMAGES = ROOT / "public" / "qbank-images"
PDF_ROOT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Downloads"
SOURCES = {
    "FMGE-Chapterwise": ("FMGE", "chapterwise"),
    "FMGE-Yearwise": ("FMGE", "yearwise"),
    "INICET-Yearwise": ("INI-CET", "yearwise"),
    "NEETPG-Chapterwise": ("NEET-PG", "chapterwise"),
    "NEETPG-Yearwise": ("NEET-PG", "yearwise"),
}
SUBJECTS = [
    "Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Microbiology",
    "Forensic Medicine", "Social and Preventive Medicine", "Community Medicine", "PSM", "FMT", "ENT",
    "Ophthalmology", "Medicine", "Psychiatry", "Dermatology", "Surgery", "Orthopedics",
    "Radiology", "Anesthesia", "Obstetrics and Gynaecology", "Pediatrics", "Paediatrics",
]
SUBJECT_ID = {
    "forensic medicine": "fmt", "fmt": "fmt", "social and preventive medicine": "psm", "psm": "psm",
    "community medicine": "psm", "ent": "ent", "ophthalmology": "ophthalmology",
    "obstetrics and gynaecology": "obg", "pediatrics": "pediatrics", "paediatrics": "pediatrics",
    "anesthesia": "anesthesia", "orthopedics": "orthopedics", "radiology": "radiology",
}
QSTART = re.compile(r"(?m)^\s*(\d{1,3})\.\s+(?=\S)")
ANSWER = re.compile(r"(?:\x01A(?:n|s)\s*\x01|\bAns\s*:)\s*(?:\d{4})?", re.I)
OPTION = re.compile(r"(?<![A-Za-z0-9])\(([A-D])\)\s*")
KEY = re.compile(r"(?m)^\s*\(([A-D])\)\s*")


def norm(value):
    return re.sub(r"\s+", " ", value or "").strip()


def subject_for(text, fallback=""):
    head = norm(text[-1800:]).lower()
    compact_head = re.sub(r"[^a-z]", "", head)
    if "obsgyne" in compact_head or "obgyn" in compact_head or "obstetricsandgynaecology" in compact_head:
        return "Obstetrics and Gynaecology"
    matches = []
    for label in SUBJECTS:
        low = label.lower()
        found = list(re.finditer(rf"(?<![a-z]){re.escape(low)}(?![a-z])", head))
        if found:
            pos = found[-1].start()
            matches.append((pos + len(low), len(low), label))
    if matches:
        found = max(matches)[2]
        return {"psm": "Social and Preventive Medicine", "fmt": "Forensic Medicine"}.get(found.lower(), found)
    # Normalize common OCR letter spacing and minor naming differences.
    squashed = re.sub(r"[^a-z]", "", head)
    for label in [item for item in SUBJECTS if len(item) >= 4]:
        if re.sub(r"[^a-z]", "", label.lower()) in squashed:
            return label
    return fallback or ""


def year_for(text, fallback=None):
    found = re.findall(r"(?:JANUARY|FEBRUARY|MARCH|MAY|JUNE|JULY|AUGUST|SEPTEMBER|NOVEMBER|DECEMBER)[- ](20\d{2})|EXAMINATION PAPER[^\n]{0,50}?(20\d{2})", text, re.I)
    for a, b in reversed(found):
        if a or b:
            return int(a or b)
    years = re.findall(r"\b(20(?:1[8-9]|2[0-5]))\b", text[-1200:])
    return int(years[-1]) if years else fallback


def page_subject_header(text, first_question_start):
    prefix = text[:first_question_start]
    # Chapterwise books print the section heading as a numbered chapter.
    chapters = list(re.finditer(r"(?i)\bchapter\s*0?\s*\d{1,2}\b", prefix))
    for marker in reversed(chapters):
        lines = prefix[marker.start():].splitlines()
        snippet = "\n".join(lines[:3])
        if re.search(r"(?i)\banswer\b", lines[0] if lines else ""):
            continue
        subject = subject_for(snippet)
        if subject:
            return subject
    # Yearwise collections put the subject directly under the page's exam heading.
    exam_headers = list(re.finditer(r"(?i)examination\s+paper", prefix))
    first_answer = ANSWER.search(prefix)
    for header in exam_headers:
        if header.start() > 220 or (first_answer and first_answer.start() < header.start()):
            continue
        snippet = "\n".join(prefix[header.end():].splitlines()[:3])
        subject = subject_for(snippet)
        if subject:
            return subject
    # Some books use a single compact running header such as "MEDINK chapter 16 Dermatology".
    compact = re.search(r"(?i)medink\s+chapter\s*0?\s*\d{1,2}", prefix[:260])
    if compact:
        snippet = prefix[compact.start():].splitlines()[0]
        subject = "" if re.search(r"(?i)\banswer\b", snippet) else subject_for(snippet)
        if subject:
            return subject
    return ""


SUBJECT_RULES = {
    "Anatomy": [r"\banatom", r"\bnerve supply\b", r"\bcranial nerve\b", r"\bforamen\b", r"\bmuscle\b", r"\bligament\b", r"\bembryolog", r"\bdermatome\b", r"\bplexus\b", r"\bjoint\b", r"\bbone\b"],
    "Physiology": [r"\bphysiolog", r"\breflex\b", r"\baction potential\b", r"\bosmolality\b", r"\bclearance\b", r"\bventilation.perfusion\b", r"\bcardiac cycle\b", r"\bwiggers\b", r"\bacid.base\b", r"\bnerve conduction\b"],
    "Biochemistry": [r"\bbiochem", r"\benzyme\b", r"\bmetabol", r"\bvitamin\b", r"\bcofactor\b", r"\bglycolysis\b", r"\bpathway\b", r"\bamino acid\b", r"\bnucleotide\b", r"\burea cycle\b"],
    "Pathology": [r"\bpatholog", r"\bhistolog", r"\bhistopath", r"\bbiopsy\b", r"\bcarcinoma\b", r"\bmalignan", r"\bneoplasm\b", r"\btumou?r\b", r"\bleukemia\b", r"\blymphoma\b", r"\bnecrosis\b", r"\bapoptosis\b", r"\bgranuloma\b"],
    "Pharmacology": [r"\bpharmac", r"\bdrug of choice\b", r"\bmechanism of action\b", r"\badverse effect\b", r"\bside effect\b", r"\btherapeutic index\b", r"\bantidote\b", r"\breceptor agonist\b", r"\breceptor antagonist\b", r"\bdose of\b", r"\bdrug\b"],
    "Microbiology": [r"\bmicrobiolog", r"\bbacter", r"\bvirus\b", r"\bviral\b", r"\bfung", r"\bparasite\b", r"\bculture\b", r"\bgram stain\b", r"\bserology\b", r"\bhbsag\b", r"\bhiv\b", r"\bmycobacter", r"\bmalaria\b"],
    "Social and Preventive Medicine": [r"\bepidemiolog", r"\bincidence\b", r"\bprevalence\b", r"\bscreening\b", r"\bsensitivity\b", r"\bspecificity\b", r"\bstudy design\b", r"\bvaccin", r"\bcold chain\b", r"\bbiostat", r"\bmaternal mortality\b", r"\bhealth program\b", r"\bpopulation\b"],
    "Forensic Medicine": [r"\bforensic\b", r"\bpost.mortem\b", r"\bautopsy\b", r"\bmedico.legal\b", r"\brigor mortis\b", r"\blivor mortis\b", r"\bbruise age\b", r"\bage of injury\b", r"\bdecomposition\b"],
    "ENT": [r"\bent\b", r"\bear\b", r"\bnasal\b", r"\bsinus\b", r"\bhearing\b", r"\blarynx\b", r"\bpharyn", r"\btympan", r"\btonsil\b", r"\bmiddle ear\b", r"\bvertigo\b"],
    "Ophthalmology": [r"\bophthalm", r"\beye\b", r"\bretina\b", r"\bcornea\b", r"\boptic nerve\b", r"\bfundus\b", r"\bglaucoma\b", r"\bcataract\b", r"\bvisual acuity\b", r"\bpupil\b"],
    "Medicine": [r"\binternal medicine\b", r"\bcardiology\b", r"\bhypertension\b", r"\bdiabetes mellitus\b", r"\bnephrotic\b", r"\bcirrhosis\b", r"\bmyocardial infarction\b", r"\bheart failure\b", r"\bcopd\b", r"\basthma\b", r"\bautoimmune\b", r"\bneurologic", r"\bthyroid disease\b"],
    "Psychiatry": [r"\bpsychiatr", r"\bpsychosis\b", r"\bschizophren", r"\bdelusion\b", r"\bhallucination\b", r"\bmania\b", r"\bdepression\b", r"\bmood disorder\b", r"\banxiety disorder\b", r"\bmental status\b", r"\bflight of ideas\b"],
    "Surgery": [r"\bsurgery\b", r"\bsurgical\b", r"\bappendicitis\b", r"\bcholecystitis\b", r"\bhernia\b", r"\btrauma\b", r"\bwound\b", r"\bpostoperative\b", r"\bincision\b", r"\bacute abdomen\b", r"\bmastectomy\b", r"\bstoma\b"],
    "Obstetrics and Gynaecology": [r"\bobstetric", r"\bgynaec", r"\bgynecol", r"\bpregnan", r"\bgestation\b", r"\bantenatal\b", r"\bintrapartum\b", r"\bpostpartum\b", r"\blabou?r\b", r"\bfetal\b", r"\bplacenta\b", r"\bmenstrual\b", r"\bovarian\b", r"\bcervix\b", r"\buterus\b", r"\bcontraception\b"],
    "Pediatrics": [r"\bpediatric", r"\bpaediatric", r"\bnewborn\b", r"\bneonate\b", r"\binfant\b", r"\bchild\b", r"\bchildhood\b", r"\bgrowth chart\b", r"\bdevelopmental milestone\b", r"\bimmunodeficiency\b"],
    "Orthopedics": [r"\borthop", r"\bfracture\b", r"\bdislocation\b", r"\bosteomyelitis\b", r"\bosteoporosis\b", r"\bbone tumor\b", r"\bjoint replacement\b", r"\bhip joint\b", r"\bspinal deformity\b", r"\bcast\b"],
    "Dermatology": [r"\bdermatolog", r"\bskin\b", r"\brash\b", r"\bpsoriasis\b", r"\beczema\b", r"\bblister\b", r"\bvesicle\b", r"\balopecia\b", r"\bvitiligo\b", r"\bdermatitis\b", r"\bmelanoma\b"],
    "Radiology": [r"\bradiolog", r"\bx.ray\b", r"\bradiograph\b", r"\bcomputed tomography\b", r"\b\bct scan\b", r"\bmri\b", r"\bultrasound\b", r"\bcontrast study\b", r"\bradiotherapy\b", r"\birradiation\b", r"\bradiation dose\b"],
    "Anesthesia": [r"\banesthes", r"\banesthes", r"\bintubation\b", r"\bairway management\b", r"\bspinal anesthesia\b", r"\bepidural\b", r"\bneuromuscular blocker\b", r"\bvolatile agent\b", r"\bmac value\b", r"\bpreoperative\b", r"\bintraoperative\b"],
}


def classify_question_subject(question):
    material = " ".join([question["stem"], *question["options"].values()]).lower()
    scores = {name: sum(2 if re.search(pattern, material) else 0 for pattern in patterns) for name, patterns in SUBJECT_RULES.items()}
    best = max(scores.values(), default=0)
    if best < 2:
        if re.search(r"\b(patient|diagnos|management|treatment|clinical|disease|symptom|presentation|most likely)\b", material):
            return "Medicine"
        return ""
    winners = [name for name, score in scores.items() if score == best]
    return winners[0] if len(winners) == 1 else ""


def page_questions(text):
    starts = list(QSTART.finditer(text))
    candidates = []
    for idx, match in enumerate(starts):
        end = starts[idx + 1].start() if idx + 1 < len(starts) else len(text)
        block = text[match.end():end]
        ans = ANSWER.search(block)
        if not ans:
            continue
        before = block[:ans.start()]
        opts = {}
        option_matches = list(OPTION.finditer(before))
        for opt_idx, opt in enumerate(option_matches):
            key = opt.group(1)
            if key in opts:
                continue
            opt_end = option_matches[opt_idx + 1].start() if opt_idx + 1 < len(option_matches) else len(before)
            opts[key] = norm(before[opt.end():opt_end])
        if set(opts) != set("ABCD"):
            continue
        after = block[ans.end():].lstrip()
        answer_match = KEY.search(after)
        if not answer_match:
            continue
        key = answer_match.group(1)
        explanation = norm(after[answer_match.end():])
        stem = norm(before)
        # Remove option text from stem at the first option label.
        first_opt = OPTION.search(before)
        stem = norm(before[:first_opt.start()]) if first_opt else stem
        if len(stem) < 12 or len(explanation) < 24:
            continue
        candidates.append({"number": int(match.group(1)), "stem": stem, "options": opts,
                           "correctAnswer": key, "explanation": explanation,
                           "_start": match.start(), "_end": end})
    # Rebuild ranges around accepted question starts to retain explanations spanning list-like numerals.
    for i, item in enumerate(candidates):
        item["_end"] = candidates[i + 1]["_start"] if i + 1 < len(candidates) else len(text)
    return candidates


def image_candidates(pdf_page, pypdf_page, questions):
    # Do not gate extraction on words such as "image" or "identify": many
    # genuine visual questions say only "illustrated below", or do not mention
    # the figure at all. Match embedded figures to questions using page geometry.
    image_objs = [im for im in pdf_page.images if im.get("width", 0) >= 100 and im.get("height", 0) >= 65]
    if not image_objs or not questions:
        return {}
    words = pdf_page.extract_words(x_tolerance=2, y_tolerance=3, keep_blank_chars=False)
    # Match image XObjects by resource name to the exact page location reported by pdfplumber.
    embedded = {}
    try:
        for image in pypdf_page.images:
            embedded[image.name.split(".")[0]] = image
    except Exception:
        pass
    word_tokens = [re.findall(r"[a-z0-9]+", word["text"].lower()) for word in words]

    def question_position(q):
        expected = re.findall(r"[a-z0-9]+", q["stem"].lower())[:5]
        if not expected:
            return None
        matches = []
        for i, tokens in enumerate(word_tokens):
            if tokens != [str(q["number"])]:
                continue
            following = [token for group in word_tokens[i + 1:i + 8] for token in group]
            matched = 0
            for actual, wanted in zip(following, expected):
                if actual != wanted:
                    break
                matched += 1
            if matched >= min(2, len(expected)):
                matches.append((matched, words[i]))
        if matches:
            return max(matches, key=lambda item: item[0])[1]
        # Layout extraction occasionally separates a number label from its
        # stem. Fall back to an unambiguous matching stem prefix.
        for i, tokens in enumerate(word_tokens):
            following = [token for group in word_tokens[i:i + 8] for token in group]
            matched = 0
            for actual, wanted in zip(following, expected):
                if actual != wanted:
                    break
                matched += 1
            if matched >= 4:
                matches.append((matched, words[i]))
        return max(matches, key=lambda item: item[0])[1] if matches else None

    positions = [question_position(q) for q in questions]
    positioned = [i for i, pos in enumerate(positions) if pos is not None]
    if not positioned:
        return {}
    mid_x = float(pdf_page.width) / 2

    def same_column(question_index, obj):
        # Full-width images can sit between columns; assign those by vertical
        # proximity. Otherwise keep figures with questions in their own column.
        if float(obj.get("x0", 0)) < mid_x < float(obj.get("x1", 0)):
            return True
        return (float(positions[question_index]["x0"]) < mid_x) == (float(obj.get("x0", 0)) < mid_x)

    result = {}
    for obj in image_objs:
        name = str(obj.get("name", ""))
        image = embedded.get(name)
        if image is None:
            continue
        top = float(obj.get("top", 0))
        column_questions = [i for i in positioned if same_column(i, obj)]
        candidates = column_questions or positioned
        # Prefer the question block that contains the figure. This avoids
        # assigning a left-column image to a nearby right-column question.
        containing = []
        for i in candidates:
            qtop = float(positions[i]["top"])
            next_tops = [float(positions[j]["top"]) for j in candidates if float(positions[j]["top"]) > qtop]
            next_top = min(next_tops) if next_tops else float(pdf_page.height)
            if qtop - 55 <= top < next_top - 4:
                containing.append(i)
        pool = containing or candidates
        nearest = min(pool, key=lambda i: abs(float(positions[i]["top"]) - top))
        if abs(float(positions[nearest]["top"]) - top) > 240:
            continue
        try:
            payload = image.data
            if len(payload) < 1500:
                continue
            pil = Image.open(__import__("io").BytesIO(payload)).convert("RGB")
            pil.thumbnail((1200, 1200))
            key = hashlib.sha256(pil.tobytes()).hexdigest()[:20]
            target = IMAGES / f"{key}.webp"
            if not target.exists():
                pil.save(target, "WEBP", quality=86, method=5)
            result.setdefault(nearest, []).append(f"/qbank-images/{target.name}")
        except Exception:
            continue
    return result


def main():
    IMAGES.mkdir(parents=True, exist_ok=True)
    records, rejected, source_counts = {}, [], {}
    for basename, (exam, collection) in SOURCES.items():
        pdf_path = PDF_ROOT / f"{basename}_unlocked.pdf"
        if not pdf_path.exists():
            print(f"MISSING {pdf_path}")
            continue
        print(f"Reading {basename}…", flush=True)
        reader = PdfReader(str(pdf_path), strict=False)
        with pdfplumber.open(pdf_path) as pdf:
            rolling = ""
            current_subject = "Uncategorized"
            for page_idx in range(len(reader.pages)):
                pypdf_page = reader.pages[page_idx]
                text = pypdf_page.extract_text() or ""
                questions = page_questions(text)
                if not questions:
                    rolling = (rolling + "\n" + text)[-1800:]
                    continue
                page_subject = page_subject_header(text, questions[0]["_start"])
                if page_subject:
                    current_subject = page_subject
                topic = current_subject
                year = year_for(text[:questions[0]["_start"]] + rolling)
                images = image_candidates(pdf.pages[page_idx], pypdf_page, questions)
                source_counts[basename] = source_counts.get(basename, 0)
                for i, q in enumerate(questions):
                    block_end = q["_end"]
                    rationale_end = min(block_end, q["_start"] + 9000)
                    # Restrict rationale to the page-local chunk after the answer marker; no PDF markup.
                    segment = text[q["_start"]:rationale_end]
                    ans = ANSWER.search(segment)
                    rationale = ""
                    if ans:
                        am = KEY.search(segment[ans.end():])
                        if am:
                            rationale = norm(segment[ans.end():][am.end():])
                    rationale = re.sub(r"Downloaded from.*$", "", rationale, flags=re.I)
                    rationale = rationale.strip()
                    # The page-local slice can truncate a rationale on dense
                    # pages. page_questions already extracted the full answer
                    # explanation from this question's source block, so retain
                    # that verified source text as a safe fallback.
                    if len(rationale) < 24:
                        rationale = re.sub(r"Downloaded from.*$", "", q.get("explanation", ""), flags=re.I).strip()
                    source_explanation_available = len(rationale) >= 24
                    if not source_explanation_available:
                        # Preserve valid MCQs even when the licensed PDF omits
                        # a rationale. The API/UI carries this flag so the
                        # learner is never shown this notice as source teaching.
                        rationale = "No source explanation was included for this question in the supplied PDF."
                    source_key = f"{exam}|{year or 'unknown'}|{q['correctAnswer']}|{re.sub(r'[^a-z0-9]+',' ',q['stem'].lower()).strip()}|{' '.join(q['options'].values()).lower()}"
                    digest = hashlib.sha256(source_key.encode()).hexdigest()[:24]
                    question_subject = topic
                    if collection == "yearwise" or topic == "Uncategorized":
                        question_subject = page_subject or classify_question_subject(q) or "Uncategorized"
                    subject_id = SUBJECT_ID.get(question_subject.lower(), re.sub(r"[^a-z0-9]+", "-", question_subject.lower()).strip("-"))
                    imgs = images.get(i, [])
                    record = {
                        "id": f"qb-{digest}", "exam": exam, "year": year, "subjectId": subject_id,
                        "subjectName": question_subject, "topicName": question_subject, "stem": q["stem"],
                        "options": [{"key": k, "text": q["options"][k]} for k in "ABCD"],
                        "correctAnswer": q["correctAnswer"], "explanation": rationale[:7000],
                        "sourceExplanationAvailable": source_explanation_available,
                        "imageUrl": imgs[0] if imgs else None, "imageUrls": imgs,
                        "source": basename, "collection": collection, "sourcePage": page_idx + 1,
                        "sourceQuestionNumber": q["number"], "isImageBased": bool(imgs),
                    }
                    prior = records.get(digest)
                    # Prefer chapterwise's explicit subject label; borrow the figure if another copy has it.
                    if prior is None or (collection == "chapterwise" and prior.get("collection") != "chapterwise"):
                        if prior and not record.get("imageUrl") and prior.get("imageUrl"):
                            record["imageUrl"] = prior["imageUrl"]
                            record["imageUrls"] = prior.get("imageUrls", [prior["imageUrl"]])
                            record["isImageBased"] = True
                        records[digest] = record
                    elif imgs and not prior.get("imageUrl"):
                        prior["imageUrl"] = imgs[0]
                        prior["imageUrls"] = imgs
                        prior["isImageBased"] = True
                    source_counts[basename] += 1
                rolling = (rolling + "\n" + text)[-1800:]
                if (page_idx + 1) % 25 == 0:
                    print(f"  {page_idx+1}/{len(reader.pages)} pages; unique {len(records)}", flush=True)
    payload = {"version": 1, "generatedAt": "2026-10-10", "sourceCounts": source_counts,
               "questionCount": len(records), "questions": list(records.values())}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    report = {"importedUnique": len(records), "sourceCounts": source_counts, "rejectedCount": len(rejected),
              "rejectedRecords": rejected, "rejectedByReason": {}, "subjectCounts": {}, "examCounts": {},
              "questionsWithoutSourceExplanation": sum(not q.get("sourceExplanationAvailable", True) for q in records.values()),
              "imageCount": sum(bool(q["imageUrl"]) for q in records.values()),
              "imageCountByExam": {}, "imageReferences": sum(len(q.get("imageUrls", [])) for q in records.values()),
              "dataBytes": OUT.stat().st_size, "imageBytes": sum(p.stat().st_size for p in IMAGES.glob("*.webp"))}
    for row in rejected:
        report["rejectedByReason"][row["reason"]] = report["rejectedByReason"].get(row["reason"], 0) + 1
    for q in records.values():
        report["subjectCounts"][q["subjectName"]] = report["subjectCounts"].get(q["subjectName"], 0) + 1
        report["examCounts"][q["exam"]] = report["examCounts"].get(q["exam"], 0) + 1
        if q.get("imageUrl"):
            report["imageCountByExam"][q["exam"]] = report["imageCountByExam"].get(q["exam"], 0) + 1
    referenced = {url.rsplit("/", 1)[-1] for q in records.values() for url in q.get("imageUrls", [])}
    for image_path in IMAGES.glob("*.webp"):
        if image_path.name not in referenced:
            image_path.unlink()
    report["imageBytes"] = sum(p.stat().st_size for p in IMAGES.glob("*.webp"))
    report["uniqueImageAssets"] = len(referenced)
    (ROOT / "question-bank-import-report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
