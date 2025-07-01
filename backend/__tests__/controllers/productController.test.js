import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  createProductHandler,
  getProductByIdHandler,
  getProductsHandler,
  updateProductDetailsHandler,
  deleteProductHandler,
  getAllProductsHandler,
  addProductReviewHandler,
  getTopProductsHandler,
  getNewProductsHandler,
  getProductsByNameAscHandler,
  getProductsByNameDescHandler,
  getProductsByPriceAscHandler,
  getProductsByPriceDescHandler,
  filterProductsHandler,
  productResponse,
} from "../../controllers/productController.js";
import Product from "../../models/productModel.js";

vi.mock("../../models/productModel.js");

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("createProduct", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 400 zurückgeben, wenn die Validierung der Productdaten fehlschlägt", async () => {
    req.body = {
      name: "",
      image: "",
      brand: "",
      quantity: "",
      category: "",
      description: "",
      price: "",
      countInStock: "",
    };
    await createProductHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Alle Pflichtfelder müssen ausgefüllt werden.",
    });
  });

  test("sollte 400 zurückgeben, wenn der Produktname bereits existiert", async () => {
    req.body = {
      name: "Test",
      image: "img.jpg",
      brand: "Brand",
      quantity: 1,
      category: "Cat",
      description: "desc",
      price: 10,
      countInStock: 5,
    };
    Product.findOne.mockResolvedValue({ _id: "1", name: "Test" });
    await createProductHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produktname wird bereits verwendet.",
    });
  });

  test("sollte Product erstellen und 201 zurückgeben, wenn Name eindeutig ist", async () => {
    req.body = {
      name: "Test",
      image: "img.jpg",
      brand: "Brand",
      quantity: 1,
      category: "Cat",
      description: "desc",
      price: 10,
      countInStock: 5,
    };
    Product.findOne.mockResolvedValue(null);
    const saveMock = vi.fn().mockResolvedValue({
      _id: "123",
      ...req.body,
      reviews: [],
      rating: 0,
      numReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    Product.mockImplementation(function (data) {
      return {
        ...data,
        reviews: [],
        rating: 0,
        numReviews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: saveMock,
      };
    });
    await createProductHandler(req, res);
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test",
        brand: "Brand",
        price: 10,
        countInStock: 5,
      })
    );
  });
});

describe("getProducts", () => {
  let req, res;

  beforeEach(() => {
    req = { query: {} };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte Produkte mit Pagination und Keyword zurückgeben", async () => {
    req.query = { page: "1", pageSize: "2", keyword: "Test" };
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 0,
        numReviews: 0,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 0,
        numReviews: 0,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.countDocuments.mockResolvedValue(2);
    Product.find.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });

    await getProductsHandler(req, res);

    expect(Product.countDocuments).toHaveBeenCalledWith({
      name: { $regex: "Test", $options: "i" },
    });
    expect(Product.find).toHaveBeenCalledWith({
      name: { $regex: "Test", $options: "i" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      products: products.map(productResponse),
      page: 1,
      pages: 1,
      hasMore: false,
      total: 2,
    });
  });

  test("sollte Produkte ohne Keyword und Pagination zurückgeben", async () => {
    req.query = {};
    const products = [
      {
        _id: "1",
        name: "Produkt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 0,
        numReviews: 0,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Produkt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 0,
        numReviews: 0,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.countDocuments.mockResolvedValue(2);
    Product.find.mockReturnValue({
      limit: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });

    await getProductsHandler(req, res);

    expect(Product.countDocuments).toHaveBeenCalledWith({});
    expect(Product.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      products: products.map(productResponse),
      page: 1,
      pages: 1,
      hasMore: false,
      total: 2,
    });
  });
});

describe("getProductById", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { productId: "123" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Product nicht gefunden wurde", async () => {
    Product.findById.mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });
    await getProductByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produkt nicht gefunden.",
    });
  });

  test("sollte 200 und die Produkt zurückgeben, wenn gefunden", async () => {
    Product.findById.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: "123",
        name: "Test",
        description: "desc",
      }),
    });
    await getProductByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      productResponse({
        _id: "123",
        name: "Test",
        description: "desc",
      })
    );
  });
});

describe("updateProductDetails", () => {
  let req, res, saveMock;

  beforeEach(() => {
    req = { params: { productId: "1" }, body: {} };
    res = mockRes();
    saveMock = vi.fn();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Produkt nicht gefunden wurde", async () => {
    Product.findById.mockResolvedValue(null);
    await updateProductDetailsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produkt nicht gefunden.",
    });
  });

  test("sollte 400 zurückgeben, wenn neuer Name nicht eindeutig ist", async () => {
    req.body = { name: "NichtEindeutig" };
    const product = {
      _id: "1",
      name: "Alt",
      save: saveMock,
    };
    Product.findById.mockResolvedValue(product);
    Product.findOne.mockResolvedValue({ _id: "2", name: "NichtEindeutig" });

    await updateProductDetailsHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produktname wird bereits verwendet.",
    });
    expect(saveMock).not.toHaveBeenCalled();
  });

  test("sollte Produkt unverändert speichern, wenn keine Felder übergeben werden", async () => {
    req.body = {};
    const originalProduct = {
      _id: "1",
      name: "Alt",
      image: "old.jpg",
      brand: "OldBrand",
      quantity: 1,
      category: "OldCat",
      description: "old desc",
      price: 10,
      countInStock: 1,
      reviews: [],
      rating: 0,
      numReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: saveMock, // <--- nur das Mock-Objekt
    };
    saveMock.mockResolvedValue(originalProduct); // <--- hier das Verhalten setzen
    Product.findById.mockResolvedValue(originalProduct);
    Product.findOne.mockResolvedValue(null);

    await updateProductDetailsHandler(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productResponse(originalProduct));
  });

  test("sollte Produktdaten aktualisieren, wenn Name eindeutig ist", async () => {
    req.body = {
      name: "Neu",
      image: "img.jpg",
      brand: "Brand",
      quantity: 2,
      category: "Cat",
      description: "desc",
      price: 99,
      countInStock: 10,
    };
    const updated = {
      _id: "1",
      ...req.body,
      reviews: [],
      rating: 0,
      numReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const product = {
      _id: "1",
      name: "Alt",
      image: "old.jpg",
      brand: "OldBrand",
      quantity: 1,
      category: "OldCat",
      description: "old desc",
      price: 10,
      countInStock: 1,
      reviews: [],
      rating: 0,
      numReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: saveMock.mockResolvedValue(updated),
    };
    Product.findById.mockResolvedValue(product);
    Product.findOne.mockResolvedValue(null);

    await updateProductDetailsHandler(req, res);

    expect(product.name).toBe("Neu");
    expect(product.image).toBe("img.jpg");
    expect(product.brand).toBe("Brand");
    expect(product.quantity).toBe(2);
    expect(product.category).toBe("Cat");
    expect(product.description).toBe("desc");
    expect(product.price).toBe(99);
    expect(product.countInStock).toBe(10);
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(productResponse(updated));
  });
});

describe("deleteProduct", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { categoryId: "1" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Produkt nicht gefunden wurde", async () => {
    Product.findById.mockResolvedValue(null);
    await deleteProductHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produkt nicht gefunden.",
    });
  });

  test("sollte Produkt löschen und 200 zurückgeben, wenn gefunden", async () => {
    Product.findById.mockResolvedValue({ _id: "1" });
    Product.deleteOne.mockResolvedValue({});
    await deleteProductHandler(req, res);
    expect(Product.deleteOne).toHaveBeenCalledWith({ _id: "1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Produkt entfernt." });
  });
});

describe("getAllProducts", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und alle Produkte zurückgeben", async () => {
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 0,
        numReviews: 0,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 0,
        numReviews: 0,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue(products),
    });
    await getAllProductsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });
});

describe("addProductReview", () => {
  let req, res, product, saveMock;

  beforeEach(() => {
    req = {
      params: { productId: "1" },
      body: { rating: 5, comment: "Super!" },
      user: { _id: "u1", username: "tester" },
    };
    res = mockRes();
    saveMock = vi.fn();
    product = {
      _id: "1",
      reviews: [],
      numReviews: 0,
      rating: 0,
      save: saveMock,
    };
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Produkt nicht gefunden wurde", async () => {
    Product.findById.mockResolvedValue(null);
    await addProductReviewHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produkt nicht gefunden.",
    });
  });

  test("sollte 400 zurückgeben, wenn Produkt bereits bewertet wurde", async () => {
    product.reviews = [{ user: "u1" }];
    Product.findById.mockResolvedValue(product);
    await addProductReviewHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produkt wurde bereits bewertet.",
    });
  });

  test("sollte Bewertung hinzufügen und 201 zurückgeben", async () => {
    Product.findById.mockResolvedValue(product);
    saveMock.mockResolvedValue(product);
    await addProductReviewHandler(req, res);
    expect(product.reviews.length).toBe(1);
    expect(product.reviews[0]).toMatchObject({
      name: "tester",
      rating: 5,
      comment: "Super!",
      user: "u1",
    });
    expect(product.numReviews).toBe(1);
    expect(product.rating).toBe(5);
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Bewertung hinzugefügt.",
    });
  });

  test("sollte das durchschnittliche Rating korrekt berechnen, wenn mehrere Bewertungen existieren", async () => {
    // Produkt hat bereits eine Bewertung mit 4 Sternen
    product.reviews = [
      { user: "u2", name: "user2", rating: 4, comment: "Gut!" },
    ];
    product.numReviews = 1;
    product.rating = 4;

    // saveMock gibt das aktualisierte Produkt zurück
    saveMock.mockImplementation(function () {
      return Promise.resolve(product);
    });

    Product.findById.mockResolvedValue(product);

    // Neue Bewertung mit 2 Sternen von anderem User
    req.user = { _id: "u1", username: "tester" };
    req.body = { rating: 2, comment: "Geht so" };

    await addProductReviewHandler(req, res);

    expect(product.reviews.length).toBe(2);
    expect(product.reviews[1]).toMatchObject({
      name: "tester",
      rating: 2,
      comment: "Geht so",
      user: "u1",
    });
    expect(product.numReviews).toBe(2);
    // Durchschnitt: (4 + 2) / 2 = 3
    expect(product.rating).toBe(3);
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Bewertung hinzugefügt.",
    });
  });
});

describe("getTopProducts", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte ein leeres Array zurückgeben, wenn keine Top-Produkte gefunden werden", async () => {
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    await getTopProductsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sollte 200 und alle Produkten nach Bewertung zurückgeben", async () => {
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 5,
        numReviews: 1,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 4,
        numReviews: 2,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });
    await getTopProductsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });
});

describe("getNewProducts", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte ein leeres Array zurückgeben, wenn keine Neu-Produkte gefunden werden", async () => {
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    await getNewProductsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sollte 200 und neueste Produkte zurückgeben", async () => {
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 5,
        numReviews: 1,
        price: 10,
        countInStock: 5,
        createdAt: "2025-06-07T18:22:43.720Z",
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 4,
        numReviews: 2,
        price: 20,
        countInStock: 10,
        createdAt: "2025-06-10T15:53:52.158Z",
        updatedAt: new Date(),
      },
    ];
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });
    await getNewProductsHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });
});

describe("getProductsByNameAsc", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte ein leeres Array zurückgeben, wenn kein Produkt das Kriterium erfüllt", async () => {
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    await getProductsByNameAscHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sollte 200 und Produkte nach Name aufsteigend sortiert zurückgeben", async () => {
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 5,
        numReviews: 1,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 4,
        numReviews: 2,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });
    await getProductsByNameAscHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });
});

describe("getProductsByNameDesc", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte ein leeres Array zurückgeben, wenn kein Produkt das Kriterium erfüllt", async () => {
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    await getProductsByNameAscHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sollte 200 und Produkte nach Name absteigend sortiert zurückgeben", async () => {
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 5,
        numReviews: 1,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 4,
        numReviews: 2,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });
    await getProductsByNameDescHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });
});

describe("getProductsByPriceAsc", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte ein leeres Array zurückgeben, wenn kein Produkt das Kriterium erfüllt", async () => {
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    await getProductsByNameAscHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sollte 200 und Produkte nach Preis aufsteigend sortiert zurückgeben", async () => {
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 5,
        numReviews: 1,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 4,
        numReviews: 2,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });
    await getProductsByPriceAscHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });
});

describe("getProductsByPriceDesc", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte ein leeres Array zurückgeben, wenn kein Produkt das Kriterium erfüllt", async () => {
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue([]),
    });
    await getProductsByNameAscHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sollte 200 und Produkte nach Preis absteigend sortiert zurückgeben", async () => {
    const products = [
      {
        _id: "1",
        name: "Testprodukt 1",
        image: "img1.jpg",
        brand: "Brand1",
        quantity: 1,
        category: "Cat1",
        description: "desc1",
        reviews: [],
        rating: 5,
        numReviews: 1,
        price: 10,
        countInStock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        name: "Testprodukt 2",
        image: "img2.jpg",
        brand: "Brand2",
        quantity: 2,
        category: "Cat2",
        description: "desc2",
        reviews: [],
        rating: 4,
        numReviews: 2,
        price: 20,
        countInStock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    Product.find.mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockResolvedValue(products),
    });
    await getProductsByPriceDescHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });
});

describe("filterProducts", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte alle Produkte ohne Filter zurückgeben", async () => {
    const products = [
      { _id: "1", name: "A" },
      { _id: "2", name: "B" },
    ];
    Product.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue(products),
    });
    await filterProductsHandler(req, res);
    expect(Product.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });

  test("sollte Produkte nach Kategorie filtern", async () => {
    req.body = { category: "cat1" };
    const products = [{ _id: "1", name: "A", category: "cat1" }];
    Product.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue(products),
    });
    await filterProductsHandler(req, res);
    expect(Product.find).toHaveBeenCalledWith({ category: "cat1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });

  test("sollte Produkte nach Preisbereich filtern", async () => {
    req.body = { minPrice: 10, maxPrice: 50 };
    const products = [{ _id: "1", name: "A", price: 20 }];
    Product.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue(products),
    });
    await filterProductsHandler(req, res);
    expect(Product.find).toHaveBeenCalledWith({
      price: { $gte: 10, $lte: 50 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });

  test("sollte Produkte nach Kategorie und Preisbereich filtern", async () => {
    req.body = { category: "cat1", minPrice: 10, maxPrice: 50 };
    const products = [{ _id: "1", name: "A", category: "cat1", price: 20 }];
    Product.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue(products),
    });
    await filterProductsHandler(req, res);
    expect(Product.find).toHaveBeenCalledWith({
      category: "cat1",
      price: { $gte: 10, $lte: 50 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products.map(productResponse));
  });

  test("sollte ein leeres Array zurückgeben, wenn keine Produkte gefunden werden", async () => {
    Product.find.mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });
    await filterProductsHandler(req, res);
    expect(Product.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});
