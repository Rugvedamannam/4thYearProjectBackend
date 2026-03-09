const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middlewares/auth");
const resultController = require("../controllers/resultPageController");

const upload = multer({
  dest: "uploads/"
});

router.post(
  "/:hackathonId/upload",auth,
  upload.single("resultsPdf"),
  resultController.uploadResults
);

router.get("/results/:email", resultController.getResult);

module.exports = router;