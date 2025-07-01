import express from "express";
import { authenticate, authoriseAdmin } from "../middlewares/authMiddleware.js";
import {
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calculateTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
} from "../controllers/orderController.js";

const router = express.Router();

router
  .route("/")
  // NEUE Bestellung ANLEGEN (nur für eingeloggte Nutzer)
  .post(authenticate, createOrder)
  // ALLE Bestellungen ABRUFEN (nur für Admin)
  .get(authenticate, authoriseAdmin, getAllOrders);

// EIGENE Bestellungen des Nutzers ABRUFEN
router.route("/mine").get(authenticate, getUserOrders);

// GESAMTANZAHL aller Bestellungen ABRUFEN (nur für Admin)
router
  .route("/total-orders")
  .get(authenticate, authoriseAdmin, countTotalOrders);
// GESAMTUMSATZ ABRUFEN (nur für Admin)
router
  .route("/total-sales")
  .get(authenticate, authoriseAdmin, calculateTotalSales);
// GESAMTUMSATZ nach DATUM ABRUFEN (nur für Admin)
router
  .route("/total-sales-by-date")
  .get(authenticate, authoriseAdmin, calculateTotalSalesByDate);

// BESTIMMTE Bestellung nach ID ABRUFEN (nur für eingeloggte Nutzer)
router.route("/:orderId").get(authenticate, findOrderById);

// Bestellung als BEZAHLT MARKIEREN (nur für eingeloggte Nutzer)
router.route("/:orderId/pay").put(authenticate, markOrderAsPaid);

// Bestellung als GELIEFERT MARKIEREN (nur für Admin)
router
  .route("/:orderId/deliver")
  .put(authenticate, authoriseAdmin, markOrderAsDelivered);

export default router;
