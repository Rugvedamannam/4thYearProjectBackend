const fs = require("fs");
const pdfParse = require("pdf-parse").default;

module.exports = async (pdfPath) => {
  console.log("📄 Reading PDF from path:", pdfPath);

  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);

  console.log("📄 PDF TEXT START ==================");
  console.log(data.text);
  console.log("📄 PDF TEXT END ====================");

  const emailRegex =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  const matches = data.text.match(emailRegex);

  console.log("📧 EMAILS FOUND 👉", matches);

  return matches
    ? [...new Set(matches.map((e) => e.toLowerCase().trim()))]
    : [];
};
