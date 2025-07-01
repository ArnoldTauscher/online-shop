import asyncHandler from "../middlewares/asyncHandler.js";
import { calcPrices } from "../utils/calcPrices.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// Hilfsfunktion: ANTWORTOBJEKT für Bestellung (optional, falls sensitive Felder ausgeblendet werden sollen)
export function orderResponse(order) {
  return order; // Bei Bedarf anpassen, z.B. Felder ausblenden
}

// Hilfsfunktion: Bestellung nach ID suchen und optional User-Daten einbinden
async function findOrder(orderId, populateUser = false) {
  if (populateUser) {
    return await Order.findById(orderId).populate("user", "username email");
  }
  return await Order.findById(orderId);
}

// LOGIK - createOrder (für Tests)
export async function createOrderHandler(req, res) {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res
      .status(400)
      .json({ message: "Keine Bestellpositionen vorhanden." });
  }

  const itemsFromDB = await Product.find({
    _id: { $in: orderItems.map((item) => item._id) },
  });

  const validOrderItems = orderItems.map((itemFromClient) => {
    const matchingItemFromDB = itemsFromDB.find(
      (itemFromDB) => itemFromDB._id.toString() === itemFromClient._id
    );
    if (!matchingItemFromDB) {
      return res
        .status(404)
        .json({ message: `Produkt nicht gefunden: ${itemFromClient._id}` });
    }
    return {
      ...itemFromClient,
      product: itemFromClient._id,
      price: matchingItemFromDB.price,
    };
  });

  const { itemsPrice, shippingPrice, taxPrice, totalPrice } =
    calcPrices(validOrderItems);

  const order = new Order({
    orderItems: validOrderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  const createdOrder = await order.save();
  return res.status(201).json(orderResponse(createdOrder));
}

// NEUE Bestellung ANLEGEN (nur für eingeloggte Nutzer)
const createOrder = asyncHandler(createOrderHandler);


// LOGIK - getAllOrders (für Tests)
export async function getAllOrdersHandler(req, res) {
  const orders = await Order.find({}).populate("user", "id username");
  return res.status(200).json(orders.map(orderResponse));
}

// ALLE Bestellungen ABRUFEN (nur für Admin)
const getAllOrders = asyncHandler(getAllOrdersHandler);


// LOGIK - getUserOrders (für Tests)
  export async function getUserOrdersHandler(req, res) {
    const userOrders = await Order.find({ user: req.user._id });
    return res.status(200).json(userOrders.map(orderResponse));
  }

// EIGENE Bestellungen des Nutzers ABRUFEN
const getUserOrders = asyncHandler(getUserOrdersHandler);


// LOGIK - countTotalOrders (für Tests)
export async function countTotalOrdersHandler(req, res) {
  const totalOrders = await Order.countDocuments();
  res.status(200).json({ totalOrders });
}

// GESAMTANZAHL aller Bestellungen ABRUFEN (nur für Admin)
const countTotalOrders = asyncHandler(countTotalOrdersHandler);


// LOGIK - calculateTotalSales (für Tests)
export async function calculateTotalSalesHandler(req, res) {
  const orders = await Order.find();
  const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  res.status(200).json({ totalSales });
}

// GESAMTUMSATZ ABRUFEN (nur für Admin)
const calculateTotalSales = asyncHandler(calculateTotalSalesHandler);


// LOGIK - calculateTotalSalesByDate (für Tests)
export async function calculateTotalSalesByDateHandler(req, res) {
  const totalSalesByDate = await Order.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
        totalSales: { $sum: "$totalPrice" },
      },
    },
  ]);
  res.status(200).json({ totalSalesByDate });
}

// GESAMTUMSATZ nach DATUM ABRUFEN (nur für Admin)
const calculateTotalSalesByDate = asyncHandler(calculateTotalSalesByDateHandler);


// LOGIK - findOrderById (für Tests)
export async function findOrderByIdHandler(req, res) {
  const order = await findOrder(req.params.orderId, true);
  if (order) {
    res.status(200).json(orderResponse(order));
  } else {
    return res.status(404).json({ message: "Bestellung nicht gefunden." });
  }
}

// BESTIMMTE Bestellung nach ID ABRUFEN (nur für eingeloggte Nutzer)
const findOrderById = asyncHandler(findOrderByIdHandler);


// LOGIK - markOrderAsPaid (für Tests)
export async function markOrderAsPaidHandler(req, res) {
  const order = await findOrder(req.params.orderId);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };
    const updatedOrder = await order.save();
    res.status(200).json(orderResponse(updatedOrder));
  } else {
    return res.status(404).json({ message: "Bestellung nicht gefunden." });
  }
}

// Bestellung als BEZAHLT MARKIEREN (nur für eingeloggte Nutzer)
const markOrderAsPaid = asyncHandler(markOrderAsPaidHandler);


// LOGIK - markOrderAsDelivered (für Tests)
export async function markOrderAsDeliveredHandler(req, res) {
  const order = await findOrder(req.params.orderId);
  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    res.status(200).json(orderResponse(updatedOrder));
  } else {
    return res.status(404).json({ message: "Bestellung nicht gefunden." });
  }
}

// Bestellung als GELIEFERT MARKIEREN (nur für Admin)
const markOrderAsDelivered = asyncHandler(markOrderAsDeliveredHandler);

export {
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calculateTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
};
