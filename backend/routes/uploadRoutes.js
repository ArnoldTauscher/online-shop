import path from "path";
import express from "express";
import multer from "multer";
import { authenticate, authoriseAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  // we are using our disk storage
  destination: (req, file, cb) => {
    // cb: call back
    cb(null, "uploads/"); // a null helyett lehetne error: Error is
  },

  filename: (req, file, cb) => {
    const extname = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${extname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

  const extname = path.extname(file.originalname).toLowerCase(); // .extname(): NodeJS-method
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && mimetypes.test(mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Images only"), false);
  }
};

const upload = multer({ storage, fileFilter });
const uploadSingleImage = upload.single("image");

router.post("/", authenticate, authoriseAdmin, (req, res) => {
  uploadSingleImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    } else if (req.file) {
      return res.status(200).json({
        message: "Image uploaded successfully",
        image: `/${req.file.path}`,
      });
    } else {
      return res.status(400).send({ message: "No image file provided" });
    }
  });
});

export default router;
