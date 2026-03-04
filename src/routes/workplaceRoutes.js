const express = require("express");
const workplaceController = require("../controllers/workplaceController");
// const auth = require("../middlewares/auth");

const router = express.Router();

/* WORKPLACE DASHBOARD */
router.get(
  "/dashboard",
  workplaceController.getWorkplaceDashboard
);

/* WORKPLACE DETAILS PAGE */
router.get(
  "/details",
  workplaceController.getWorkplaceDetails
);

module.exports = router;