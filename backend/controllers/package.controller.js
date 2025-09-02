import Package from "../models/package.model.js";
import UploadedProduct from "../models/uploadedProduct.model.js";

export const getPackagesByGoniAndVoyage = async (req, res) => {
    try {

        const { voyageId, goniId } = req.body;

        const packages = await Package.find({ voyageId, goniId }).populate('goniId', 'goniName');

        res.status(201).json({ message: "Packages fetched successfully", packages });

    } catch (error) {

        console.log('Error in getPackes controller', error.message);
        res.status(500).json({ message: "Internal server error" });

    }
}


export const createPackage = async (req, res) => {
    try {
        const { voyageId, goniId, goniNumber } = req.body;

        if (!voyageId || !goniId || !goniNumber) {
            return res.status(400).json({ message: "All are required fields!" });
        }

        const exisitngPackage = await Package.findOne({ voyageId, goniId, goniNumber }).populate('goniId', 'goniName');

        if (exisitngPackage) {
            return res.status(400).json({ message: `${exisitngPackage.goniId.goniName} with Goni ${goniNumber} already exists for this voyage` });
        }

        const newPackage = new Package({
            voyageId,
            goniId,
            goniNumber: parseInt(goniNumber),
            packagedBy: req.user.id,
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
            return res.status(400).json({ message: "Package not found!" });
        }

        if (packageData.status === "shipped") {
            return res.status(400).json({ message: "Cannot add products to shipped packages!" });
        }

        const product = await UploadedProduct.findById(productId);

        if (!product) {
            return res.status(400).json({ message: "Product not found!" });
        }


        if (packageData.products.includes(productId)) {
            return res.status(400).json({ message: "Product already added to this package!" });
        }

        const existingPackage = await Package.findOne({ products: productId, _id: { $ne: packageId } });

        if (existingPackage) {
            return res.status(400).json({
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

export const getPackageDetails = async (req, res) => {
    try {
        const { packageId } = req.params;

        console.log(packageId, "package iddddddddddddddddddddddd");


        if (!packageId) {
            return res.status(400).json({ message: "PackageId is required field!" });
        }

        const packages = await Package.findById(packageId).populate('products', 'productCode sequenceNumber').populate('goniId', 'goniName');

        if (!packages) {
            return res.status(400).json({ message: "Package does not exist!" });
        }

        res.status(200).json({
            message: "Package fetched successfully",
            package: packages
        });

    } catch (error) {
        console.log("Error in getPackages controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const packageDetailsByVoyageAndCompany = async (req, res) => {
    try {
        const { voyageId, companyId } = req.params;

        if (!voyageId || !companyId) {
            return res.status(400).json({ message: "voyageId and companyId are required!" });
        }

        const packages = await Package.find({ voyageId })
            .populate({
                path: "goniId",
                match: { companyId: companyId },
                select: "goniName"
            })
            .select("goniNumber").populate('products', 'productCode sequenceNumber trackingNumber');

        const filteredPackages = packages.filter(pkg => pkg.goniId !== null);

        res.status(200).json({
            message: "Packages fetched successfully",
            packages: filteredPackages
        });
    } catch (error) {
        console.log("Error in packageDetailsByVoyageAndCompany controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
