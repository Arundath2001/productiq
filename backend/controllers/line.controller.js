import Line from "../models/line.model.js";

export const createLine = async (req, res) => {
    try {
        const { lineName, branchId } = req.body;

        if (!lineName) {
            return res.status(400).json({
                success: false,
                message: "Line name is a required field"
            });
        }

        const existingLine = await Line.findOne({ lineName }).lean();

        if (existingLine) {
            return res.status(400).json({
                success: false,
                message: "Line is already existing"
            });
        }

        const newLine = await Line({
            lineName,
            createdBy: req.user._id,
            branchId
        });

        await newLine.save();

        res.status(200).json({
            success: true,
            newLine,
            message: `${lineName} Line created successfully`
        })

    } catch (error) {
        console.log("Error in createLine controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLineByBranchId = async (req, res) => {
    try {
        const { branchId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || ""

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: "Branch ID is required to fetch Line"
            });
        }

        const filter = { branchId }

        if (searchQuery) {
            filter.lineName = { $regex: searchQuery, $options: 'i' }
        }

        const totalLines = await Line.countDocuments(filter);
        const totalPages = Math.ceil(totalLines / limit);

        const lines = await Line.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();

        res.status(200).json({
            success: false,
            message: "Lines fetched successfully",
            lines,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalLines,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        })

    } catch (error) {
        console.log("Error in getLineByBranchId controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteLineById = async (req, res) => {
    try {
        const { lineId } = req.params;

        if (!lineId) {
            return res.status(400).json({
                success: false,
                message: "Line ID is required to delete a data"
            });
        }

        const line = await Line.findById(lineId).lean();

        if (!line) {
            return res.status(400).json({
                success: false,
                message: "Line not found!"
            });
        }

        await Line.findByIdAndDelete(lineId);

        res.status(200).json({
            success: true,
            message: `${line.lineName} deleted successfully`
        });

    } catch (error) {
        console.log("Error in deleteLineById controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}