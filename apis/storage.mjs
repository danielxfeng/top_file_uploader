import { v2 as cloudinary } from "cloudinary";

/**
 * This module exports a function that returns an object with three methods:
 * - upload(buffer): Uploads a file to Cloudinary.
 * - get(publicId): Gets the URL of a file in Cloudinary.
 * - remove(publicId): Deletes a file from Cloudinary.
 */

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Uploads a file to Cloudinary
// Returns a Promise that resolves to the uploaded file's metadata.
const upload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
    stream.end(buffer);
  });
};

// Get the URL of a file in Cloudinary.
const get = (publicId) => {
  return cloudinary.url(publicId);
};

// Deletes a file from Cloudinary
const remove = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

export default { upload, get, remove };
