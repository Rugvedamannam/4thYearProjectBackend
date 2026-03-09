const { spawn } = require("child_process");
const HackathonResult = require("../models/HackathonResult");

exports.uploadResults = async (req, res) => {
  try {
    const hackathonId = req.params.hackathonId;
    const pdfPath = req.file.path;

    const python = spawn("python", ["src/python/pdf_parser.py", pdfPath]);

    let parsedData = "";

    python.stdout.on("data", (data) => {
      parsedData += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Python Error:", data.toString());
    });

    python.on("close", async () => {
      try {
        // Extract JSON between markers
        const start = parsedData.indexOf("PARSED_PDF_DATA_START");
        const end = parsedData.indexOf("PARSED_PDF_DATA_END");
        let jsonData = parsedData;
        if (start !== -1 && end !== -1) {
          jsonData = parsedData.slice(start + 21, end).trim();
        }

        const results = JSON.parse(jsonData);

        const docs = results.map((r) => ({
          hackathonId,
          team: r.team,
          email: r.email,
          round: r.round,
          rank: r.rank,
          project: r.project,
          score: r.score,
          scoringBreakdown: r.scoringBreakdown
        }));

        console.log("Documents to insert:", docs);

        await HackathonResult.insertMany(docs);

        res.json({
          message: "Results uploaded and stored successfully",
          count: docs.length
        });
      } catch (err) {
        console.error("Error saving results:", err);
        res.status(500).json({ message: "Error saving results" });
      }
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

exports.getResult = async (req, res) => {
   try {
    const { email } = req.params;

    const result = await HackathonResult.findOne({ email });

    if (!result) {
      return res.status(404).json({
        message: "Result not found for this email"
      });
    }

    res.json(result);

  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({
      message: "Error fetching result"
    });
  }
};