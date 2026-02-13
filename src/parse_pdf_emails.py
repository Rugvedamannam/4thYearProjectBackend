import sys, re, json, pdfplumber

pdf_path = sys.argv[1]
emails = set()

try:
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                found = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
                emails.update([e.lower().strip() for e in found])

    print(json.dumps({"success": True, "emails": list(emails)}))

except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
