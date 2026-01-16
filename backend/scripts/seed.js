import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "../src/models/Admin.js";
import Blog from "../src/models/Blog.js";

dotenv.config();

const sampleBlogs = [
  {
    title: "Designing for Reading",
    content:
      "# Designing for Reading\n\nClean typography, generous spacing, and calm color choices make reading effortless.",
    status: "Published"
  },
  {
    title: "Minimal Interfaces, Maximum Clarity",
    content:
      "# Minimal Interfaces, Maximum Clarity\n\nFocus on hierarchy, reduce noise, and let content lead.",
    status: "Published"
  },
  {
    title: "Why Markdown Works",
    content:
      "# Why Markdown Works\n\nIt is readable in raw form and converts beautifully to HTML.",
    status: "Published"
  },
  {
    title: "Draft: Notes on Layout",
    content:
      "# Draft: Notes on Layout\n\nThis draft explores spacing and line length choices.",
    status: "Draft"
  },
  {
    title: "Draft: Building with MERN",
    content:
      "# Draft: Building with MERN\n\nA brief outline of a minimal blog stack.",
    status: "Draft"
  }
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await Admin.create({ email: adminEmail, password: adminPassword });
  }

  await Blog.deleteMany({});
  await Blog.insertMany(sampleBlogs);

  console.log("Seed complete");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
