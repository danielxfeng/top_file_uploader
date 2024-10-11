import { Router } from "express";
import {
  appGetFiles,
  appGetNewFile,
  appPostNewFile,
  appGetFile,
  appPutFile,
  appDelFile,
  appGetSharedFile,
} from "../controllers/appController.mjs";

const appRouter = new Router();

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash("error", "You must be logged in to view files");
  return res.redirect("/user/login");
};

appRouter.get("/files", isAuthenticated, appGetFiles);
appRouter.get("/files/new", isAuthenticated, appGetNewFile);
appRouter.post("/files/new", isAuthenticated, appPostNewFile);
appRouter.get("/files/:fileId", isAuthenticated, appGetFile);
appRouter.put("/files/:fileId", isAuthenticated, appPutFile);
appRouter.delete("/files/:fileId", isAuthenticated, appDelFile);
appRouter.get("/files/shared/:sharedId", appGetSharedFile);

export default appRouter;
