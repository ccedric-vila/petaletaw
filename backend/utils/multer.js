const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Correct: create "images" folder inside current folder (__dirname points to backend/)
const uploadDir = path.join(__dirname, '..', '..', 'frontend', 'images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);  // save inside backend/images
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        cb(null, baseName + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Error: Only JPEG, JPG, and PNG images are allowed!'), false);
    }
};

module.exports = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB per file
    },
    fileFilter: fileFilter
});
