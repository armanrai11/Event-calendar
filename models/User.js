// User model (MongoDB collection: "users")
// We only store a bcrypt HASH of the password, never the plain password.
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    token: { type: String, default: "" }, // current login session token
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
