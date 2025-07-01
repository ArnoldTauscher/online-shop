// Pakete importieren
import path from "path";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

// Hilfsfunktionen und Routen importieren
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

// Liste der benötigten Umgebungsvariablen, die zwingend gesetzt sein müssen
const REQUIRED_ENV_VARS = [
  "DATABASE_URI",
  "ALLOWED_ORIGINS",
  "JWT_SECRET",
  "PAYPAL_CLIENT_ID",
];

// Prüfen, ob alle benötigten Umgebungsvariablen vorhanden sind
const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `Fehlende Umgebungsvariablen: ${missingVars.join(", ")}. Bitte .env prüfen!`
  );
  process.exit(1);
}

const app = express();

// Erlaubte Domains aus Umgebungsvariable lesen
const allowedOrigins = process.env.ALLOWED_ORIGINS;

// CORS-Middleware konfigurieren, damit Cookies und Auth-Header übertragen werden können
app.use(
  cors({
    origin: function (origin, callback) {
      // Bei fehlender Origin (z.B. bei Postman) oder erlaubter Origin freigeben
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Fehlerobjekt mit Statuscode 403 erzeugen, wenn Origin nicht erlaubt ist
        const err = new Error("Nicht erlaubte Origin");
        err.status = 403;
        callback(err);
      }
    },
    credentials: true, // Cookies und Auth-Header erlauben
  })
);

const port = process.env.PORT || 5000;

// Verbindung zur Datenbank herstellen
connectDB();

// Body-Parser für JSON und URL-encoded aktivieren
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Zusätzliche HTTP-Header für Sicherheit setzen
app.use(helmet());

// Rate Limiting: Limitiert die Anzahl der Requests pro IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten Zeitfenster
  max: 500, // Maximal 500 Requests pro IP und Zeitfenster
});
app.use(limiter);

// Entfernt den X-Powered-By-Header (Sicherheitsmaßnahme)
app.disable("x-powered-by");

// Logging-Middleware: Loggt alle eingehenden Requests mit Zeitstempel
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API-Routen einbinden
app.use("/api/users", userRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);

// PayPal-Client-ID bereitstellen
app.get("/api/config/paypal", (req, res) => {
  res.send({ clientId: process.env.PAYPAL_CLIENT_ID });
});

// Statische Bereitstellung von Uploads (z.B. Produktbilder)
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname + "/uploads")));

// Server starten
app.listen(port, () => console.log(`Server läuft auf Port ${port}`));
