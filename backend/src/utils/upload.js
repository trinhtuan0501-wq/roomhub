const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('cloud')
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file hình ảnh (jpeg, jpg, png, webp, gif)'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Helper function to upload to Cloudinary (or return local path if Cloudinary is not configured)
const uploadToCloudinary = async (file) => {
  try {
    const isCloudConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      !process.env.CLOUDINARY_CLOUD_NAME.includes('cloud') &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudConfigured) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'roomhub',
      });
      // Optionally delete local file after uploading to Cloud
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete local temporary file:', err.message);
      }
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } else {
      // Local fallback url path
      const relativePath = `/uploads/${path.basename(file.path)}`;
      return {
        url: relativePath,
        publicId: `local_${path.basename(file.path)}`,
      };
    }
  } catch (error) {
    console.error('Cloudinary Upload Error, falling back to local file URL:', error.message);
    const relativePath = `/uploads/${path.basename(file.path)}`;
    return {
      url: relativePath,
      publicId: `local_${path.basename(file.path)}`,
    };
  }
};

// Helper function to delete image
const deleteImage = async (publicId) => {
  try {
    if (publicId && publicId.startsWith('local_')) {
      const filename = publicId.replace('local_', '');
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { result: 'ok' };
    } else if (publicId) {
      return await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image:', error.message);
    return null;
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteImage,
};
