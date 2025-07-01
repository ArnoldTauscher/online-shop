import { describe, test, expect, vi, beforeEach } from "vitest";
import {
  createUserHandler,
  loginUserHandler,
  logoutCurrentUserHandler,
  getAllUsersHandler,
  getCurrentUserProfileHandler,
  updateCurrentUserProfileHandler,
  getUserByIdHandler,
  updateUserByIdHandler,
  deleteUserByIdHandler,
  userResponse
} from "../../controllers/userController.js";
import User from "../../models/userModel.js";
import bcrypt from "bcryptjs";
import * as validateUserFieldsModule from "../../utils/validateUserFields.js";
import * as createTokenModule from "../../utils/createToken.js";

vi.mock("../../models/userModel.js");
vi.mock("bcryptjs");
vi.mock("../../utils/validateUserFields.js");
vi.mock("../../utils/createToken.js");

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  return res;
}

function mockUniqueCheck({ emailExists, usernameExists }) {
  User.findOne
    .mockResolvedValueOnce(emailExists)
    .mockResolvedValueOnce(usernameExists);
}

describe("createUser", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 400 zurückgeben, wenn die Validierung der Benutzerdaten fehlschlägt", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: false,
      message: "Fehler",
    });
    req.body = { username: "", email: "", password: "" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Fehler" });
  });

  test("sollte 400 zurückgeben, wenn der Benutzername nicht eindeutig ist", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    mockUniqueCheck({
      emailExists: null,
      usernameExists: { _id: "1", username: "user" },
    });
    req.body = { username: "user", email: "mail@test.de", password: "pw" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzername wird bereits verwendet.",
    });
  });

  test("sollte 400 zurückgeben, wenn die E-Mail nicht eindeutig ist", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    mockUniqueCheck({
      emailExists: { _id: "2", email: "test@test.de" },
      usernameExists: null,
    });
    req.body = { username: "user", email: "test@test.de", password: "pw" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "E-Mail wird bereits verwendet.",
    });
  });

  test("sollte Benutzer erstellen und 201 zurückgeben, wenn Daten gültig und eindeutig sind", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    User.findOne.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedpw");
    const saveMock = vi.fn().mockResolvedValue();
    const userObj = {
      _id: "123",
      username: "user",
      email: "mail",
      isAdmin: false,
      save: saveMock,
    };
    User.mockImplementation(function (data) {
      return { ...userObj, ...data, save: saveMock };
    });
    createTokenModule.default = vi.fn();
    req.body = { username: "user", email: "mail", password: "pw" };
    await createUserHandler(req, res);
    expect(saveMock).toHaveBeenCalled();
    expect(createTokenModule.default).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(userResponse(userObj));
  });

  test("sollte 500 zurückgeben, wenn beim Speichern des Benutzers ein Fehler auftritt", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    User.findOne.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedpw");
    const saveMock = vi.fn().mockRejectedValue(new Error("fail"));
    User.mockImplementation(function (data) {
      return { ...data, save: saveMock };
    });
    req.body = { username: "user", email: "mail", password: "pw" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ungültige Benutzerdaten.",
    });
  });
});

describe("loginUser", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 400 zurückgeben, wenn E-Mail oder Passwort fehlt", async () => {
    req.body = { email: "", password: "" };
    await loginUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Bitte alle Felder ausfüllen.",
    });
  });

  test("sollte 401 zurückgeben, wenn das Passwort ungültig ist", async () => {
    req.body = { email: "mail@test.de", password: "pw" };
    User.findOne.mockResolvedValue({
      _id: "1",
      email: "mail@test.de",
      password: "hashedpw",
    });
    bcrypt.compare.mockResolvedValue(false);
    await loginUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ungültige E-Mail oder Passwort.",
    });
  });

  test("sollte 401 zurückgeben, wenn der Benutzer nicht gefunden wurde", async () => {
    req.body = { email: "notfound@mail.de", password: "pw" };
    User.findOne.mockResolvedValue(null);
    await loginUserHandler(req, res);
  });

  test("sollte 200 und den Benutzer zurückgeben, wenn Login erfolgreich ist", async () => {
    req.body = { email: "mail@test.de", password: "pw" };
    const user = {
      _id: "1",
      username: "user",
      email: "mail@test.de",
      password: "hashedpw",
      isAdmin: false,
    };
    User.findOne.mockResolvedValue(user);
    bcrypt.compare.mockResolvedValue(true);
    createTokenModule.default = vi.fn();
    await loginUserHandler(req, res);
    expect(createTokenModule.default).toHaveBeenCalledWith(res, user._id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(userResponse(user));
  });
});

describe("logoutCurrentUser", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte das JWT-Cookie löschen und 200 zurückgeben", async () => {
    await logoutCurrentUserHandler(req, res);
    expect(res.cookie).toHaveBeenCalledWith("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Erfolgreich ausgeloggt.",
    });
  });
});

describe("getAllUsers", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und alle Benutzer zurückgeben", async () => {
    const user1 = {
      _id: "1",
      username: "user1",
      email: "mail1@test.de",
      password: "hashedpw",
      isAdmin: false,
    };
    const user2 = {
      _id: "2",
      username: "user2",
      email: "mail2@test.de",
      password: "hashedpw",
      isAdmin: false,
    };
    User.find.mockResolvedValue([user1, user2]);
    await getAllUsersHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      userResponse(user1),
      userResponse(user2),
    ]);
  });
});

describe("getCurrentUserProfile", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: "123" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und das Profil des aktuellen Benutzers zurückgeben, wenn Benutzer gefunden wurde", async () => {
    const user = {
      _id: "123",
      username: "user",
      email: "mail@test.de",
    };
    User.findById.mockResolvedValue(user);
    await getCurrentUserProfileHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(userResponse(user));
  });

  test("sollte 404 zurückgeben, wenn aktueller Benutzer nicht gefunden wurde", async () => {
    User.findById.mockResolvedValue(null);
    await getCurrentUserProfileHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzer nicht gefunden.",
    });
  });
});

describe("updateCurrentUserProfile", () => {
  let req, res, saveMock;

  beforeEach(() => {
    req = { user: { _id: "123" }, body: {} };
    res = mockRes();
    saveMock = vi.fn();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn aktueller Benutzer nicht gefunden wurde", async () => {
    User.findById.mockResolvedValue(null);
    await updateCurrentUserProfileHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzer nicht gefunden.",
    });
  });

  test("sollte 400 zurückgeben, wenn die Validierung der aktuellen Benutzerdaten fehlschlägt", async () => {
    User.findById.mockResolvedValue({
      _id: "123",
      username: "user",
      email: "mail@test.de",
    });
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: false,
      message: "Fehler",
    });
    req.body = { username: "", email: "", password: "" };
    await updateCurrentUserProfileHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Fehler" });
  });

  test("sollte 400 zurückgeben, wenn der neue Benutzername des aktuellen Benutzers nicht eindeutig ist", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    mockUniqueCheck({
      emailExists: null,
      usernameExists: { _id: "1", username: "user" },
    });
    req.body = { username: "user", email: "mail@test.de", password: "pw" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzername wird bereits verwendet.",
    });
  });

  test("sollte 400 zurückgeben, wenn die neue E-Mail des aktuellen Benutzers nicht eindeutig ist", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    mockUniqueCheck({
      emailExists: { _id: "2", email: "test@test.de" },
      usernameExists: null,
    });
    req.body = { username: "user", email: "test@test.de", password: "pw" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "E-Mail wird bereits verwendet.",
    });
  });

  test("sollte aktuellen Benutzer aktualisieren und 200 zurückgeben, wenn Daten gültig und eindeutig sind", async () => {
    const user = {
      _id: "123",
      username: "user",
      email: "mail@test.de",
      password: "oldpw",
      save: function () {
        this.username = "neuuser";
        this.email = "neu@mail.de";
        return Promise.resolve({
          _id: this._id,
          username: this.username,
          email: this.email,
          isAdmin: false,
        });
      },
    };
    const saveSpy = vi.spyOn(user, "save");
    User.findById.mockResolvedValue(user);
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    User.findOne.mockResolvedValue(null);
    req.body = { username: "neuuser", email: "neu@mail.de" };
    await updateCurrentUserProfileHandler(req, res);
    expect(saveSpy).toHaveBeenCalled();
    expect(user.username).toBe("neuuser");
    expect(user.email).toBe("neu@mail.de");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(userResponse({
      _id: "123",
      username: "neuuser",
      email: "neu@mail.de",
      isAdmin: false,
    }));
  });

  test("sollte das Passwort des aktuellen Benutzers aktualisieren, wenn ein neues Passwort angegeben ist", async () => {
    const user = {
      _id: "123",
      username: "user",
      email: "mail@test.de",
      password: "oldpw",
      save: function () {
        this.username = "neuuser";
        this.email = "neu@mail.de";
        return Promise.resolve({
          _id: this._id,
          username: this.username,
          email: this.email,
          isAdmin: false,
        });
      },
    };
    const saveSpy = vi.spyOn(user, "save");
    User.findById.mockResolvedValue(user);
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    User.findOne.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedpw");
    req.body = { password: "newpw" };
    await updateCurrentUserProfileHandler(req, res);
    expect(saveSpy).toHaveBeenCalled();
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith("newpw", "salt");
    expect(user.password).toBe("hashedpw");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getUserById", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { userId: "123" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und den Benutzer zurückgeben, wenn Benutzer gefunden wurde", async () => {
    const selectMock = vi.fn().mockResolvedValue({
      _id: "123",
      username: "user",
      email: "mail@test.de",
      isAdmin: false,
    });
    User.findById.mockReturnValue({ select: selectMock });
    await getUserByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(userResponse({
      _id: "123",
      username: "user",
      email: "mail@test.de",
      isAdmin: false,
    }));
  });

  test("sollte 404 zurückgeben, wenn der Benutzer nicht gefunden wurde", async () => {
    const selectMock = vi.fn().mockResolvedValue(null);
    User.findById.mockReturnValue({ select: selectMock });
    await getUserByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzer nicht gefunden.",
    });
  });
});

describe("updateUserById", () => {
  let req, res, saveMock;

  beforeEach(() => {
    req = { params: { userId: "123" }, body: {} };
    res = mockRes();
    saveMock = vi.fn();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn der Benutzer nicht gefunden wurde", async () => {
    User.findById.mockResolvedValue(null);
    await updateUserByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzer nicht gefunden.",
    });
  });

  test("sollte 400 zurückgeben, wenn die Validierung fehlschlägt", async () => {
    User.findById.mockResolvedValue({
      _id: "123",
      username: "user",
      email: "mail@test.de",
    });
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: false,
      message: "Fehler",
    });
    req.body = { username: "", email: "", password: "" };
    await updateUserByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Fehler" });
  });

  test("sollte 400 zurückgeben, wenn der Benutzername nicht eindeutig ist", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    mockUniqueCheck({
      emailExists: null,
      usernameExists: { _id: "1", username: "user" },
    });
    req.body = { username: "user", email: "mail@test.de", password: "pw" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzername wird bereits verwendet.",
    });
  });

  test("sollte 400 zurückgeben, wenn die E-Mail nicht eindeutig ist", async () => {
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    mockUniqueCheck({
      emailExists: { _id: "2", email: "test@test.de" },
      usernameExists: null,
    });
    req.body = { username: "user", email: "test@test.de", password: "pw" };
    await createUserHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "E-Mail wird bereits verwendet.",
    });
  });

  test("sollte Benutzer aktualisieren und 200 zurückgeben, wenn Daten gültig und eindeutig sind", async () => {
    const user = {
      _id: "123",
      username: "user",
      email: "mail@test.de",
      password: "oldpw",
      save: function () {
        this.username = "neuuser";
        this.email = "neu@mail.de";
        return Promise.resolve({
          _id: this._id,
          username: this.username,
          email: this.email,
          isAdmin: false,
        });
      },
    };
    const saveSpy = vi.spyOn(user, "save");
    User.findById.mockResolvedValue(user);
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    User.findOne.mockResolvedValue(null);
    req.body = { username: "neuuser", email: "neu@mail.de" };
    await updateUserByIdHandler(req, res);
    expect(saveSpy).toHaveBeenCalled();
    expect(user.username).toBe("neuuser");
    expect(user.email).toBe("neu@mail.de");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(userResponse({
      _id: "123",
      username: "neuuser",
      email: "neu@mail.de",
      isAdmin: false,
    }));
  });

  test("sollte Passwort aktualisieren, wenn ein neues Passwort angegeben ist", async () => {
    const user = {
      _id: "123",
      username: "user",
      email: "mail@test.de",
      password: "oldpw",
      save: function () {
        this.username = "neuuser";
        this.email = "neu@mail.de";
        return Promise.resolve({
          _id: this._id,
          username: this.username,
          email: this.email,
          isAdmin: false,
        });
      },
    };
    const saveSpy = vi.spyOn(user, "save");
    User.findById.mockResolvedValue(user);
    validateUserFieldsModule.validateUserFields.mockReturnValue({
      valid: true,
    });
    User.findOne.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedpw");
    req.body = { password: "newpw" };
    await updateUserByIdHandler(req, res);
    expect(saveSpy).toHaveBeenCalled();
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith("newpw", "salt");
    expect(user.password).toBe("hashedpw");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteUserById", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { userId: "123" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 400 zurückgeben, wenn der zu löschende Benutzer ein Admin ist", async () => {
    User.findById.mockResolvedValue({ _id: "123", isAdmin: true });
    await deleteUserByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Admin-Benutzer kann nicht gelöscht werden.",
    });
  });

  test("sollte 404 zurückgeben, wenn der Benutzer nicht gefunden wurde", async () => {
    User.findById.mockResolvedValue(null);
    await deleteUserByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Benutzer nicht gefunden.",
    });
  });

  test("sollte Benutzer löschen und 200 zurückgeben, wenn Benutzer gefunden wurde", async () => {
    User.findById.mockResolvedValue({ _id: "123" });
    User.deleteOne.mockResolvedValue({});
    await deleteUserByIdHandler(req, res);
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: "123" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Benutzer entfernt." });
  });
});
