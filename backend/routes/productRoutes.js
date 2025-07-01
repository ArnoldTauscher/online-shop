import express from "express";

import { authenticate, authoriseAdmin } from "../middlewares/authMiddleware.js";
import checkId from "../middlewares/checkId.js";
import parseForm from "../middlewares/parseForm.js";
import {
  getProducts,
  createProduct,
  getAllProducts,
  addProductReview,
  getTopProducts,
  getNewProducts,
  getProductById,
  updateProductDetails,
  deleteProduct,
  getProductsByNameAsc,
  getProductsByNameDesc,
  getProductsByPriceAsc,
  getProductsByPriceDesc,
  filterProducts,
} from "../controllers/productController.js";

const router = express.Router();

router
  .route("/")
  // ALLE Produkte ABRUFEN (mit Filtermöglichkeiten)
  .get(getProducts)
  // NEUES Produkt als ADMIN ANLEGEN (mit Formular-Parsing)
  .post(authenticate, authoriseAdmin, parseForm, createProduct);

// ALLE Produkte (ohne Filter) ABRUFEN
router.route("/allproducts").get(getAllProducts);

// Produkt-BEWERTUNG HINZUFÜGEN (nur für authentifizierte Nutzer)
router
  .route("/:productId/reviews")
  .post(authenticate, checkId, addProductReview);

// TOP-Produkte nach BEWERTUNG ABRUFEN
router.route("/top").get(getTopProducts);
// NEUESTE Produkte ABRUFEN
router.route("/new").get(getNewProducts);
// Produkte nach NAME AUFSTEIGEND sortiert ABRUFEN (A-Z)
router.route("/name-asc").get(getProductsByNameAsc);
// Produkte nach NAME ABSTEIGEND sortiert ABRUFEN (Z-A)
router.route("/name-desc").get(getProductsByNameDesc);
// Produkte nach PREIS AUFSTEIGEND sortiert ABRUFEN (günstigste zuerst)
router.route("/price-asc").get(getProductsByPriceAsc);
// Produkte nach PREIS ABSTEIGEND sortiert ABRUFEN (teuerste zuerst)
router.route("/price-desc").get(getProductsByPriceDesc);

router
  .route("/:productId")
  // BESTIMMTES Produkt ABRUFEN
  .get(checkId, getProductById)
  // BESTIMMTES Produkt als ADMIN AKTUALISIEREN (mit Formular-Parsing)
  .put(authenticate, authoriseAdmin, parseForm, checkId, updateProductDetails)
  // BESTIMMTES Produkt als ADMIN LÖSCHEN
  .delete(authenticate, authoriseAdmin, checkId, deleteProduct);

// Produkte nach FILTERKRITERIEN ABRUFEN
router.route("/filtered-products").post(filterProducts);

export default router;
