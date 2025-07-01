import Category from "../models/categoryModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Hilfsfunktion: ANTWORTOBJEKT für Kategorie
export function categoryResponse(category) {
  return {
    _id: category._id,
    name: category.name,
    description: category.description,
  };
}

// Hilfsfunktion: PRÜFT, ob ein Kategoriename bereits EXISTIERT (optional: excludeCategoryId)
async function checkUniqueCategoryName(name, excludeCategoryId = null) {
  const query = { name };
  if (excludeCategoryId) query._id = { $ne: excludeCategoryId };
  const exists = await Category.findOne(query);
  if (exists)
    return { valid: false, message: "Kategoriename wird bereits verwendet." };
  return { valid: true };
}

// LOGIK - createCategory (für Tests)
export async function createCategoryHandler(req, res) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name ist erforderlich." });
  }

  const unique = await checkUniqueCategoryName(name);
  if (!unique.valid) return res.status(400).json({ message: unique.message });

  const category = new Category({ name, description });
  const savedCategory = await category.save();
  return res.status(201).json(categoryResponse(savedCategory));
}

// NEUE Kategorie als ADMIN ANLEGEN
const createCategory = asyncHandler(createCategoryHandler);

// LOGIK - getAllCategories (für Tests)
export async function getAllCategoriesHandler(req, res) {
  const categories = await Category.find({});
  return res.status(200).json(categories.map(categoryResponse));
}

// ALLE Kategorien ABRUFEN
const getAllCategories = asyncHandler(getAllCategoriesHandler);

// LOGIK - getCategoryById (für Tests)
export async function getCategoryByIdHandler(req, res) {
  const category = await Category.findById(req.params.categoryId);
  if (category) {
    return res.status(200).json(categoryResponse(category));
  } else {
    return res.status(404).json({ message: "Kategorie nicht gefunden." });
  }
}

// BESTIMMTE Kategorie ABRUFEN
const getCategoryById = asyncHandler(getCategoryByIdHandler);

// LOGIK - updateCategory (für Tests)
export async function updateCategoryHandler(req, res) {
  const category = await Category.findById(req.params.categoryId);
  if (!category)
    return res.status(404).json({ message: "Kategorie nicht gefunden." });

  const { name, description } = req.body;

  // Prüfen, ob Name bereits existiert (außer für sich selbst)
  if (name && name !== category.name) {
    const unique = await checkUniqueCategoryName(name, category._id);
    if (!unique.valid) return res.status(400).json({ message: unique.message });
    category.name = name;
  }

  if (description !== undefined) category.description = description;

  const updatedCategory = await category.save();
  return res.status(200).json(categoryResponse(updatedCategory));
}

// BESTIMMTE Kategorie als ADMIN AKTUALISIEREN
const updateCategory = asyncHandler(updateCategoryHandler);

// LOGIK - deleteCategory (für Tests)
export async function deleteCategoryHandler(req, res) {
  const category = await Category.findById(req.params.categoryId);
  if (!category)
    return res.status(404).json({ message: "Kategorie nicht gefunden." });

  await Category.deleteOne({ _id: category._id });
  return res.status(200).json({ message: "Kategorie entfernt." });
}

// BESTIMMTE Kategorie als ADMIN LÖSCHEN
const deleteCategory = asyncHandler(deleteCategoryHandler);

export {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
