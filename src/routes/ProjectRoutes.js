// routes/projectRoutes.js
const router = require("express").Router();
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");
const controller = require("../controllers/ProjectController");


// Create project (Organizer only)
router.post(
  "/",
  auth,
  upload.fields([
     { name: "banner", maxCount: 1 },
    { name: "problemStatementPdf", maxCount: 1 },
    { name: "dataset", maxCount: 1 },
    { name: "starterCode", maxCount: 1 }
  ]),
  controller.createProject
);


// Organizer projects
router.get("/my-projects", auth, controller.getMyProjects);

router.get("/:id", controller.getProjectDetails);


// Public list
router.get("/all", controller.getAllProjects);



module.exports = router;