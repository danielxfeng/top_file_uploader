import { Router } from "express";
import {
  appGetFiles,
  appGetNewFile,
  appPostNewFile,
  appPutFile,
  appDelFile,
  appGetSharedFile,
} from "../controllers/appController.mjs";

const appRouter = new Router();

appRouter.get("/files", appGetFiles);
appRouter.get("/files/new", appGetNewFile);
appRouter.post("/files/new", appPostNewFile);
appRouter.put("/files/:fileId", appPutFile);
appRouter.delete("/files/:fileId", appDelFile);
appRouter.get("/files/shared/:sharedId", appGetSharedFile);

export default appRouter;
