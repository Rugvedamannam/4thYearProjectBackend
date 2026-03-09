const Task = require("../models/TaskModel");

/* ===== CREATE TASK ===== */
exports.createTask = async (req, res) => {
  try {

    const { email, title, date, difficulty } = req.body;

    const task = new Task({
      email,
      title,
      date,
      difficulty,
      status: "todo"
    });

    const savedTask = await task.save();

    res.status(201).json(savedTask);

  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ===== GET TASKS ===== */
exports.getTasks = async (req, res) => {
  try {

    const { email } = req.query;

    const tasks = await Task.find({ email });

    res.status(200).json(tasks);

  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ===== UPDATE TASK STATUS ===== */
exports.updateTaskStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);

  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTask = async (req, res) => {
  try {

    const { id } = req.params;

    await Task.findByIdAndDelete(id);

    res.json({ message: "Task deleted" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};