import User from "../models/user.model.js";
import Voyage from "../models/voyage.model.js";
import UploadedProduct from "../models/uploadedProduct.model.js";
import PrintBatch from "../models/printBatch.model.js";
import PrintedQr from "../models/printedQr.model.js";
import axios from "axios";
import { Expo } from 'expo-server-sdk';
import { io } from "../lib/socket.js";

export const createVoyage = async (req, res) => {
    try {
        const { voyageName, voyageNumber, year, branchId } = req.body;

        console.log(req.body);


        if (req.user.role !== 'admin') {
            return res.status(400).json({ message: "Only admin can create voyages" })
        }

        const exisitngVoyage = await Voyage.findOne({ voyageNumber });

        if (exisitngVoyage) return res.status(400).json({ message: "Voyage number already exisits" })

        const newVoyage = new Voyage({
            voyageName,
            voyageNumber,
            year,
            branchId,
            createdBy: req.user.id
        })

        await newVoyage.save();

        res.status(200).json(newVoyage);

    } catch (error) {
        console.log("Error in create voyage controller", error.message);
        res.status(500).json({ message: "Inernal server error" });
    }
}

export const uploadVoyage = async (req, res) => {
    try {
        const { voyageNumber } = req.params;
        const { productCode: fullProductCode, trackingNumber, clientCompany, weight, branchId } = req.body

        console.log("Voyage upload request body:", req.body);
        console.log(req.body, req.file);

        if (!fullProductCode || !trackingNumber || !clientCompany || !req.file || !weight || !branchId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const productCodeParts = fullProductCode.split('|');
        if (productCodeParts.length !== 3) {
            return res.status(400).json({ message: "Invalid product code format. Expected format: CODE|SEQUENCE|VOYAGE" });
        }

        const productCode = productCodeParts[0].trim();
        const sequenceNumber = parseInt(productCodeParts[1].trim());
        const productVoyageNumber = parseInt(productCodeParts[2].trim());

        if (isNaN(sequenceNumber) || isNaN(productVoyageNumber)) {
            return res.status(400).json({ message: "Sequence number and voyage number must be valid numbers" });
        }

        const voyage = await Voyage.findOne({ voyageNumber: String(voyageNumber) });
        if (!voyage) {
            return res.status(400).json({ message: "Voyage not found" })
        }

        if (req.user.role !== 'employee') {
            return res.status(400).json({ message: "Only employee can upload voyage data" });
        }

        const existingProduct = await UploadedProduct.findOne({
            productCode: productCode,
            sequenceNumber: sequenceNumber,
            voyageNumber: productVoyageNumber
        });

        if (existingProduct) {
            return res.status(400).json({ message: "Product code with this sequence and voyage number already exists" });
        }

        const imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;

        console.log(process.env.BASE_URL);

        const newProduct = new UploadedProduct({
            productCode,
            sequenceNumber,
            voyageNumber: productVoyageNumber,
            trackingNumber,
            clientCompany,
            voyageId: voyage._id,
            image: imageUrl,
            uploadedBy: req.user._id,
            weight,
            branchId
        });

        await newProduct.save();

        io.emit("voyage-data-updated", {
            voyageNumber,
            newProduct: {
                productCode,
                sequenceNumber,
                voyageNumber: productVoyageNumber,
                compositeCode: newProduct.compositeCode,
                trackingNumber,
                clientCompany,
                image: imageUrl,
                uploadedBy: req.user._id,
                weight,
                branchId,
                voyageId: voyage._id
            },
            updateType: 'upload'
        });

        // Updated notification logic for multiple tokens
        const clientUsers = await User.find({ role: 'client', companyCode: clientCompany });
        const allTokens = [];

        for (let client of clientUsers) {
            // Get all tokens for each client (all their logged-in devices)
            if (client.expoPushTokens && client.expoPushTokens.length > 0) {
                const activeTokens = client.expoPushTokens.map(tokenObj => tokenObj.token);
                allTokens.push(...activeTokens);
            }
        }

        if (allTokens.length > 0) {
            await sendPushNotificationToMultiple(
                allTokens,
                `A new item with product code ${productCode} (Qty: ${sequenceNumber}) has been received.`
            );
        }

        res.status(200).json({ product: newProduct });

    } catch (error) {
        console.log("Error in upload voyage controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getVoyage = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId)
            .populate("createdBy", "username")
            .populate("uploadedProducts");

        if (!voyage) {
            return res.status(400).json({ message: "Voyage not found" });
        }

        await UploadedProduct.populate(voyage.uploadedProducts, {
            path: 'uploadedBy',
            select: 'username'
        });

        res.status(200).json(voyage);
    } catch (error) {
        console.log("Error in getVoyage controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getVoyageNumber = async (req, res) => {
    try {
        const voyages = await Voyage.find({ status: 'pending' }, "voyageNumber");

        const voyageNumbers = [...new Set(voyages.map(voyage => voyage.voyageNumber))];

        res.status(200).json({ voyageNumbers });

    } catch (error) {
        console.log("Error in voyageNumber controller", error.message);
        res.status(500).json({ message: "Inernal server error" });
    }
}

export const getProductDetails = async (req, res) => {
    try {
        const { productCode } = req.params;

        console.log("Searching for productCode:", productCode);

        let searchCriteria = {};

        if (productCode.includes('|')) {
            const parts = productCode.split('|');
            if (parts.length >= 1) searchCriteria.productCode = { $regex: `^${parts[0]}`, $options: "i" };
            if (parts.length >= 2 && !isNaN(parseInt(parts[1].trim()))) {
                searchCriteria.sequenceNumber = parseInt(parts[1].trim());
            }
            if (parts.length >= 3 && !isNaN(parseInt(parts[2].trim()))) {
                searchCriteria.voyageNumber = parseInt(parts[2].trim());
            }
        } else {
            searchCriteria.productCode = { $regex: `^${productCode}`, $options: "i" };
        }

        const voyages = await Voyage.find({ status: { $ne: "completed" } });
        const voyageIds = voyages.map(v => v._id);

        const products = await UploadedProduct.find({
            voyageId: { $in: voyageIds },
            ...searchCriteria
        })
            .populate("uploadedBy", "username")
            .sort({ createdAt: -1 });

        res.status(200).json(products);

    } catch (error) {
        console.error("Error fetching product details:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getVoyages = async (req, res) => {
    try {

        const { branchId } = req.params;

        console.log(branchId);


        const voyages = await Voyage.find({ status: "pending", branchId: branchId }).sort({ createdAt: -1 });

        res.status(200).json(voyages);

    } catch (error) {
        console.error("Error fetching getVoyages details:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCompletedVoyages = async (req, res) => {
    try {
        const voyages = await Voyage.find({ status: "completed" }).sort({ createdAt: -1 });

        if (!voyages.length) {
            return res.status(200).json([]);
        }

        // Get voyage IDs for querying products
        const voyageIds = voyages.map(voyage => voyage._id);

        // Find all completed products for these voyages
        const products = await UploadedProduct.find({
            voyageId: { $in: voyageIds },
            status: "completed"
        });

        // Create a map to store statistics for each voyage
        const voyageStatsMap = new Map();

        // Initialize voyage stats
        voyages.forEach(voyage => {
            voyageStatsMap.set(voyage._id.toString(), {
                ...voyage.toObject(),
                totalItems: 0,
                totalWeight: 0,
                totalCompanies: 0,
                companies: new Set()
            });
        });

        // Calculate statistics from products
        products.forEach(product => {
            const voyageId = product.voyageId.toString();
            const voyageStats = voyageStatsMap.get(voyageId);

            if (voyageStats) {
                voyageStats.totalItems += 1;
                voyageStats.totalWeight += Number(product.weight) || 0;
                voyageStats.companies.add(product.clientCompany);
            }
        });

        // Format the response with calculated statistics
        const completedVoyages = Array.from(voyageStatsMap.values()).map(voyage => ({
            _id: voyage._id,
            voyageName: voyage.voyageName,
            voyageNumber: voyage.voyageNumber,
            year: voyage.year,
            status: voyage.status,
            createdBy: voyage.createdBy,
            createdAt: voyage.createdAt,
            updatedAt: voyage.updatedAt,
            exportedDate: voyage.exportedDate,
            totalItems: voyage.totalItems,
            totalWeight: Math.round(voyage.totalWeight * 100) / 100,
            totalCompanies: voyage.companies.size
        }));

        // Sort by creation date (most recent first)
        completedVoyages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json(completedVoyages);

    } catch (error) {
        console.error("Error fetching getCompletedVoyages details:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const sendPushNotificationToMultiple = async (expoPushTokens, message) => {
    let expo = new Expo();

    // Create messages for all tokens
    const messages = expoPushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: 'Aswaq Forwarder',
        body: message,
        data: { withSome: 'data' },
    }));

    try {
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        let failedTokens = [];

        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        // Check for failed notifications and collect failed tokens
        tickets.forEach((ticket, index) => {
            if (ticket.status === 'error') {
                console.error(`Push notification failed for token ${expoPushTokens[index]}:`, ticket.message);

                // If token is invalid/dead, add to failed tokens list
                if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                    failedTokens.push(expoPushTokens[index]);
                }
            }
        });

        // Optionally clean up failed tokens from database
        if (failedTokens.length > 0) {
            console.log(`Found ${failedTokens.length} dead tokens, cleaning up...`);
            await cleanupDeadTokens(failedTokens);
        }

        console.log(`Push notifications sent to ${expoPushTokens.length} devices`);

    } catch (error) {
        console.error('Error sending push notifications:', error);
    }
};

const cleanupDeadTokens = async (deadTokens) => {
    try {
        // Remove dead tokens from all users
        const result = await User.updateMany(
            {},
            {
                $pull: {
                    expoPushTokens: {
                        token: { $in: deadTokens }
                    }
                }
            }
        );

        console.log(`Cleaned up ${deadTokens.length} dead tokens from ${result.modifiedCount} users`);
    } catch (error) {
        console.error('Error cleaning up dead tokens:', error);
    }
};

const sendPushNotification = async (expoPushToken, message) => {
    await sendPushNotificationToMultiple([expoPushToken], message);
};

export const exportVoyageData = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId);
        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        const products = await UploadedProduct.find({ voyageId: voyageId });

        res.status(200).json({
            message: "Voyage data exported successfully",
            products: products,
            voyageInfo: voyage
        });

    } catch (error) {
        console.error("Error in exportVoyageData controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const closeVoyage = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId);
        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        if (voyage.status === "completed") {
            return res.status(400).json({ message: "Voyage is already completed" });
        }

        const now = new Date();

        voyage.status = "completed";
        voyage.lastPrintedCounts = new Map();
        voyage.completedDate = now;
        await voyage.save();

        const updatedProducts = await UploadedProduct.updateMany(
            { voyageId: voyageId },
            {
                status: "completed",
                exportedDate: now
            }
        );

        const products = await UploadedProduct.find({ voyageId: voyageId });

        await PrintBatch.deleteMany({ voyageNumber: voyage.voyageNumber });
        await PrintedQr.deleteMany({ voyageNumber: voyage.voyageNumber });

        const companyCodes = [...new Set(products.map(data => data.clientCompany))];
        console.log("Company Codes:", companyCodes);

        const clients = await User.find({ role: "client", companyCode: { $in: companyCodes } });
        console.log("Clients to notify:", clients);

        const allTokens = [];

        for (let client of clients) {
            if (client.expoPushTokens && client.expoPushTokens.length > 0) {
                const activeTokens = client.expoPushTokens.map(tokenObj => tokenObj.token);
                allTokens.push(...activeTokens);
            }
        }

        if (allTokens.length > 0) {
            await sendPushNotificationToMultiple(
                allTokens,
                `Your items from Voyage ${voyage.voyageNumber} have been dispatched and are now on their way.`
            );
        }

        io.emit('voyage-data-updated', { voyageId, newProduct: products, updateType: 'export' });

        res.status(200).json({
            message: "Voyage closed successfully and notifications sent",
            voyage: voyage
        });

    } catch (error) {
        console.error("Error in closeVoyage controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const deleteVoyage = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId);

        if (!voyage) {
            return res.status(400).json({ message: "Voyage not found" });
        }

        await UploadedProduct.deleteMany({ voyageId: voyageId });

        await Voyage.findByIdAndDelete(voyageId);

        await PrintBatch.deleteMany({ voyageNumber: voyage.voyageNumber });
        await PrintedQr.deleteMany({ voyageNumber: voyage.voyageNumber });

        res.status(200).json({ message: "Voyage deleted successfully" });

    } catch (error) {
        console.error("Error in deleteVoyage controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteVoyageData = async (req, res) => {
    try {
        const { voyageId } = req.params;
        let { dataId } = req.params;

        dataId = dataId.trim();

        console.log("Deleting Voyage Data - Voyage ID:", voyageId, "Data ID:", dataId);

        const deletedProduct = await UploadedProduct.findOneAndDelete({
            _id: dataId,
            voyageId: voyageId
        });

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found or doesn't belong to this voyage" });
        }

        res.status(200).json({ message: "Voyage data deleted successfully", deletedProduct });
    } catch (error) {
        console.error("Error in deleteVoyageData controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getVoyageByCompany = async (req, res) => {
    try {
        const { companyCode, branchId } = req.params;

        const products = await UploadedProduct.find({ clientCompany: companyCode, branchId: branchId })
            .populate('voyageId', 'voyageName voyageNumber year')
            .sort({ uploadedDate: -1 });

        if (!products.length) {
            return res.status(404).json({ message: `No uploaded data found for company ${companyCode}` });
        }

        res.status(200).json({ companyCode, uploadedData: products });
    } catch (error) {
        console.error("Error in getVoyageByCompany controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPendingVoyages = async (req, res) => {
    try {
        const voyages = await Voyage.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .populate("createdBy", "username")
            .populate("uploadedProducts");

        for (let voyage of voyages) {
            await UploadedProduct.populate(voyage.uploadedProducts, {
                path: 'uploadedBy',
                select: 'username'
            });
        }

        res.status(200).json(voyages);
    } catch (error) {
        console.error("Error fetching pending voyages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCompaniesSummaryByVoyage = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId)
            .select("voyageName voyageNumber year status");

        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        if (voyage.status !== "pending") {
            return res.status(400).json({ message: "Voyage is not in pending status" });
        }

        const products = await UploadedProduct.find({
            voyageId: voyageId,
            status: "pending"
        });

        const companySummary = {};

        products.forEach(data => {
            const company = data.clientCompany;

            if (!companySummary[company]) {
                companySummary[company] = {
                    companyCode: company,
                    itemCount: 0,
                    totalWeight: 0,
                    latestUpload: data.uploadedDate
                };
            }

            companySummary[company].itemCount += 1;
            companySummary[company].totalWeight += Number(data.weight) || 0;

            if (new Date(data.uploadedDate) > new Date(companySummary[company].latestUpload)) {
                companySummary[company].latestUpload = data.uploadedDate;
            }
        });

        const companiesList = Object.values(companySummary)
            .map(company => ({
                ...company,
                totalWeight: Math.round(company.totalWeight * 100) / 100
            }))
            .sort((a, b) => a.companyCode.localeCompare(b.companyCode));

        const grandTotalWeight = Math.round(companiesList.reduce((total, company) => total + company.totalWeight, 0) * 100) / 100;
        const grandTotalItems = companiesList.reduce((total, company) => total + company.itemCount, 0);

        res.status(200).json({
            voyageInfo: {
                voyageId: voyage._id,
                voyageName: voyage.voyageName,
                voyageNumber: voyage.voyageNumber,
                year: voyage.year,
                status: voyage.status
            },
            companies: companiesList,
            summary: {
                totalCompanies: companiesList.length,
                grandTotalItems: grandTotalItems,
                grandTotalWeight: grandTotalWeight
            }
        });

    } catch (error) {
        console.error("Error in getCompaniesSummaryByVoyage controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getCompanyDetailsByVoyage = async (req, res) => {
    try {
        const { voyageId, companyCode } = req.params;
        const { status = "pending" } = req.query;

        if (status !== "pending" && status !== "completed") {
            return res.status(400).json({
                message: "Invalid status. Use 'pending' or 'completed'"
            });
        }

        const voyage = await Voyage.findById(voyageId)
            .select("voyageName voyageNumber year status");

        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        const query = {
            voyageId: voyageId,
            clientCompany: companyCode,
            status: status
        };

        const companyProducts = await UploadedProduct.find(query)
            .populate("uploadedBy", "username");

        const companyData = companyProducts.map(product => ({
            ...product.toObject(),
            voyageName: voyage.voyageName,
            voyageNumber: voyage.voyageNumber,
            voyageYear: voyage.year,
            voyageId: voyage._id,
            compositeCode: product.compositeCode
        }));

        const totalWeight = Math.round(companyData.reduce((total, item) => total + (item.weight || 0), 0) * 100) / 100;

        companyData.sort((a, b) => {
            const productCodeCompare = a.productCode.localeCompare(b.productCode);
            if (productCodeCompare !== 0) return productCodeCompare;

            const sequenceCompare = a.sequenceNumber - b.sequenceNumber;
            if (sequenceCompare !== 0) return sequenceCompare;

            return a.voyageNumber - b.voyageNumber;
        });

        res.status(200).json({
            voyageInfo: {
                voyageId: voyage._id,
                voyageName: voyage.voyageName,
                voyageNumber: voyage.voyageNumber,
                year: voyage.year,
                status: voyage.status
            },
            companyCode,
            status: status, // Include the status filter in response
            items: companyData,
            totalItems: companyData.length,
            totalWeight: totalWeight
        });

    } catch (error) {
        console.error("Error in getCompanyDetailsByVoyage controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllVoyageProducts = async (req, res) => {
    try {
        const { voyageId } = req.params;
        const { status } = req.query;

        const voyage = await Voyage.findById(voyageId);
        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        // Build query based on status parameter
        let productQuery = { voyageId: voyageId };

        if (status) {
            productQuery.status = status;
        }

        const products = await UploadedProduct.find(productQuery)
            .populate("uploadedBy", "username")
            .sort({
                productCode: 1,
                sequenceNumber: 1,
                voyageNumber: 1
            });

        const productData = products.map(product => ({
            _id: product._id,
            productCode: product.productCode,
            sequenceNumber: product.sequenceNumber,
            voyageNumber: product.voyageNumber,
            trackingNumber: product.trackingNumber,
            clientCompany: product.clientCompany,
            weight: product.weight,
            uploadedDate: product.uploadedDate,
            uploadedBy: product.uploadedBy,
            compositeCode: product.compositeCode,
            image: product.image,
            status: product.status
        }));

        const totalWeight = Math.round(productData.reduce((total, item) => total + (item.weight || 0), 0) * 100) / 100;

        res.status(200).json({
            voyageInfo: {
                voyageId: voyage._id,
                voyageName: voyage.voyageName,
                voyageNumber: voyage.voyageNumber,
                year: voyage.year,
                status: voyage.status
            },
            products: productData,
            totalItems: productData.length,
            totalWeight: totalWeight
        });

    } catch (error) {
        console.error("Error in getAllVoyageProducts controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Add this controller to your voyage controller file

export const getCompletedCompaniesSummaryByVoyage = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId)
            .select("voyageName voyageNumber year status");

        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        if (voyage.status !== "completed") {
            return res.status(400).json({ message: "Voyage is not completed yet" });
        }

        const products = await UploadedProduct.find({
            voyageId: voyageId,
            status: "completed"
        });

        const companySummary = {};

        products.forEach(data => {
            const company = data.clientCompany;

            if (!companySummary[company]) {
                companySummary[company] = {
                    companyCode: company,
                    itemCount: 0,
                    totalWeight: 0,
                    latestUpload: data.uploadedDate
                };
            }

            companySummary[company].itemCount += 1;
            companySummary[company].totalWeight += Number(data.weight) || 0;

            if (new Date(data.uploadedDate) > new Date(companySummary[company].latestUpload)) {
                companySummary[company].latestUpload = data.uploadedDate;
            }
        });

        const companiesList = Object.values(companySummary)
            .map(company => ({
                ...company,
                totalWeight: Math.round(company.totalWeight * 100) / 100
            }))
            .sort((a, b) => a.companyCode.localeCompare(b.companyCode));

        const grandTotalWeight = Math.round(companiesList.reduce((total, company) => total + company.totalWeight, 0) * 100) / 100;
        const grandTotalItems = companiesList.reduce((total, company) => total + company.itemCount, 0);

        res.status(200).json({
            voyageInfo: {
                voyageId: voyage._id,
                voyageName: voyage.voyageName,
                voyageNumber: voyage.voyageNumber,
                year: voyage.year,
                status: voyage.status
            },
            companies: companiesList,
            summary: {
                totalCompanies: companiesList.length,
                grandTotalItems: grandTotalItems,
                grandTotalWeight: grandTotalWeight
            }
        });

    } catch (error) {
        console.error("Error in getCompletedCompaniesSummaryByVoyage controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCompletedCompanyDetailsByVoyage = async (req, res) => {
    try {
        const { voyageId, companyCode } = req.params;

        const voyage = await Voyage.findById(voyageId)
            .select("voyageName voyageNumber year status");

        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        if (voyage.status !== "completed") {
            return res.status(400).json({ message: "Voyage is not completed yet" });
        }

        const companyProducts = await UploadedProduct.find({
            voyageId: voyageId,
            clientCompany: companyCode,
            status: "completed"
        })
            .populate("uploadedBy", "username");

        const companyData = companyProducts.map(product => ({
            ...product.toObject(),
            voyageName: voyage.voyageName,
            voyageNumber: voyage.voyageNumber,
            voyageYear: voyage.year,
            voyageId: voyage._id,
            compositeCode: product.compositeCode
        }));

        const totalWeight = Math.round(companyData.reduce((total, item) => total + (item.weight || 0), 0) * 100) / 100;

        companyData.sort((a, b) => {
            const productCodeCompare = a.productCode.localeCompare(b.productCode);
            if (productCodeCompare !== 0) return productCodeCompare;

            const sequenceCompare = a.sequenceNumber - b.sequenceNumber;
            if (sequenceCompare !== 0) return sequenceCompare;

            return a.voyageNumber - b.voyageNumber;
        });

        res.status(200).json({
            voyageInfo: {
                voyageId: voyage._id,
                voyageName: voyage.voyageName,
                voyageNumber: voyage.voyageNumber,
                year: voyage.year,
                status: voyage.status
            },
            companyCode,
            items: companyData,
            totalItems: companyData.length,
            totalWeight: totalWeight
        });

    } catch (error) {
        console.error("Error in getCompletedCompanyDetailsByVoyage controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Add this new controller function to your voyage controller file

export const getCompletedVoyagesByCompany = async (req, res) => {
    try {
        const { companyCode } = req.params;

        // Find all completed voyages that have products for this company
        const completedProducts = await UploadedProduct.find({
            clientCompany: companyCode,
            status: "completed"
        })
            .populate('voyageId', 'voyageName voyageNumber year exportedDate createdAt')
            .sort({ exportedDate: -1 });

        if (!completedProducts.length) {
            return res.status(404).json({
                message: `No completed voyages found for company ${companyCode}`
            });
        }

        // Group products by voyage
        const voyageMap = new Map();

        completedProducts.forEach(product => {
            const voyageId = product.voyageId._id.toString();

            if (!voyageMap.has(voyageId)) {
                voyageMap.set(voyageId, {
                    voyageId: product.voyageId._id,
                    voyageName: product.voyageId.voyageName,
                    voyageNumber: product.voyageId.voyageNumber,
                    year: product.voyageId.year,
                    exportedDate: product.exportedDate || product.voyageId.exportedDate,
                    createdDate: product.voyageId.createdAt,
                    totalItems: 0,
                    totalWeight: 0,
                    products: []
                });
            }

            const voyageData = voyageMap.get(voyageId);
            voyageData.totalItems += 1;
            voyageData.totalWeight += Number(product.weight) || 0;
            voyageData.products.push(product);
        });

        // Convert map to array and format the response
        const completedVoyages = Array.from(voyageMap.values()).map(voyage => ({
            voyageId: voyage.voyageId,
            voyageName: voyage.voyageName,
            voyageNumber: voyage.voyageNumber,
            year: voyage.year,
            exportedDate: voyage.exportedDate,
            createdDate: voyage.createdDate,
            totalItems: voyage.totalItems,
            totalWeight: Math.round(voyage.totalWeight * 100) / 100
        }));

        // Sort by exported date (most recent first)
        completedVoyages.sort((a, b) => new Date(b.exportedDate) - new Date(a.exportedDate));

        res.status(200).json({
            companyCode,
            completedVoyages,
            totalVoyages: completedVoyages.length,
            grandTotalItems: completedVoyages.reduce((sum, v) => sum + v.totalItems, 0),
            grandTotalWeight: Math.round(completedVoyages.reduce((sum, v) => sum + v.totalWeight, 0) * 100) / 100
        });

    } catch (error) {
        console.error("Error in getCompletedVoyagesByCompany controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCompletedVoyagesByCompanyAndBranch = async (req, res) => {
    try {
        const { companyCode, branchId } = req.params;

        // Find all completed voyages that have products for this company
        const completedProducts = await UploadedProduct.find({
            clientCompany: companyCode, branchId: branchId,
            status: "completed"
        })
            .populate('voyageId', 'voyageName voyageNumber year exportedDate createdAt')
            .sort({ exportedDate: -1 });

        if (!completedProducts.length) {
            return res.status(404).json({
                message: `No completed voyages found for company ${companyCode}`
            });
        }

        // Group products by voyage
        const voyageMap = new Map();

        completedProducts.forEach(product => {
            const voyageId = product.voyageId._id.toString();

            if (!voyageMap.has(voyageId)) {
                voyageMap.set(voyageId, {
                    voyageId: product.voyageId._id,
                    voyageName: product.voyageId.voyageName,
                    voyageNumber: product.voyageId.voyageNumber,
                    year: product.voyageId.year,
                    exportedDate: product.exportedDate || product.voyageId.exportedDate,
                    createdDate: product.voyageId.createdAt,
                    totalItems: 0,
                    totalWeight: 0,
                    products: []
                });
            }

            const voyageData = voyageMap.get(voyageId);
            voyageData.totalItems += 1;
            voyageData.totalWeight += Number(product.weight) || 0;
            voyageData.products.push(product);
        });

        // Convert map to array and format the response
        const completedVoyages = Array.from(voyageMap.values()).map(voyage => ({
            voyageId: voyage.voyageId,
            voyageName: voyage.voyageName,
            voyageNumber: voyage.voyageNumber,
            year: voyage.year,
            exportedDate: voyage.exportedDate,
            createdDate: voyage.createdDate,
            totalItems: voyage.totalItems,
            totalWeight: Math.round(voyage.totalWeight * 100) / 100
        }));

        // Sort by exported date (most recent first)
        completedVoyages.sort((a, b) => new Date(b.exportedDate) - new Date(a.exportedDate));

        res.status(200).json({
            companyCode,
            completedVoyages,
            totalVoyages: completedVoyages.length,
            grandTotalItems: completedVoyages.reduce((sum, v) => sum + v.totalItems, 0),
            grandTotalWeight: Math.round(completedVoyages.reduce((sum, v) => sum + v.totalWeight, 0) * 100) / 100
        });

    } catch (error) {
        console.error("Error in getCompletedVoyagesByCompany controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllPendingCompaniesSummary = async (req, res) => {
    try {

        const { branchId } = req.params;

        console.log(branchId);


        const pendingVoyages = await Voyage.find({ status: "pending", branchId: branchId })
            .select("_id voyageName voyageNumber year createdAt")
            .sort({ createdAt: -1 });

        if (!pendingVoyages.length) {
            return res.status(200).json({
                voyages: [],
                summary: {
                    totalVoyages: 0,
                    grandTotalItems: 0,
                    grandTotalWeight: 0
                }
            });
        }

        const voyageIds = pendingVoyages.map(voyage => voyage._id);

        // Find all products from pending voyages
        const products = await UploadedProduct.find({
            voyageId: { $in: voyageIds },
            status: "pending"
        });

        // Group products by voyage and calculate company summaries
        const voyageSummaries = await Promise.all(
            pendingVoyages.map(async (voyage) => {
                const voyageProducts = products.filter(p => p.voyageId.toString() === voyage._id.toString());

                const companySummary = {};

                voyageProducts.forEach(product => {
                    const company = product.clientCompany;

                    if (!companySummary[company]) {
                        companySummary[company] = {
                            companyCode: company,
                            itemCount: 0,
                            totalWeight: 0,
                            latestUpload: product.uploadedDate
                        };
                    }

                    companySummary[company].itemCount += 1;
                    companySummary[company].totalWeight += Number(product.weight) || 0;

                    if (new Date(product.uploadedDate) > new Date(companySummary[company].latestUpload)) {
                        companySummary[company].latestUpload = product.uploadedDate;
                    }
                });

                const companiesList = Object.values(companySummary)
                    .map(company => ({
                        ...company,
                        totalWeight: Math.round(company.totalWeight * 100) / 100
                    }))
                    .sort((a, b) => a.companyCode.localeCompare(b.companyCode));

                const grandTotalWeight = Math.round(companiesList.reduce((total, company) => total + company.totalWeight, 0) * 100) / 100;
                const grandTotalItems = companiesList.reduce((total, company) => total + company.itemCount, 0);

                return {
                    voyageInfo: {
                        voyageId: voyage._id,
                        voyageName: voyage.voyageName,
                        voyageNumber: voyage.voyageNumber,
                        year: voyage.year,
                        status: "pending"
                    },
                    companies: companiesList,
                    summary: {
                        totalCompanies: companiesList.length,
                        grandTotalItems: grandTotalItems,
                        grandTotalWeight: grandTotalWeight
                    }
                };
            })
        );

        // Calculate overall totals
        const overallTotalItems = voyageSummaries.reduce((sum, v) => sum + v.summary.grandTotalItems, 0);
        const overallTotalWeight = Math.round(voyageSummaries.reduce((sum, v) => sum + v.summary.grandTotalWeight, 0) * 100) / 100;

        res.status(200).json({
            voyages: voyageSummaries,
            summary: {
                totalVoyages: pendingVoyages.length,
                grandTotalItems: overallTotalItems,
                grandTotalWeight: overallTotalWeight
            }
        });

    } catch (error) {
        console.error("Error in getAllPendingCompaniesSummary controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};