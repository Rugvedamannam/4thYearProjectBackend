const { execFile } = require("child_process");
const path = require("path");

module.exports = (pdfPath) => {
  return new Promise((resolve, reject) => {
    // FIXED: Python script is in src, not utils
    const scriptPath = path.join(__dirname, "../parse_pdf_emails.py");

    console.log("🐍 PYTHON SCRIPT PATH 👉", scriptPath);
    console.log("📄 PDF PATH 👉", pdfPath);

    execFile(
      "python",
      [scriptPath, pdfPath],
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Python execution error:", error);
          return reject(error);
        }

        try {
          const result = JSON.parse(stdout);
          console.log("🐍 PYTHON RESULT 👉", result);

          if (!result.success) {
            return reject(result.error);
          }

          resolve(result.emails);
        } catch (err) {
          console.error("❌ JSON parse error:", err);
          reject(err);
        }
      }
    );
  });
};
