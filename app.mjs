import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import flash from "connect-flash";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import methodOverride from "method-override";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { PrismaClient } from "@prisma/client";
import authRouter from "./routers/authRouter.mjs";

// Set the environment variables
dotenv.config();

const app = express();

// EJS configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Prisma client
export const prisma = new PrismaClient();
// Session configuration
app.use(
  session({
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
    secret: process.env.FOO_COOKIE_SECRET,
    resave: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    saveUninitialized: false,
  })
);

// Passport configuration
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Flash messages configuration
app.use(flash());
app.use((req, res, next) => {
  var msgs = req.flash();
  res.locals.messages = msgs;
  res.locals.hasMessages = !!Object.keys(msgs).length;
  next();
});

// Routes
app.use("/", appRouter);
app.use("/user/*", authRouter);

// 404 Error handler
app.use((req, res, next) => {
  next(createError(404));
});

// General error handler
app.use((err, req, res, next) => {
  let msg = err.message;
  msg = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("errorPage", { title: "Error", msg });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});