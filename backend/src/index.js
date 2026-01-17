import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app.js";
import Admin from "./models/Admin.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const ensureDefaultAdmin = async () => {
  const adminUsername = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const existingAdmin = await Admin.findOne({ username: adminUsername });
  if (!existingAdmin) {
    await Admin.create({ username: adminUsername, password: adminPassword });
  }
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    return ensureDefaultAdmin();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1);
  });
