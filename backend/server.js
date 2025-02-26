import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./lib/db.js";
import authRoutes from "./routers/auth.route.js";
import cookieParser from "cookie-parser";
import voyageRoutes from "./routers/voyage.route.js";
import saveCodeRoutes from "./routers/savedcode.route.js";
import printedQrRoutes from "./routers/printedQr.route.js";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();

const port = process.env.PORT;

const __dirname = path.resolve();

app.use(express.json())
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use("/api/auth", authRoutes );
app.use("/api/voyage", voyageRoutes );
app.use("/api/printedqr", printedQrRoutes );
app.use("/api/savedcode", saveCodeRoutes );
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if(process.env.NODE_ENV==='production'){
    app.use(express.static(path.join(__dirname, "../frontend/dist")))

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    })
}

app.listen(port, () => {
    connectDb();
    console.log("Server started at http://localhost:5000");
})