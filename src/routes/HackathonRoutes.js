const router = require("express").Router();
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");
const controller = require("../controllers/HackathonController");

// Create hackathon
router.post(
  "/",
  auth, // ✅ ADD THIS
  upload.fields([
    { name: "banner", maxCount: 1 },
    { name: "rulesPdf", maxCount: 1 },
    { name: "participantsPdf", maxCount: 1 },
  ]),
  controller.createHackathon
);


router.get("/my-hackathons", auth, controller.getMyHackathons);

// Public list
router.get("/all", controller.getAllHackathons);

// Hackathon details (protected)
router.get("/:id", auth, controller.getHackathonById);

// Check user access
router.get("/:hackathonId/check-access", auth, controller.checkUserAllowed);

// Update general info (organizer only)
router.put(
  "/:id/general-info",
  auth,
  upload.single("banner"),
  controller.updateGeneralInfo
);

module.exports = router;
