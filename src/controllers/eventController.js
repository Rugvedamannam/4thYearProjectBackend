const Event = require("../models/Events");

const getEventByType = async (req, res) => {
  try {
    const { type } = req.params;
    const data = await Event.findOne({ type });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.status(201).json({ message: "Event Created Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEventByType, createEvent };