import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { sanitizeText } from "../utils/sanitize.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });

export const loginAdmin = asyncHandler(async (req, res) => {
  const email = sanitizeText(req.body.email);
  const password = req.body.password || "";

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await admin.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    token: signToken(admin._id),
    admin: { id: admin._id, email: admin.email }
  });
});
