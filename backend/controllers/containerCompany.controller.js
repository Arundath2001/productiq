import ContainerCompany from "../models/containerCompany.model.js";

export const createContainerCompany = async (req, res) => {
    try {
        const { containerCompanyName, lineId, branchId } = req.body;

        if (!containerCompanyName) {
            return res.status(400).json({
                success: false,
                message: "container-company name is a required field"
            });
        }

        if (!lineId) {
            return res.status(400).json({
                success: false,
                message: "line ID name is a required field"
            });
        }

        const existingContainerCompany = await ContainerCompany.findOne({ containerCompanyName }).lean();

        if (existingContainerCompany) {
            return res.status(400).json({
                success: false,
                message: `Container company with ${containerCompanyName} already exist`
            });
        }

        const newContainerCompany = new ContainerCompany({
            containerCompanyName,
            createdBy: req.user._id,
            lineId,
            branchId
        });

        await newContainerCompany.save();

        res.status(200).json({
            success: true,
            newContainerCompany,
            message: "Container company created successfully"
        });

    } catch (error) {
        console.log("Error in createContainerCompany controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getcontainerCompanyByBranchId = async (req, res) => {
    try {
        const { branchId, lineId } = req.params;

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

        console.log(lineId, "mmmm");


        const filter = { branchId, lineId }

        if (searchQuery) {
            filter.containerCompanyName = { $regex: searchQuery, $options: 'i' }
        }

        const totalContainerCompanies = await ContainerCompany.countDocuments(filter);
        const totalPages = Math.ceil(totalContainerCompanies / limit);

        const containerCompanies = await ContainerCompany.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();

        res.status(200).json({
            success: true,
            message: "Container-companies fetched successfully",
            containerCompanies,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalContainerCompanies,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        console.log("Error in getcontainerCompanyByBranchId controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteContainerCompanyById = async (req, res) => {
    try {
        const { containerCompanyId } = req.params;

        if (!containerCompanyId) {
            return res.status(400).json({
                success: false,
                message: "Container-company ID is required to delete a data"
            });
        }

        const containerCompany = await ContainerCompany.findById(containerCompanyId).lean();

        if (!containerCompany) {
            return res.status(400).json({
                success: false,
                message: "Container-company not found!"
            });
        }

        await ContainerCompany.findByIdAndDelete(containerCompanyId);

        res.status(200).json({
            success: true,
            message: `${containerCompany.containerCompanyName} deleted successfully`
        });

    } catch (error) {
        console.log("Error in deleteContainerCompanyById controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}