import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  createCategoryHandler,
  getAllCategoriesHandler,
  getCategoryByIdHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  categoryResponse,
} from "../../controllers/categoryController.js";
import Category from "../../models/categoryModel.js";

vi.mock("../../models/categoryModel.js");

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("createCategory", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 400 zurückgeben, wenn kein Name angegeben ist", async () => {
    req.body = { description: "desc" };
    await createCategoryHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Name ist erforderlich.",
    });
  });

  test("sollte 400 zurückgeben, wenn der Kategoriename bereits existiert", async () => {
    req.body = { name: "Test", description: "desc" };
    Category.findOne.mockResolvedValue({ _id: "1", name: "Test" });
    await createCategoryHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Kategoriename wird bereits verwendet.",
    });
  });

  test("sollte Kategorie erstellen und 201 zurückgeben, wenn Name eindeutig ist", async () => {
    req.body = { name: "Neu", description: "desc" };
    Category.findOne.mockResolvedValue(null);
    const saved = {
      _id: "123",
      name: "Neu",
      description: "desc",
    };
    const saveMock = vi.fn().mockResolvedValue(saved);
    Category.mockImplementation(function (data) {
      return { ...data, save: saveMock };
    });
    await createCategoryHandler(req, res);
    expect(Category).toHaveBeenCalledWith({ name: "Neu", description: "desc" });
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(categoryResponse(saved));
  });

  test("sollte Kategorie auch ohne Beschreibung erstellen", async () => {
    req.body = { name: "OhneDesc" };
    Category.findOne.mockResolvedValue(null);
    const saved = {
      _id: "456",
      name: "OhneDesc",
      description: undefined,
    };
    const saveMock = vi.fn().mockResolvedValue(saved);
    Category.mockImplementation(function (data) {
      return { ...data, save: saveMock };
    });
    await createCategoryHandler(req, res);
    expect(Category).toHaveBeenCalledWith({
      name: "OhneDesc",
      description: undefined,
    });
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(categoryResponse(saved));
  });
});

describe("getAllCategories", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und alle Kategorien zurückgeben", async () => {
    const cats = [
      { _id: "1", name: "A", description: "descA" },
      { _id: "2", name: "B", description: "descB" },
    ];
    Category.find.mockResolvedValue(cats);
    await getAllCategoriesHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(cats.map(categoryResponse));
  });
});

describe("getCategoryById", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { categoryId: "123" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Kategorie nicht gefunden wurde", async () => {
    Category.findById.mockResolvedValue(null);
    await getCategoryByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Kategorie nicht gefunden.",
    });
  });

  test("sollte 200 und die Kategorie zurückgeben, wenn gefunden", async () => {
    const cat = { _id: "123", name: "Test", description: "desc" };
    Category.findById.mockResolvedValue(cat);
    await getCategoryByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(categoryResponse(cat));
  });
});

describe("updateCategory", () => {
  let req, res, saveMock;

  beforeEach(() => {
    req = { params: { categoryId: "1" }, body: {} };
    res = mockRes();
    saveMock = vi.fn();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Kategorie nicht gefunden wurde", async () => {
    Category.findById.mockResolvedValue(null);
    await updateCategoryHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Kategorie nicht gefunden.",
    });
  });

  test("sollte Name und Beschreibung aktualisieren, wenn Name eindeutig ist", async () => {
    req.body = { name: "Neu", description: "neu desc" };
    const updated = {
      _id: "1",
      name: "Neu",
      description: "neu desc",
    };
    const category = {
      _id: "1",
      name: "Alt",
      description: "alt desc",
      save: saveMock.mockResolvedValue(updated),
    };
    Category.findById.mockResolvedValue(category);
    Category.findOne.mockResolvedValue(null);
    await updateCategoryHandler(req, res);
    expect(category.name).toBe("Neu");
    expect(category.description).toBe("neu desc");
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(categoryResponse(updated));
  });

  test("sollte 400 zurückgeben, wenn neuer Name nicht eindeutig ist", async () => {
    req.body = { name: "NichtUnique" };
    const category = {
      _id: "1",
      name: "Alt",
      description: "desc",
      save: saveMock,
    };
    Category.findById.mockResolvedValue(category);
    Category.findOne.mockResolvedValue({ _id: "2", name: "NichtUnique" });
    await updateCategoryHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Kategoriename wird bereits verwendet.",
    });
  });

  test("sollte nur die Beschreibung aktualisieren, wenn kein Name angegeben ist", async () => {
    req.body = { description: "nur desc" };
    const updated = {
      _id: "1",
      name: "Alt",
      description: "nur desc",
    };
    const category = {
      _id: "1",
      name: "Alt",
      description: "alt desc",
      save: saveMock.mockResolvedValue(updated),
    };
    Category.findById.mockResolvedValue(category);
    await updateCategoryHandler(req, res);
    expect(category.description).toBe("nur desc");
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(categoryResponse(updated));
  });
});

describe("deleteCategory", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { categoryId: "1" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Kategorie nicht gefunden wurde", async () => {
    Category.findById.mockResolvedValue(null);
    await deleteCategoryHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Kategorie nicht gefunden.",
    });
  });

  test("sollte Kategorie löschen und 200 zurückgeben, wenn gefunden", async () => {
    Category.findById.mockResolvedValue({ _id: "1" });
    Category.deleteOne.mockResolvedValue({});
    await deleteCategoryHandler(req, res);
    expect(Category.deleteOne).toHaveBeenCalledWith({ _id: "1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Kategorie entfernt." });
  });
});
