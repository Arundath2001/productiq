import SeaVoyage from "../models/seaVoyage.model.js";

export const createSeaVoyage = async (req, res) => {
    try {
        const { seaVoyageName, seaVoyageNumber, branchId, year, lineId } = req.body;

        if (!seaVoyageName || seaVoyageName.trim() === "") {
            return res.status(404).json({
                success: false,
                message: "Sea voyage name is required"
            });
        }

        if (!seaVoyageNumber || seaVoyageNumber.trim() === "") {
            return res.status(404).json({
                success: false,
                message: "Sea voyage number is required"
            });
        }

        if (!branchId) {
            return res.status(404).json({
                success: false,
                message: "Branch Id is missing"
            });
        }

        const existingSeaVoyage = await SeaVoyage.findOne({ seaVoyageNumber }).lean();

        if (existingSeaVoyage) {
            return res.status(400).json({
                success: false,
                message: `Sea voyage ${seaVoyageNumber} already exist!`
            });
        }

        const newSeaVoyage = new SeaVoyage({
            seaVoyageName,
            seaVoyageNumber,
            branchId,
            lineId,
            year,
            createdBy: req.user.id,
        });

        await newSeaVoyage.save();

        res.status(201).json({
            success: true,
            data: newSeaVoyage,
            message: "Sea voyage created successfully"
        });

    } catch (error) {
        console.log("Error in create sea voyage controller", error.message);
        res.status(500).json({ message: "Inernal server error" });
    }
}

export const getSeaVoyagesByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;
        const status = req.query.status;

        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || "";


        if (!branchId) {
            return res.status(404).json({
                success: false,
                message: "Branch ID is required"
            });
        }

        const filter = { branchId };

        if (status) {
            filter.status = status;
        }

        if (searchQuery) {
            filter.$or = [
                { seaVoyageNumber: { $regex: searchQuery, $options: 'i' } },
                { seaVoyageName: { $regex: searchQuery, $options: "i" } }
            ];
        }

        const totalSeaVoyages = await SeaVoyage.countDocuments(filter);
        const totalPages = Math.ceil(totalSeaVoyages / limit);

        const seaVoyages = await SeaVoyage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('lineId', 'lineName').lean();

        res.status(200).json({
            success: true,
            message: "Sea voyages fetched successfully",
            seaVoyages,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalSeaVoyages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.log("Error in getSeaVoyagesByBranchId controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteSeaVoyage = async (req, res) => {
    try {
        const { seaVoyageId } = req.params;

        if (!seaVoyageId) {
            return res.status(400).json({
                success: false,
                message: "Failed to delete missing Sea voyage ID!"
            });
        }

        const seaVoyage = await SeaVoyage.findById(seaVoyageId).lean();

        if (!seaVoyage) {
            return res.status(404).json({
                success: false,
                message: "Sea voyage not found"
            });
        }

        await SeaVoyage.findByIdAndDelete(seaVoyageId);


        res.status(200).json({
            success: true,
            message: "Sea voyage deleted successfully"
        });


    } catch (error) {
        console.log("Error in deleteSeaVoyage controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}