const mongoose = require("mongoose");

// One event = title, date, time, category and a short description
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, default: "" }, // HH:MM
    category: {
      type: String,
      enum: ["Work", "Personal", "Study", "Birthday", "Other"],
      default: "Other",
    },
    description: { type: String, default: "" },
    username: { type: String, default: "" }, // owner: each user sees only their own events
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
