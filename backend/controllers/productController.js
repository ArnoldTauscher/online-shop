import Product from "../models/productModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";

// Hilfsfunktion: ANTWORTOBJEKT für Produkt
export function productResponse(product) {
  return {
    _id: product._id,
    name: product.name,
    image: product.image,
    brand: product.brand,
    quantity: product.quantity,
    category: product.category,
    description: product.description,
    reviews: product.reviews,
    rating: product.rating,
    numReviews: product.numReviews,
    price: product.price,
    countInStock: product.countInStock,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// Hilfsfunktion: PRÜFT, ob ein Produktname BEREITS existiert (optional: excludeProductId)
async function checkUniqueProductName(name, excludeProductId = null) {
  const query = { name };
  if (excludeProductId) query._id = { $ne: excludeProductId };
  const exists = await Product.findOne(query);
  if (exists)
    return { valid: false, message: "Produktname wird bereits verwendet." };
  return { valid: true };
}

// LOGIK - createProduct (für Tests)
export async function createProductHandler(req, res) {
  const {
    name,
    image,
    brand,
    quantity,
    category,
    description,
    price,
    countInStock,
  } = req.body;

  if (
    !name ||
    !image ||
    !brand ||
    !quantity ||
    !category ||
    !description ||
    price === undefined ||
    countInStock === undefined
  ) {
    return res
      .status(400)
      .json({ message: "Alle Pflichtfelder müssen ausgefüllt werden." });
  }

  // Prüfen, ob Name bereits existiert
  const unique = await checkUniqueProductName(name);
  if (!unique.valid) return res.status(400).json({ message: unique.message });

  const product = new Product({
    name,
    image,
    brand,
    quantity,
    category,
    description,
    price,
    countInStock,
  });
  await product.save();
  return res.status(201).json(productResponse(product));
}

// NEUES Produkt als ADMIN ANLEGEN
const createProduct = asyncHandler(createProductHandler);

// LOGIK - getProducts (für Tests)
export async function getProductsHandler(req, res) {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.page) || 1;

  // Suche nach Name (optional: auf weitere Felder ausweiten)
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: "i" } }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate("category");

  return res.status(200).json({
    products: products.map(productResponse),
    page,
    pages: Math.ceil(count / pageSize),
    hasMore: page < Math.ceil(count / pageSize),
    total: count,
  });
}

// ALLE Produkte ABRUFEN (mit Filtermöglichkeiten, Pagination etc.)
const getProducts = asyncHandler(getProductsHandler);

// LOGIK - getProductById (für Tests)
export async function getProductByIdHandler(req, res) {
  const product = await Product.findById(req.params.productId).populate(
    "category"
  );
  if (product) {
    return res.status(200).json(productResponse(product));
  } else {
    return res.status(404).json({ message: "Produkt nicht gefunden." });
  }
}

// BESTIMMTES Produkt ABRUFEN
const getProductById = asyncHandler(getProductByIdHandler);

// LOGIK - updateProductDetails (für Tests)
export async function updateProductDetailsHandler(req, res) {
  const product = await Product.findById(req.params.productId);
  if (!product)
    return res.status(404).json({ message: "Produkt nicht gefunden." });

  const {
    name,
    image,
    brand,
    quantity,
    category,
    description,
    price,
    countInStock,
  } = req.body;

  // Prüfen, ob Name bereits existiert (außer für sich selbst)
  if (name && name !== product.name) {
    const unique = await checkUniqueProductName(name, product._id);
    if (!unique.valid) return res.status(400).json({ message: unique.message });
    product.name = name;
  }

  if (image !== undefined) product.image = image;
  if (brand !== undefined) product.brand = brand;
  if (quantity !== undefined) product.quantity = quantity;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (countInStock !== undefined) product.countInStock = countInStock;

  const updatedProduct = await product.save();
  return res.status(200).json(productResponse(updatedProduct));
}

// BESTIMMTES Produkt als ADMIN AKTUALISIEREN
const updateProductDetails = asyncHandler(updateProductDetailsHandler);

// LOGIK - deleteProduct (für Tests)
export async function deleteProductHandler(req, res) {
  const product = await Product.findById(req.params.productId);
  if (!product)
    return res.status(404).json({ message: "Produkt nicht gefunden." });

  await Product.deleteOne({ _id: product._id });
  return res.status(200).json({ message: "Produkt entfernt." });
}

// BESTIMMTES Produkt als ADMIN LÖSCHEN
const deleteProduct = asyncHandler(deleteProductHandler);

// LOGIK - getAllProducts (für Tests)
export async function getAllProductsHandler(req, res) {
  const products = await Product.find({}).populate("category");
  return res.status(200).json(products.map(productResponse));
}

// ALLE Produkte (ohne Filter) ABRUFEN
const getAllProducts = asyncHandler(getAllProductsHandler);

// LOGIK - addProductReview (für Tests)
export async function addProductReviewHandler(req, res) {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.productId);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "Produkt wurde bereits bewertet." });
    }

    const review = {
      name: req.user.username,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    return res.status(201).json({ message: "Bewertung hinzugefügt." });
  } else {
    return res.status(404).json({ message: "Produkt nicht gefunden." });
  }
}

// Produkt-BEWERTUNG HINZUFÜGEN (nur für authentifizierte Nutzer)
const addProductReview = asyncHandler(addProductReviewHandler);

// LOGIK - getTopProducts (für Tests)
export async function getTopProductsHandler(req, res) {
  const products = await Product.find({})
    .sort({ rating: -1 })
    .limit(5)
    .populate("category");
  return res.status(200).json(products.map(productResponse));
}

// TOP-Produkte nach BEWERTUNG ABRUFEN
const getTopProducts = asyncHandler(getTopProductsHandler);

// LOGIK - getNewProducts (für Tests)
export async function getNewProductsHandler(req, res) {
  const products = await Product.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("category");
  return res.status(200).json(products.map(productResponse));
}

// NEUESTE Produkte ABRUFEN
const getNewProducts = asyncHandler(getNewProductsHandler);

// LOGIK - getProductsByNameAsc (für Tests)
export async function getProductsByNameAscHandler(req, res) {
  const products = await Product.find({})
    .sort({ name: 1 })
    .limit(10)
    .populate("category");
  return res.status(200).json(products.map(productResponse));
}

// Produkte nach NAME AUFSTEIGEND sortiert ABRUFEN (A-Z)
const getProductsByNameAsc = asyncHandler(getProductsByNameAscHandler);

// LOGIK - getProductsByNameDesc (für Tests)
export async function getProductsByNameDescHandler(req, res) {
  const products = await Product.find({})
    .sort({ name: -1 })
    .limit(10)
    .populate("category");
  return res.status(200).json(products.map(productResponse));
}

// Produkte nach NAME ABSTEIGEND sortiert ABRUFEN (Z-A)
const getProductsByNameDesc = asyncHandler(getProductsByNameDescHandler);

// LOGIK - getProductsByPriceAsc (für Tests)
export async function getProductsByPriceAscHandler(req, res) {
  const products = await Product.find({})
    .sort({ price: 1 })
    .limit(10)
    .populate("category");
  return res.status(200).json(products.map(productResponse));
}

// Produkte nach PREIS AUFSTEIGEND sortiert ABRUFEN (günstigste zuerst)
const getProductsByPriceAsc = asyncHandler(getProductsByPriceAscHandler);

// LOGIK - getProductsByPriceDesc (für Tests)
export async function getProductsByPriceDescHandler(req, res) {
  const products = await Product.find({})
    .sort({ price: -1 })
    .limit(10)
    .populate("category");
  return res.status(200).json(products.map(productResponse));
}

// Produkte nach PREIS ABSTEIGEND sortiert ABRUFEN (teuerste zuerst)
const getProductsByPriceDesc = asyncHandler(getProductsByPriceDescHandler);

// LOGIK - filterProducts (für Tests)
export async function filterProductsHandler(req, res) {
  const { category, minPrice, maxPrice } = req.body;
  let filter = {};
  if (category) filter.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  const products = await Product.find(filter).populate("category");
  return res.status(200).json(products.map(productResponse));
}

// Produkte nach FILTERKRITERIEN ABRUFEN (z.B. nach Kategorie, Preisbereich etc.)
const filterProducts = asyncHandler(filterProductsHandler);

export {
  getProducts,
  createProduct,
  getProductById,
  updateProductDetails,
  deleteProduct,
  getAllProducts,
  addProductReview,
  getTopProducts,
  getNewProducts,
  getProductsByNameAsc,
  getProductsByNameDesc,
  getProductsByPriceAsc,
  getProductsByPriceDesc,
  filterProducts,
};
