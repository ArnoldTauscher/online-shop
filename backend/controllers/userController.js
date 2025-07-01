import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import createToken from "../utils/createToken.js";
import { validateUserFields } from "../utils/validateUserFields.js";

// Hilfsfunktion: User-Objekt für die Antwort aufbereiten (ohne Passwort)
export function userResponse(user) {
  // Entfernt das Passwort aus dem User-Objekt
  const { password, ...rest } = user;
  return rest;
}

// Hilfsfunktion: Prüft, ob E-Mail oder Username bereits vergeben ist (optional: excludeUserId)
async function checkUniqueFields({ email, username }, excludeUserId = null) {
  if (email) {
    const emailExists = await User.findOne({
      email,
      _id: { $ne: excludeUserId },
    });
    if (emailExists)
      return { valid: false, message: "E-Mail wird bereits verwendet." };
  }
  if (username) {
    const usernameExists = await User.findOne({
      username,
      _id: { $ne: excludeUserId },
    });
    if (usernameExists)
      return { valid: false, message: "Benutzername wird bereits verwendet." };
  }

  return { valid: true };
}

// LOGIK - createUser (für Tests)
export async function createUserHandler(req, res) {
  const { username, email, password } = req.body;

  // Eingabefelder validieren
  const { valid, message } = validateUserFields({ username, email, password });
  if (!valid) return res.status(400).json({ message });

  // Prüfen, ob E-Mail oder Benutzername bereits existiert
  const unique = await checkUniqueFields({ email, username });
  if (!unique.valid) return res.status(400).json({ message: unique.message });

  const salt = await bcrypt.genSalt(16);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new User({ username, email, password: hashedPassword });

  try {
    await newUser.save();
    createToken(res, newUser._id);
    return res.status(201).json(userResponse(newUser));
  } catch (error) {
    return res.status(500).json({ message: "Ungültige Benutzerdaten." });
  }
}

// NEUEN Benutzer ANLEGEN
const createUser = asyncHandler(createUserHandler);

// LOGIK - loginUser (für Tests)
export async function loginUserHandler(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen." });
  }

  // Benutzer anhand der E-Mail suchen
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    // Passwort überprüfen
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (isPasswordValid) {
      createToken(res, existingUser._id);
      return res.status(200).json(userResponse(existingUser));
    }

    return res.status(401).json({ message: "Ungültige E-Mail oder Passwort." });
  }
}

// Benutzer ANMELDEN
const loginUser = asyncHandler(loginUserHandler);

// LOGIK - logoutCurrentUser (für Tests)
export async function logoutCurrentUserHandler(req, res) {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json({ message: "Erfolgreich ausgeloggt." });
}

// Benutzer ABMELDEN (JWT-Cookie löschen)
const logoutCurrentUser = asyncHandler(logoutCurrentUserHandler);

// LOGIK - getAllUsers (für Tests)
export async function getAllUsersHandler(req, res) {
  const users = await User.find({});
  return res.status(200).json(users.map(userResponse));
}

// ALLE Benutzer als ADMIN ABRUFEN
const getAllUsers = asyncHandler(getAllUsersHandler);

// LOGIK - getCurrentUserProfile (für Tests)
export async function getCurrentUserProfileHandler(req, res) {
  const currentUser = await User.findById(req.user._id);
  if (currentUser) {
    return res.status(200).json({
      _id: currentUser._id,
      username: currentUser.username,
      email: currentUser.email,
    });
  } else {
    return res.status(404).json({ message: "Benutzer nicht gefunden." });
  }
}

// EIGENEN Benutzerdaten ABRUFEN
const getCurrentUserProfile = asyncHandler(getCurrentUserProfileHandler);

// LOGIK - updateCurrentUserProfile (für Tests)
export async function updateCurrentUserProfileHandler(req, res) {
  const currentUser = await User.findById(req.user._id);
  if (!currentUser)
    return res.status(404).json({ message: "Benutzer nicht gefunden." });

  // Eingabefelder validieren (Passwort optional)
  const { valid, message } = validateUserFields(
    {
      username: req.body.username || currentUser.username,
      email: req.body.email || currentUser.email,
      password: req.body.password,
    },
    { checkPassword: !!req.body.password }
  );
  if (!valid) return res.status(400).json({ message });

  // Prüfen, ob E-Mail oder Benutzername bereits existiert (außer für sich selbst)
  const unique = await checkUniqueFields(
    {
      email: req.body.email !== currentUser.email ? req.body.email : undefined,
      username:
        req.body.username !== currentUser.username
          ? req.body.username
          : undefined,
    },
    currentUser._id
  );
  if (!unique.valid) return res.status(400).json({ message: unique.message });

  currentUser.username = req.body.username || currentUser.username;
  currentUser.email = req.body.email || currentUser.email;

  if (req.body.password) {
    const salt = await bcrypt.genSalt(16);
    currentUser.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await currentUser.save();
  return res.status(200).json(userResponse(updatedUser));
}

// EIGENEN Benutzerdaten AKTUALISIEREN
const updateCurrentUserProfile = asyncHandler(updateCurrentUserProfileHandler);

// LOGIK - getUserById (für Tests)
export async function getUserByIdHandler(req, res) {
  const user = await User.findById(req.params.userId).select("-password");
  if (user) {
    return res.status(200).json(user);
  } else {
    return res.status(404).json({ message: "Benutzer nicht gefunden." });
  }
}

// Einen BESTIMMTEN Benutzer als ADMIN ABRUFEN
const getUserById = asyncHandler();

// LOGIK - updateUserById (für Tests)
export async function updateUserByIdHandler(req, res) {
  const user = await User.findById(req.params.userId);
  if (!user)
    return res.status(404).json({ message: "Benutzer nicht gefunden." });

  // Eingabefelder validieren (Passwort optional)
  const { valid, message } = validateUserFields(
    {
      username: req.body.username || user.username,
      email: req.body.email || user.email,
      password: req.body.password,
    },
    { checkPassword: !!req.body.password }
  );
  if (!valid) return res.status(400).json({ message });

  // Prüfen, ob E-Mail oder Benutzername bereits existiert (außer für sich selbst)
  const unique = await checkUniqueFields(
    {
      email: req.body.email !== user.email ? req.body.email : undefined,
      username:
        req.body.username !== user.username ? req.body.username : undefined,
    },
    user._id
  );
  if (!unique.valid) return res.status(400).json({ message: unique.message });

  user.username = req.body.username || user.username;
  user.email = req.body.email || user.email;

  if (req.body.password) {
    const salt = await bcrypt.genSalt(16);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await user.save();
  return res.status(200).json(userResponse(updatedUser));
}

// Einen BESTIMMTEN Benutzer als ADMIN AKTUALISIEREN
const updateUserById = asyncHandler(updateUserByIdHandler);

// LOGIK - deleteUserById (für Tests)
export async function deleteUserByIdHandler(req, res) {
  const user = await User.findById(req.params.userId);
  if (user) {
    if (user.isAdmin) {
      return res
        .status(400)
        .json({ message: "Admin-Benutzer kann nicht gelöscht werden." });
    }

    await User.deleteOne({ _id: user._id });
    return res.status(200).json({ message: "Benutzer entfernt." });
  } else {
    return res.status(404).json({ message: "Benutzer nicht gefunden." });
  }
}

// Einen BESTIMMTEN Benutzer als ADMIN LÖSCHEN
const deleteUserById = asyncHandler(deleteUserByIdHandler);

export {
  createUser,
  loginUser,
  logoutCurrentUser,
  getAllUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getUserById,
  updateUserById,
  deleteUserById,
};
