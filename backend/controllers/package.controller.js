import Package from "../models/package.model.js";
import UploadedProduct from "../models/uploadedProduct.model.js";

export const createPackage = async (req, res) => {
    try {
        const { voyageId, goniId, goniNumber, packagedBy } = req.body;

        if (!voyageId || !goniId || !goniNumber || !packagedBy) {
            return res.status(400).json({ message: "All are required fields!" });
        }

        const exisitngPackage = await Package.findOne({ voyageId, goniId, goniNumber });

        if (exisitngPackage) {
            return res.status(400).json({ message: `Package with Goni ${goniNumber} already exists for this voyage` });
        }

        const newPackage = new Package({
            voyageId,
            goniId,
            goniNumber: parseInt(goniNumber),
            packagedBy,
            products: []
        });

        await newPackage.save();

        res.status(201).json({ message: "Package created successfully!", data: newPackage });

    } catch (error) {
        console.log("Error in createPackage controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const uploadToPackage = async (req, res) => {
    try {
        const { packageId } = req.params;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: "ProductId is requird!" });
        }

        const packageData = await Package.findById(packageId);

        if (!packageData) {
            return res.status(404).json({ message: "Package not found!" });
        }

        if (packageData.status === "shipped") {
            return res.status(400).json({ message: "Cannot add products to shipped packages!" });
        }

        const product = await UploadedProduct.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }


        if (packageData.products.includes(productId)) {
            return res.status(404).json({ message: "Product already added to this package!" });
        }

        const existingPackage = await Package.findOne({ products: productId, _id: { $ne: packageId } });

        if (existingPackage) {
            return res.status(404).json({
                message: "Product is already assigned to another package"
            });
        }

        packageData.products.push(productId);
        await packageData.save();

        const updatedPackage = await Package.findById(packageId).populate('products').populate('goniId').populate('voyageId');

        res.status(200).json({
            message: "Product added to package successfully",
            package: updatedPackage
        });

    } catch (error) {
        console.log("Error in uploadToPackage controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}