import Voyage from "../models/voyage.model.js";
import PrintedQr from "../models/printedQr.model.js";
import { imageSync } from "qr-image";


export const generatePrintedQr = async (req, res) => {
    try {
        const { productCode, voyageNumber, quantity } = req.body;

        console.log("Received request:", req.body);

        if (!productCode || !voyageNumber || !quantity) {
            console.error("Validation failed: Missing fields");
            return res.status(400).json({ message: "All fields are required" });
        }

        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({ message: "Invalid quantity" });
        }

        const voyage = await Voyage.findOne({ voyageNumber });
        if (!voyage) {
            console.error(`Voyage not found for voyageNumber: ${voyageNumber}`);
            return res.status(400).json({ message: "Voyage not found" });
        }

        let lastCount = voyage.lastPrintedCounts.get(productCode) || 0;
        console.log(`Initial lastCount for ${productCode}:`, lastCount);

        let qrList = [];

        for (let i = 0; i < qty; i++) {
            lastCount++;  
            const sequenceNumber = lastCount.toString().padStart(2, "0"); 
            const qrData = `${productCode}|${sequenceNumber}|${voyageNumber}`;

            console.log(`Generated QR: ${qrData}`);

            const qr_svg = imageSync(qrData, { type: "png" });
            const qrImage = `data:image/png;base64,${qr_svg.toString("base64")}`;

            const printedQr = new PrintedQr({
                productCode,
                voyageNumber,
                quantity: lastCount, 
                printedBy: req.user.id,
                qrImage,
            });

            await printedQr.save();

            qrList.push({
                productCode,
                sequenceNumber,
                voyageNumber,
                qrImage
            });
        }

        console.log(`Updating lastCount for ${productCode}:`, lastCount);
        voyage.lastPrintedCounts.set(productCode, lastCount);
        await voyage.save();
        console.log(`Voyage updated successfully with lastCount:`, voyage.lastPrintedCounts.get(productCode));

        console.log(qrList);

        res.status(200).json({ message: "QR Data generated successfully", qrList });
        

    } catch (error) {
        console.error("Error in generatePrintedQr controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
