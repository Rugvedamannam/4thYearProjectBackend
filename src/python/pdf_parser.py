# pdf_parser.py
import sys
import fitz  # PyMuPDF
import json
import re

pdf_path = sys.argv[1]
results = []

# Read PDF
doc = fitz.open(pdf_path)
text = ""
for page in doc:
    text += page.get_text("text") + "\n"

# Split entries by "Name:"
entries = re.split(r"\bName\s*:", text, flags=re.IGNORECASE)
for entry in entries:
    if entry.strip() == "":
        continue

    # Extract fields
    name_match = re.search(r"^(.*)", entry.strip())
    email_match = re.search(r"Email\s*:\s*(.*)", entry, re.IGNORECASE)
    round_match = re.search(r"Round\s*:?\s*(\d+)", entry, re.IGNORECASE)
    result_match = re.search(r"Result\s*:?\s*(.*)", entry, re.IGNORECASE)
    project_match = re.search(r"projectName\s*:?\s*(.*)", entry, re.IGNORECASE)
    score_match = re.search(r"score\s*:?\s*(\d+)", entry, re.IGNORECASE)

    # Scoring breakdown inside brackets
    scoring_text_match = re.search(r"scoring breakdown\s*:\s*\[(.*?)\]", entry, re.IGNORECASE | re.DOTALL)
    scoringBreakdown = {
        "innovation": 0,
        "technicalComplexity": 0,
        "presentation": 0,
        "marketPotential": 0
    }
    if scoring_text_match:
        scoring_text = scoring_text_match.group(1)
        # Extract individual scores
        innovation_match = re.search(r"innovation\s*:\s*([\d.]+)", scoring_text, re.IGNORECASE)
        tech_match = re.search(r"technical complexity\s*:\s*([\d.]+)", scoring_text, re.IGNORECASE)
        presentation_match = re.search(r"presentation\s*:\s*([\d.]+)", scoring_text, re.IGNORECASE)
        market_match = re.search(r"market potential\s*:\s*([\d.]+)", scoring_text, re.IGNORECASE)

        scoringBreakdown = {
            "innovation": float(innovation_match.group(1)) if innovation_match else 0,
            "technicalComplexity": float(tech_match.group(1)) if tech_match else 0,
            "presentation": float(presentation_match.group(1)) if presentation_match else 0,
            "marketPotential": float(market_match.group(1)) if market_match else 0
        }

    # Rank from result string, e.g., "1st place" -> 1, "eliminated" -> 0
    rank_str = result_match.group(1) if result_match else ""
    rank = int(re.sub(r'\D', '', rank_str)) if re.search(r'\d+', rank_str) else 0

    results.append({
        "team": name_match.group(1).strip() if name_match else "",
        "email": email_match.group(1).strip() if email_match else "",
        "round": int(round_match.group(1)) if round_match else 1,
        "rank": rank,
        "project": project_match.group(1).strip() if project_match else "",
        "score": float(score_match.group(1)) if score_match else 0,
        "scoringBreakdown": scoringBreakdown
    })

# Output JSON for Node.js
print("PARSED_PDF_DATA_START")
print(json.dumps(results, indent=2))
print("PARSED_PDF_DATA_END")