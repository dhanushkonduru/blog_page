import express from "express";
import { body } from "express-validator";
import { loginAdmin } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password required")
  ],
  validate,
  loginAdmin
);

export default router;
