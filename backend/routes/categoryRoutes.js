import express from "express";
import { authenticate, authoriseAdmin } from "../middlewares/authMiddleware.js";
import {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// ALLE Kategorien ABRUFEN
router.route("/categories").get(getAllCategories);

// NEUE Kategorie als ADMIN ANLEGEN
router.route("/").post(authenticate, authoriseAdmin, createCategory);

router
  .route("/:categoryId")
  // BESTIMMTE Kategorie ABRUFEN
  .get(getCategoryById)
  // BESTIMMTE Kategorie als ADMIN AKTUALISIEREN
  .put(authenticate, authoriseAdmin, updateCategory)
  // BESTIMMTE Kategorie als ADMIN LÖSCHEN
  .delete(authenticate, authoriseAdmin, deleteCategory);

export default router;
