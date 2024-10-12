import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import { v4 } from "uuid";
import { prisma } from "../app.mjs";
import multer from "multer";
import cloudinary from "../apis/storage.mjs";

// Multer configuration for save file in memory.
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
  }
};
const upload = multer({
  storage,
  limits: { fileSize: 102 * 1024 * 1 }, // 100 KB
  fileFilter: fileFilter,
});

// GET /files
const appGetFiles = asyncHandler(async (req, res) => {
  const files = await prisma.driveFile.findMany({
    where: { userId: req.user.id },
    select: {
      id: true,
      name: true,
      fileLink: true,
      sharedExpiry: true,
      sharedLink: true,
    },
  });
  files.forEach((file) => {
    file.fileLink = cloudinary.get(file.fileLink);
  });
  res.render("files", { title: "Files", files });
});

// GET /files/new
const appGetNewFile = asyncHandler(async (req, res) => {
  res.render("upload", { title: "New File" });
});

// GET /files/:fileId
const appGetFile = asyncHandler(async (req, res) => {
  if (!req.params.fileId) {
    req.flash("error", "File not found");
    return res.redirect("/files");
  }
  const fileId = parseInt(req.params.fileId);
  if (isNaN(fileId)) {
    req.flash("error", "Invalid File ID");
    return res.redirect("/files");
  }

  const file = await prisma.driveFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      name: true,
      fileLink: true,
      sharedLink: true,
      sharedExpiry: true,
    },
  });
  if (!file) {
    req.flash("error", "File not found");
    return res.redirect("/files");
  }
  file.fileLink = cloudinary.get(file.fileLink);
  res.render("file", { title: "Manage a file", file });
});

// POST /files/new
const appPostNewFile = [
  // Middleware to handle file upload
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/files/new");
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      req.flash("error", "File is required");
      return res.redirect("/files/new");
    }
    const { originalname, buffer } = req.file;

    const uploaded = await cloudinary.upload(buffer);
    await prisma.driveFile.create({
      data: {
        name: originalname,
        userId: req.user.id,
        fileLink: uploaded.public_id, // We store the public_id to fileLink.
      },
    });
    res.redirect("/files");
  }),
];

const putFileValidation = [
  body("expiry_time")
    .trim()
    .custom((value, { req }) => {
      if (req.body.is_share !== "true") return true;
      if (!value) throw new Error("Expiry Time is required for shared files");
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
        throw new Error("Invalid date format");
      if (new Date(value) < new Date())
        throw new Error("Invalid Expiry Time: must be a future date");
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
    const fileId = parseInt(req.params.fileId);
    if (isNaN(fileId)) {
      req.flash("error", "Invalid File ID");
      return res.redirect("/files");
    }
    let { is_share, expiry_time } = req.body;
    let sharedLink = null;
    if (is_share === "true") {
      const file = await prisma.driveFile.findFirst({
        where: { id: fileId, userId: req.user.id },
        select: { sharedLink: true },
      });
      sharedLink = file.sharedLink ? file.sharedLink : v4();
      expiry_time = new Date(expiry_time);
    } else expiry_time = null;
    await prisma.driveFile.updateMany({
      // Use updateMany here for supporting 2 where conditions.
      where: { id: fileId, userId: req.user.id },
      data: { sharedLink, sharedExpiry: expiry_time },
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
  const fileId = parseInt(req.params.fileId);
  if (isNaN(fileId)) {
    req.flash("error", "Invalid File ID");
    return res.redirect("/files");
  }
  const link = await prisma.driveFile.findFirst({
    where: { id: fileId, userId: req.user.id },
    select: { fileLink: true }, // We store the public_id to fileLink.
  });

  if (!link) {
    req.flash("error", "File not found");
    return res.redirect("/files");
  }

  await cloudinary.remove(link.fileLink);
  await prisma.driveFile.delete({ where: { id: fileId } });
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
      fileLink: true,
    },
  });
  if (!file) {
    req.flash("error", "File not found or expired");
    return res.redirect("/");
  }
  res.redirect(cloudinary.get(file.fileLink));
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
