const express = require("express");
const router = express.Router();

const taskController = require("../controllers/TaskController");

/* CREATE TASK */
router.post("/create-task", taskController.createTask);

/* GET TASKS */
router.get("/tasks", taskController.getTasks);

/* UPDATE TASK */
router.put("/update-task/:id", taskController.updateTaskStatus);

router.delete("/delete-task/:id", taskController.deleteTask);

module.exports = router;