import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./lib/db.js";
import authRoutes from "./routers/auth.route.js";
import cookieParser from "cookie-parser";
import voyageRoutes from "./routers/voyage.route.js";
import saveCodeRoutes from "./routers/savedcode.route.js";
import printedQrRoutes from "./routers/printedQr.route.js";
import billOfLading from "./routers/billoflading.route.js";
import contactRoutes from "./routers/contact.routes.js";
import companyRoutes from "./routers/company.route.js";
import branchRoutes from "./routers/branch.route.js";
import trackproductRoutes from "./routers/trackproduct.route.js";
import goniRoutes from "./routers/goni.route.js";
import packageRoutes from "./routers/package.route.js";
import appControlRoutes from "./routers/appControl.route.js";
import seaVoyageRoutes from "./routers/seaVoyage.route.js";
import seaContainerRoutes from "./routers/seaContainer.router.js";
import cors from "cors";
import path from "path";
import { app, server, io } from "./lib/socket.js";
import notificationRoutes from "./routers/notification.route.js";
import { setupVoyageAutomation } from "./controllers/voyage.controller.js";

dotenv.config();

const port = process.env.PORT;

const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173",
  "https://aswaqforwarder.com",
  "https://productiq-web.onrender.com",
  "https://www.aswaqforwarder.com",
  "http://localhost:8081"
];

app.use(express.json())
app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/voyage", voyageRoutes);
app.use("/api/printedqr", printedQrRoutes);
app.use("/api/savedcode", saveCodeRoutes);
app.use("/api/billoflading", billOfLading);
app.use("/api/notification", notificationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/companycode", companyRoutes);
app.use("/api/branch", branchRoutes);
app.use("/api/trackproduct", trackproductRoutes);
app.use("/api/goni", goniRoutes);
app.use("/api/package", packageRoutes);
app.use("/api/app", appControlRoutes);
app.use("/api/sea-voyage", seaVoyageRoutes);
app.use("/api/sea-container", seaContainerRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  })
}

console.log('Initializing voyage automation...');
setupVoyageAutomation(io);

server.listen(port, () => {
  connectDb();
  console.log("Server started at http://localhost:5000");
  console.log("Voyage automation is active");
})