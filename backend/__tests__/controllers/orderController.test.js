import { describe, test, expect, vi, beforeEach } from "vitest";
import {
    createOrderHandler,
    getAllOrdersHandler,
    getUserOrdersHandler,
    countTotalOrdersHandler,
    calculateTotalSalesHandler,
    calculateTotalSalesByDateHandler,
    findOrderByIdHandler,
    markOrderAsPaidHandler,
    markOrderAsDeliveredHandler,
    orderResponse
} from "../../controllers/orderController.js";
import Product from "../../models/productModel.js";
import Order from "../../models/orderModel.js";
import * as calcPricesModule from "../../utils/calcPrices.js";

vi.mock("../../models/productModel.js");
vi.mock("../../models/orderModel.js");

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("createOrder", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: "user1" },
    };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 400 zurückgeben, wenn keine Bestellpositionen vorhanden sind", async () => {
    req.body = { orderItems: [] };
    await createOrderHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Keine Bestellpositionen vorhanden.",
    });
  });

  test("sollte 404 zurückgeben, wenn ein Produkt nicht gefunden wird", async () => {
    req.body = {
      orderItems: [{ _id: "p1", qty: 2 }],
      shippingAddress: { address: "Teststr. 1" },
      paymentMethod: "PayPal",
    };
    Product.find.mockResolvedValue([]); // Produkt nicht gefunden
    await createOrderHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Produkt nicht gefunden: p1",
    });
  });

  test("sollte Bestellung erfolgreich anlegen und 201 zurückgeben", async () => {
    req.body = {
      orderItems: [{ _id: "p1", qty: 2 }],
      shippingAddress: { address: "Teststr. 1" },
      paymentMethod: "PayPal",
    };
    Product.find.mockResolvedValue([{ _id: "p1", price: 10 }]);
    const savedOrder = {
      _id: "order1",
      orderItems: [
        { _id: "p1", qty: 2, product: "p1", price: 10 }
      ],
      user: "user1",
      shippingAddress: { address: "Teststr. 1" },
      paymentMethod: "PayPal",
      itemsPrice: "20.00",
      taxPrice: "3.80",
      shippingPrice: "10.00",
      totalPrice: "33.80",
    };
    Order.mockImplementation(function (data) {
      return {
        ...data,
        save: vi.fn().mockResolvedValue(savedOrder),
      };
    });
    vi.spyOn(calcPricesModule, "calcPrices").mockReturnValue({
      itemsPrice: "20.00",
      shippingPrice: "10.00",
      taxPrice: "3.80",
      totalPrice: "33.80",
    });

    await createOrderHandler(req, res);

    expect(Order).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(orderResponse(savedOrder)); 
  });
});

describe("getAllOrders", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und alle Kategorien zurückgeben", async () => {
    const orders = [
        {
            _id: "order1",
            orderItems: [
                { _id: "p1", qty: 2, product: "p1", price: 10 }
            ],
            user: "user1",
            shippingAddress: { address: "Teststr. 1" },
            paymentMethod: "PayPal",
            itemsPrice: "20.00",
            taxPrice: "3.80",
            shippingPrice: "10.00",
            totalPrice: "33.80",
        },
        {
            _id: "order2",
            orderItems: [
                { _id: "p2", qty: 3, product: "p2", price: 15 }
            ],
            user: "user2",
            shippingAddress: { address: "Teststr. 2" },
            paymentMethod: "PayPal",
            itemsPrice: "45.00",
            taxPrice: "8.55",
            shippingPrice: "10.00",
            totalPrice: "63.55",
        },
    ];
    Order.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue(orders)
    });
    await getAllOrdersHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orders.map(orderResponse));
  });
});

describe("getUserOrders", () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: "user1" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und ein leeres Array zurückgeben, wenn keine Bestellungen vorhanden sind", async () => {
    Order.find.mockResolvedValue([]);
    await getUserOrdersHandler(req, res);
    expect(Order.find).toHaveBeenCalledWith({ user: "user1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sollte 200 und alle Bestellungen des Nutzers zurückgeben", async () => {
    const orders = [
      {
        _id: "order1",
        user: "user1",
        orderItems: [{ _id: "p1", qty: 2 }],
        totalPrice: "20.00",
      },
      {
        _id: "order2",
        user: "user1",
        orderItems: [{ _id: "p2", qty: 1 }],
        totalPrice: "10.00",
      },
    ];
    Order.find.mockResolvedValue(orders);
    await getUserOrdersHandler(req, res);
    expect(Order.find).toHaveBeenCalledWith({ user: "user1" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orders.map(orderResponse));
  });
});

describe("countTotalOrders", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und die Gesamtanzahl der Bestellungen zurückgeben", async () => {
    Order.countDocuments.mockResolvedValue(42);
    await countTotalOrdersHandler(req, res);
    expect(Order.countDocuments).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ totalOrders: 42 });
  });
});

describe("calculateTotalSales", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und den Gesamtumsatz zurückgeben", async () => {
    const orders = [
      { _id: "o1", totalPrice: 10 },
      { _id: "o2", totalPrice: 20 },
    ];
    Order.find.mockResolvedValue(orders);
    await calculateTotalSalesHandler(req, res);
    expect(Order.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ totalSales: 30 });
  });
});

describe("calculateTotalSalesByDate", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 200 und den Gesamtumsatz nach Datum zurückgeben", async () => {
    const aggResult = [
      { _id: "2024-07-01", totalSales: 100 },
      { _id: "2024-07-02", totalSales: 200 },
    ];
    Order.aggregate.mockResolvedValue(aggResult);
    await calculateTotalSalesByDateHandler(req, res);
    expect(Order.aggregate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ totalSalesByDate: aggResult });
  });
});

describe("findOrderById", () => {
  let req, res;

  beforeEach(() => {
    req = { params: { orderId: "order1" } };
    res = mockRes();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Bestellung nicht gefunden wurde", async () => {
    // findOrder wird intern aufgerufen, also Order.findById
    vi.spyOn(Order, "findById").mockReturnValue({
      populate: vi.fn().mockResolvedValue(null),
    });
    await findOrderByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Bestellung nicht gefunden." });
  });

  test("sollte 200 und die Bestellung zurückgeben, wenn gefunden", async () => {
    const order = { _id: "order1", user: "user1", totalPrice: 20 };
    vi.spyOn(Order, "findById").mockReturnValue({
      populate: vi.fn().mockResolvedValue(order),
    });
    await findOrderByIdHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orderResponse(order));
  });
});

describe("markOrderAsPaid", () => {
  let req, res, saveMock;

  beforeEach(() => {
    req = {
      params: { orderId: "order1" },
      body: {
        id: "payid",
        status: "COMPLETED",
        update_time: "2024-07-01T12:00:00Z",
        payer: { email_address: "test@mail.de" },
      },
    };
    res = mockRes();
    saveMock = vi.fn();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Bestellung nicht gefunden wurde", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue(null);
    await markOrderAsPaidHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Bestellung nicht gefunden." });
  });

  test("sollte Bestellung als bezahlt markieren und 200 zurückgeben", async () => {
    const order = {
      _id: "order1",
      isPaid: false,
      save: saveMock,
    };
    const updatedOrder = { ...order, isPaid: true, paidAt: expect.any(Number) };
    saveMock.mockResolvedValue(updatedOrder);
    vi.spyOn(Order, "findById").mockResolvedValue(order);

    await markOrderAsPaidHandler(req, res);

    expect(order.isPaid).toBe(true);
    expect(order.paidAt).toBeDefined();
    expect(order.paymentResult).toEqual({
      id: "payid",
      status: "COMPLETED",
      update_time: "2024-07-01T12:00:00Z",
      email_address: "test@mail.de",
    });
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orderResponse(updatedOrder));
  });
});

describe("markOrderAsDelivered", () => {
  let req, res, saveMock;

  beforeEach(() => {
    req = { params: { orderId: "order1" } };
    res = mockRes();
    saveMock = vi.fn();
    vi.clearAllMocks();
  });

  test("sollte 404 zurückgeben, wenn Bestellung nicht gefunden wurde", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue(null);
    await markOrderAsDeliveredHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Bestellung nicht gefunden." });
  });

  test("sollte Bestellung als geliefert markieren und 200 zurückgeben", async () => {
    const order = {
      _id: "order1",
      isDelivered: false,
      save: saveMock,
    };
    const updatedOrder = { ...order, isDelivered: true, deliveredAt: expect.any(Number) };
    saveMock.mockResolvedValue(updatedOrder);
    vi.spyOn(Order, "findById").mockResolvedValue(order);

    await markOrderAsDeliveredHandler(req, res);

    expect(order.isDelivered).toBe(true);
    expect(order.deliveredAt).toBeDefined();
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(orderResponse(updatedOrder));
  });
});