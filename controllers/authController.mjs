import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { prisma } from "../app.mjs";

// GET /login
const authGetLogin = asyncHandler((req, res) => {
  res.render("login", { title: "Login" });
});

// GET /logout
const authGetLogout = asyncHandler((req, res, next) => {
  req.logout((err) => next(err));
  res.redirect("/");
});

// GET /signup
const authGetSignup = asyncHandler((req, res) => {
  res.render("signup", { title: "Sign Up" });
});

const signupValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 15 })
    .withMessage("Name is required, max 15 characters")
    .isAlphanumeric()
    .withMessage("Name must be alphanumeric"),
  body("password")
    .trim()
    .isLength({ min: 3, max: 15 })
    .withMessage("Password must be between 3 and 15 characters"),
  body("confirmPassword")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords must match");
      }
      return true;
    }),
];

// POST /signup
const authPostSignup = [
  signupValidation,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((e) => req.flash("error", e.msg));
      return res.redirect("/user/signup");
    }
    const { name, password } = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.driveUser.create({
        data: { name, password: encryptedPassword },
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.redirect("/");
      });
    } catch (error) {
      if (error.code === "P2002") {
        // Unique Constraint Violation
        req.flash("error", "User already exists");
        return res.redirect("/user/signup");
      }
      next(error);
    }
  }),
];

export { authGetLogin, authGetLogout, authGetSignup, authPostSignup };
