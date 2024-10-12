import express from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import GoogleStrategy from "passport-google-oidc";
import bcrypt from "bcryptjs";
import { prisma } from "../app.mjs";
import {
  authGetLogin,
  authGetSignup,
  authPostSignup,
  authGetLogout,
} from "../controllers/authController.mjs";

/**
 * The passport configuration.
 */

passport.use(
  new LocalStrategy(
    { usernameField: "name", passwordField: "password" },
    asyncHandler(async (name, password, done) => {
      const resDb = await prisma.driveUser.findUnique({
        where: { name },
        select: { id: true, name: true, password: true },
      });

      if (!resDb) return done(null, false, { message: "User not found" });

      const user = resDb;
      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    })
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      callbackURL: "/user/oauth2/redirect/google",
      scope: ["profile"],
    },
    asyncHandler(async (issuer, profile, done) => {
      let resDb = await prisma.driveFederatedCredential.findUnique({
        where: {
          provider_subject: {
            provider: "google",
            subject: profile.id,
          },
        },
        select: {
          User: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      console.log(resDb);

      if (!resDb)
        resDb = await prisma.driveFederatedCredential.create({
          data: {
            provider: "google",
            subject: profile.id,
            User: { create: { name: profile.displayName } },
          },
          select: { User: { select: { id: true, name: true } } },
        });

      const user = resDb.User;
      return done(null, user);
    })
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(
  asyncHandler(async (id, done) => {
    const user = await prisma.driveUser.findUnique({ where: { id } });
    done(null, user);
  })
);

/**
 * The authentication routes.
 */

const authRouter = express.Router();

// Oauth2 redirect
authRouter.get(
  "/user/oauth2/login/federated/google",
  passport.authenticate("google")
);

// Oauth2 callback
authRouter.get(
  "/user/oauth2/redirect/google",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/user/login",
  })
);

// Get /user/login
authRouter.get("/user/login", authGetLogin);

// Post /user/login
authRouter.post(
  "/user/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/user/login",
    failureFlash: true,
  })
);

authRouter.get("/user/signup", authGetSignup);
authRouter.post("/user/signup", authPostSignup);
authRouter.get("/user/logout", authGetLogout);

export default authRouter;
