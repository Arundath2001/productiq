import UploadedProduct from "../models/uploadedProduct.model.js";

export const trackProduct = async (req, res) => {
    try {
        const { trackingNumber } = req.body;

        if (!trackingNumber) {
            return res.status(400).json({ message: "Tracking Number is required!" });
        }

        const productDetails = await UploadedProduct.findOne({ trackingNumber }).populate("uploadedBy", "username");

        if (!productDetails) {
            return res.status(404).json({ message: "Product does not exist!" });
        }

        return res.status(200).json({
            message: "Product retrieved successfully!",
            productDetails
        });
    } catch (error) {
        console.log("Error in trackProduct controller", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}