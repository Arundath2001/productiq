import Goni from "../models/Goni.model.js";

export const createGoni = async (req, res) => {
    try {
        const { goniName, companyId } = req.body;

        if (!goniName || !companyId) {
            return res.status(400).json({ message: "Goni Name and Company Code are required field!" });
        }

        const existingGoni = await Goni.findOne({ goniName });

        if (existingGoni) {
            return res.status(400).json({ message: "Goni already exists!" })
        }

        const newGoni = new Goni({
            goniName,
            companyId,
            createdBy: req.user._id
        });

        await newGoni.save();

        res.status(201).json({ message: "Goni created successfully", newGoni });

    } catch (error) {
        console.log("Error in createGoni controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getGoniDetails = async (req, res) => {
    try {
        const gonies = await Goni.find().populate('createdBy', 'username').populate('companyId', 'companyCode');

        res.status(200).json({ message: "Goni fetched successfully", gonies });
    } catch (error) {
        console.log("Error in getGoniDetails controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteGoni = async (req, res) => {
    try {
        const { goniId } = req.params;

        if (!goniId) {
            return res.status(400).json({ message: "Goni ID is required!" });
        }

        const goniDetails = await Goni.findById(goniId);

        if (!goniDetails) {
            return res.status(400).json({ message: "Goni does not exist!" })
        }

        await Goni.findByIdAndDelete(goniId);

        res.status(200).json({ message: "Goni deleted successfully" });


    } catch (error) {
        console.log("Error in deleteGoni controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}