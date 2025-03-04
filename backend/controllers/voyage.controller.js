import User from "../models/user.model.js";
import Voyage from "../models/voyage.model.js";
import axios from "axios";

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

        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        voyage.uploadedData.push({
            productCode,
            trackingNumber,
            clientCompany,
            image: imageUrl,
            uploadedBy : req.user._id,
            weight
        });

        await voyage.save();

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


export const exportVoyageData = async (req, res) => {
    try {
        const { voyageId } = req.params;

        const voyage = await Voyage.findById(voyageId);
        if (!voyage) {
            return res.status(404).json({ message: "Voyage not found" });
        }

        voyage.status = "completed";
        voyage.lastPrintedCounts = new Map();
        await voyage.save();

        const companyCodes = [...new Set(voyage.uploadedData.map(data => data.clientCompany))];

        console.log(companyCodes);
        

        const clients = await User.find({ role: "client", companyCode: { $in: companyCodes } });

        console.log(clients);
        

        const pushTokens = clients.map(client => client.expoPushToken).filter(token => token?.startsWith("ExponentPushToken"));

        if (pushTokens.length > 0) {
            const messages = pushTokens.map(token => ({
                to: token,
                sound: "default",
                title: "Voyage Completed",
                body: `Voyage ${voyage.voyageName} has been completed.`,
                data: { voyageId: voyage._id },
            }));

            try {
                await axios.post("https://exp.host/--/api/v2/push/send", messages, {
                    headers: { "Content-Type": "application/json" },
                });
                console.log("Push notifications sent successfully");
            } catch (notificationError) {
                console.error("Error sending push notifications:", notificationError.message);
            }
        }

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

        const voyages = await Voyage.find({ status: "completed" })
            .sort({ createdAt: -1 })
            .select("uploadedData");

        if (!voyages.length) {
            return res.status(404).json({ message: "No completed voyages found" });
        }

        const filteredData = voyages.flatMap(voyage => 
            voyage.uploadedData.filter(data => data.clientCompany === companyCode)
        );

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



