import Voyage from "../models/voyage.model.js";
import PrintedQr from "../models/printedQr.model.js";

export const generatePrintedQr = async (req, res) => {
    try {
        const { productCode, voyageNumber, quantity } = req.body;

        console.log(req.body);

        if (!productCode || !voyageNumber || !quantity) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const voyage = await Voyage.findOne({ voyageNumber });

        if (!voyage) {
            return res.status(400).json({ message: "Voyage not found" });
        }

        let lastCount = voyage.lastPrintedCounts.get(productCode) || 0;
        let qrList = [];

        for (let i = 0; i < quantity; i++) {
            const quantityFormat = (lastCount + i + 1).toString().padStart(2, '0'); // 01, 02, ...
            const qrData = `${productCode}|${quantityFormat}|${voyageNumber}`;

            const printedQr = new PrintedQr({
                productCode,
                voyageNumber,
                quantity,
                printedBy: req.user.id
            });

            await printedQr.save();
            qrList.push(qrData);
        }

        voyage.lastPrintedCounts.set(productCode, lastCount + quantity);
        await voyage.save();

        res.status(200).json({ message: "QR Data generated successfully", qrList });

        console.log(qrList);
        

    } catch (error) {
        console.error("Error in generatePrintedQr controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
