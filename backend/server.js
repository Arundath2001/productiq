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
import cors from "cors";
import path from "path";
import { app, server } from "./lib/socket.js";
import notificationRoutes from "./routers/notification.route.js";

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  })
}

server.listen(port, () => {
  connectDb();
  console.log("Server started at http://localhost:5000");
})