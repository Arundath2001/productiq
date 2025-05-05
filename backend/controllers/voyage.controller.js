import User from "../models/user.model.js";
import Voyage from "../models/voyage.model.js";
import PrintBatch from "../models/printBatch.model.js";
import PrintedQr from "../models/printedQr.model.js";
import axios from "axios";
import { Expo } from 'expo-server-sdk';
import { io } from "../lib/socket.js";

export const createVoyage = async (req, res) => {
    try {
        const {voyageName, voyageNumber, year} = req.body;

        if(req.user.role !== 'admin'){
            return res.status(400).json({message : "Only admin can create voyages"})            
        }

        const exisitngVoyage = await Voyage.findOne({voyageNumber});

        if(exisitngVoyage) return res.status(400).json({message : "Voyage number already exisits"})

        const newVoyage = new Voyage({
            voyageName,
            voyageNumber,
            year,
            createdBy: req.user.id
        })

        await newVoyage.save();

        res.status(200).json(newVoyage);

    } catch (error) {
        console.log("Error in create voyage controller", error.message);
        res.status(500).json({message: "Inernal server error"});
    }
}

export const uploadVoyage = async (req, res) => {
    try {
        const {voyageNumber} = req.params;
        const {productCode, trackingNumber, clientCompany, weight} = req.body

        console.log(req.body, req.file);
        

        if(!productCode || !trackingNumber || !clientCompany || !req.file || !weight){
            return res.status(400).json({message : "All fields are required"});
        }
        
        const voyage = await Voyage.findOne({ voyageNumber: String(voyageNumber) });
        if(!voyage){
            return res.status(400).json({message : "Voyage not found"})
        }

        if(req.user.role !== 'employee'){
            return res.status(400).json({message : "Only employee can upload voyage data"});
        }

        const isProductCodeExists = voyage.uploadedData.some(data => data.productCode === productCode);
        if (isProductCodeExists) {
            return res.status(400).json({ message: "Product code already exists in this voyage" });
        }

        const imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
        voyage.uploadedData.push({
            productCode,
            trackingNumber,
            clientCompany,
            image: imageUrl,
            uploadedBy : req.user._id,
            weight
        });

        await voyage.save();

        io.emit("voyage-data-updated", {
            voyageNumber,
            newProduct: {
                productCode,
                trackingNumber,
                clientCompany,
                image: imageUrl,
                uploadedBy: req.user._id,
                weight
            },
            updateType: 'upload'
        });        

        const clientUsers = await User.find({ role: 'client', companyCode: clientCompany });
        for (let client of clientUsers) {
            if (client.expoPushToken) {
                await sendPushNotification(client.expoPushToken, `A new item with product code ${productCode} has been received.`);
            }
        }

        res.status(200).json({voyage});

    } catch (error) {
        console.log("Error in upload voyage controller", error.message);
        res.status(500).json({message : "Internal server error"});
    }
}

export const getVoyage = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId)
            .populate("createdBy", "username") 
            .populate("uploadedData.uploadedBy", "username");

        if (!voyage) {
            return res.status(400).json({ message: "Voyage not found" });
        }

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

        res.status(200).json({voyageNumbers});

    } catch (error) {
        console.log("Error in voyageNumber controller", error.message);
        res.status(500).json({message : "Inernal server error"});
    }
}

export const getProductDetails = async (req, res) => {
    try {
        const { productCode } = req.params;

        console.log("Searching for productCode:", productCode);

        const voyages = await Voyage.find(
            {
                "uploadedData.productCode": { $regex: `^${productCode}`, $options: "i" },
                status: { $ne: "completed" } 
            },
            { "uploadedData": 1 } 
        ).populate("uploadedData.uploadedBy", "username").sort({ "uploadedData.createdAt": -1 });;

        if (!voyages.length) {
            return res.status(200).json([]);
        }
        

        const productDetails = voyages.flatMap(voyage =>
            voyage.uploadedData.filter(data => data.productCode.startsWith(productCode))
        );

        res.status(200).json(productDetails);

    } catch (error) {
        console.error("Error fetching product details:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getVoyages = async (req, res) => {
    try {
        const voyages = await Voyage.find({ status: "pending" }).sort({ createdAt: -1 });;

        res.status(200).json(voyages);
        
    } catch (error) {
        console.error("Error fetching getVoyages details:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const getCompletedVoyages = async (req, res) => {
    try {
        const voyages = await Voyage.find({ status: "completed" }).sort({ createdAt: -1 });;

        return res.status(200).json(voyages);
        
    } catch (error) {
        console.error("Error fetching getCompletedVoyages details:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

const sendPushNotification = async (expoPushToken, message) => {
    let expo = new Expo();

    const messages = [{
        to: expoPushToken,
        sound: 'default',
        title: 'Aswaq Forwarder',
        body: message,
        data: { withSome: 'data' },
    }];

    try {
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log('Push notification sent successfully');
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};


export const exportVoyageData = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId);
        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        const now = new Date();

        voyage.status = "completed";
        voyage.lastPrintedCounts = new Map();

        voyage.uploadedData = voyage.uploadedData.map(item => ({
            ...item.toObject(),
            status: "completed",
            exportedDate: now
        }));

        await voyage.save();

        await PrintBatch.deleteMany({ voyageNumber: voyage.voyageNumber });

        await PrintedQr.deleteMany({ voyageNumber: voyage.voyageNumber });

        const companyCodes = [...new Set(voyage.uploadedData.map(data => data.clientCompany))];
        console.log("Company Codes:", companyCodes);

        const clients = await User.find({ role: "client", companyCode: { $in: companyCodes } });
        console.log("Clients to notify:", clients);

        for (let client of clients) {
            if (client.expoPushToken) {
                await sendPushNotification(client.expoPushToken, `Your items from Voyage ${voyage.voyageNumber} have been dispatched and are now on their way.`);
            }
        }

        io.emit('voyage-data-updated', { voyageId, newProduct: voyage.uploadedData, updateType: 'export' });

        res.status(200).json({ message: "Voyage exported successfully and notifications sent" });

    } catch (error) {
        console.error("Error in exportVoyageData controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const deleteVoyage = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId);

        if(!voyage){
            return res.json(400).json({message : "Voyage not found"});
        }

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

        const voyage = await Voyage.findByIdAndUpdate(
            voyageId,
            { $pull: { uploadedData: { _id: dataId } } },
            { new: true }
        );

        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found or data ID does not exist" });
        }

        res.status(200).json({ message: "Voyage data deleted successfully", voyage });
    } catch (error) {
        console.error("Error in deleteVoyageData controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getVoyageByCompany = async (req, res) => {
    try {
        const { companyCode } = req.params;

        const voyages = await Voyage.find({})
            .sort({ createdAt: -1 })
            .select("uploadedData");

        if (!voyages.length) {
            return res.status(404).json({ message: "No completed voyages found" });
        }

        const filteredData = voyages.flatMap(voyage =>
            voyage.uploadedData
                .filter(data => data.clientCompany === companyCode)
        )
        .sort((a, b) => new Date(b.uploadedDate) - new Date(a.uploadedDate));
        

        if (!filteredData.length) {
            return res.status(404).json({ message: `No uploaded data found for company ${companyCode}` });
        }

        res.status(200).json({ companyCode, uploadedData: filteredData });
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
            .populate("uploadedData.uploadedBy", "username"); 

        res.status(200).json(voyages);
    } catch (error) {
        console.error("Error fetching pending voyages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};



