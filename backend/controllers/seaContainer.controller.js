import SeaContainer from "../models/seaContainer.model.js";

export const createSeaContainer = async (req, res) => {
    try {
        const { containerNumber, seaVoyageId, branchId } = req.body;

        if (!containerNumber || containerNumber.trim() === '') {
            return res.status(404).json({
                success: false,
                message: "Container number is required"
            });
        }

        if (!seaVoyageId && !branchId) {
            return res.status(404).json({
                success: false,
                message: "Sea voyage ID and branch ID is required"
            });
        }

        const newSeaContainer = new SeaContainer({
            containerNumber,
            seaVoyageId,
            branchId,
            createdBy: req.user._id
        });

        await newSeaContainer.save();

        res.status(201).json({
            success: true,
            message: "Sea container created successfully",
            data: newSeaContainer
        });

    } catch (error) {
        console.log("Error in createSeaContainer controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getSeaContainerByBranchAndVoyage = async (req, res) => {
    try {
        const { branchId, seaVoyageId } = req.params;
        const { status } = req.query;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || "";

        if (!branchId && !seaVoyageId) {
            return res.status(404).json({
                success: false,
                message: "Sea and voyage ID are required"
            });
        }

        const filter = { branchId, seaVoyageId };

        if (status) {
            filter.status = status;
        }

        if (searchQuery) {
            filter.containerNumber = { $regex: searchQuery, $options: 'i' }
        }

        const totalSeaContainers = await SeaContainer(filter);
        const totalPages = Math.ceil(totalSeaContainers / limit);

        const seaContainers = await SeaContainer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

        res.status(200).json({
            success: true,
            message: "Sea containers fetched successfully",
            seaContainers,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalSeaContainers,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.log("Error in createSeaContainer controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteSeaContainer = async (req, res) => {
    try {
        const { containerId } = req.params;

        if (!containerId) {
            return res.status(400).json({
                success: false,
                message: "Container ID is required"
            });
        }

        const seaContainer = await SeaContainer.findById(containerId).lean();

        if (!seaContainer) {
            return res.status(400).json({
                success: false,
                message: "Container does not exisit"
            });
        }

        await SeaContainer.findByIdAndDelete(containerId);

        res.status(200).json({
            success: true,
            message: "Container deleted successfully"
        })

    } catch (error) {
        console.log("Error in deleteSeaContainer controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}