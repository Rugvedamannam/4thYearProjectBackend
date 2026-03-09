const express = require("express");
const router = express.Router();
const editTeamController = require("../controllers/EditTeamController");

router.get("/", editTeamController.getTeamsForEdit);

router.get("/:_id", editTeamController.getTeamDetails);

router.put("/:_id", editTeamController.updateTeamDetails);

router.put("/:_id/member/:memberEmail",
  editTeamController.updateTeamMember
);

/* DELETE MEMBER */
router.delete("/:_id/member/:memberEmail",
  editTeamController.deleteTeamMember
);

module.exports = router;