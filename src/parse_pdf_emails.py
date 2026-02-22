import sys
import re
import json

try:
    import pdfplumber
except ImportError:
    print(json.dumps({"success": False, "error": "pdfplumber not installed"}))
    sys.exit(1)

pdf_path = sys.argv[1]
emails = set()

try:
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pattern = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
                found = re.findall(pattern, text)
                emails.update([e.lower().strip() for e in found])

    print(json.dumps({"success": True, "emails": list(emails)}))

except (IOError, OSError) as e:
    print(json.dumps({"success": False, "error": str(e)}))
