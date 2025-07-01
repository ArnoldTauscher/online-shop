import express from "express";

import { authenticate, authoriseAdmin } from "../middlewares/authMiddleware.js";
import checkId from "../middlewares/checkId.js";
import {
  createUser,
  loginUser,
  logoutCurrentUser,
  getAllUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../controllers/userController.js";

const router = express.Router();

router
  .route("/")
  // NEUEN Benutzer ANLEGEN
  .post(createUser)
  // ALLE Benutzer als ADMIN ABRUFEN
  .get(authenticate, authoriseAdmin, getAllUsers);

// Benutzer ANMELDEN
router.post("/auth", loginUser);
// Benutzer ABMELDEN
router.post("/logout", logoutCurrentUser);

router
  .route("/profile")
  // EIGENEN Benutzerdaten ABRUFEN
  .get(authenticate, getCurrentUserProfile)
  // und diese Benutzerdaten AKTUALISIEREN
  .put(authenticate, updateCurrentUserProfile);

router
  .route("/:userId")
  // Einen BESTIMMTEN Benutzer als ADMIN ABRUFEN
  .get(authenticate, authoriseAdmin, checkId, getUserById)
  // Einen BESTIMMTEN Benutzer als ADMIN AKTUALISIEREN
  .put(authenticate, authoriseAdmin, checkId, updateUserById)
  // Einen BESTIMMTEN Benutzer als ADMIN LÖSCHEN
  .delete(authenticate, authoriseAdmin, checkId, deleteUserById);

export default router;
