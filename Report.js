const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  type: String,
  desc: String,
  lat: Number,
  lng: Number,
  notify: Boolean,
  user: String,
  status: { type: String, default: "New" },
  media: [String] // array of file paths
});

module.exports = mongoose.model("Report", reportSchema);