import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import { prisma } from "../app.mjs";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 }, // 10 KB
});

// GET /files
const appGetFiles = asyncHandler(async (req, res) => {
  const files = await prisma.driveFile.findMany({
    where: { userId: req.user.id },
    select: { id: true, name: true, sharedExpiry: true, sharedLink: true },
  });
  res.render("files", { title: "Files", files });
});

// GET /files/new
const appGetNewFile = asyncHandler(async (req, res) => {
  res.render("newFile", { title: "New File" });
});

// GET /files/:fileId
const appGetFile = asyncHandler(async (req, res) => {
  if (!req.params.fileId) {
    req.flash("error", "File not found");
    return res.redirect("/files");
  }
  const file = await prisma.driveFile.findUnique({
    where: { id: req.params.fileId },
    select: {
      id: true,
      name: true,
      link: true,
      sharedLink: true,
      sharedExpiry: true,
    },
  });
  if (!file) {
    req.flash("error", "File not found");
    return res.redirect("/files");
  }
  res.render("file", { title: file.name, file });
});

// POST /files/new
const appPostNewFile = [
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      req.flash("error", "File is required");
      return res.redirect("/files/new");
    }
    const { originalname, buffer } = req.file;
    await prisma.driveFile.create({
      data: {
        name: originalname,
        userId: req.user.id,
      },
    });
    res.redirect("/files");
  }),
];

const putFileValidation = [
  body("expiry_time")
    .custom((value, { req }) => {
      if (req.is_share && !value) {
        throw new Error("Expiry Time is required for shared files");
      }
      return true;
    })
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value, { req }) => {
      if (req.is_share && new Date(value) < new Date()) {
        throw new Error("Invalid Expiry Time: must be a future date");
      }
      return true;
    }),
];

// PUT /files/:fileId
const appPutFile = [
  putFileValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => req.flash("error", error.msg));
      return res.redirect(`/files/${req.params.fileId}`);
    }
    if (!req.params.fileId) {
      req.flash("error", "File not found");
      return res.redirect("/files");
    }
    let { is_share, expiry_time } = req.body;
    if (!is_share) expiry_time = null;
    await prisma.driveFile.updateMany({
      // Use updateMany here for supporting 2 where conditions.
      where: { id: req.params.fileId, userId: req.user.id },
      data: { sharedExpiry: expiry_time },
    });
    res.redirect("/files");
  }),
];

// DELETE /files/:fileId
const appDelFile = asyncHandler(async (req, res) => {
  if (!req.params.fileId) {
    req.flash("error", "File not found");
    return res.redirect("/files");
  }
  await prisma.driveFile.deleteMany({
    // Use deleteMany here for supporting 2 where conditions.
    where: { id: req.params.fileId, userId: req.user.id },
  });
  res.redirect("/files");
});

// GET /files/shared/:sharedId
const appGetSharedFile = asyncHandler(async (req, res) => {
  if (!req.params.sharedId) {
    req.flash("error", "File not found");
    return res.redirect("/");
  }
  const file = await prisma.driveFile.findFirst({
    where: {
      sharedLink: req.params.sharedId,
      sharedExpiry: { gt: new Date() },
    },
    select: {
      link: true,
    },
  });
  if (!file) {
    req.flash("error", "File not found or expired");
    return res.redirect("/");
  }
  res.redirect(file.link);
});

export {
  appGetFiles,
  appGetNewFile,
  appGetFile,
  appPostNewFile,
  appPutFile,
  appDelFile,
  appGetSharedFile,
};
