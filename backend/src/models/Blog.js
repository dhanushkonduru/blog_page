import mongoose from "mongoose";
import slugify from "slugify";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true },
    coverImage: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Draft"
    }
  },
  { timestamps: true }
);

blogSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.slice(0, 160);
  }
  next();
});

export default mongoose.model("Blog", blogSchema);
