import Company from "../models/company.model.js";

export const createCompany = async (req, res) => {
    try {
        const { companyCode } = req.body;
        const createdBy = req.user.id;

        if (!companyCode) {
            return res.status(400).json({
                success: false,
                message: "Company code is required"
            });
        }

        const existingCompany = await Company.findOne({ companyCode });
        if (existingCompany) {
            return res.status(409).json({
                success: false,
                message: "Company code already exists"
            });
        }

        const newCompany = await Company.create({
            companyCode,
            createdBy
        });

        await newCompany.populate('createdBy', 'username');

        res.status(201).json({
            success: true,
            message: "Company created successfully",
            data: {
                id: newCompany._id,
                companyCode: newCompany.companyCode,
                createdBy: newCompany.createdBy,
                createdAt: newCompany.createdAt,
                updatedAt: newCompany.updatedAt
            }
        });

    } catch (error) {
        console.error("Error creating company:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find()
            .populate('createdBy', 'username')
            .select('companyCode createdBy createdAt updatedAt')
            .sort({ createdAt: -1 });

        const transformedCompanies = companies.map(company => ({
            id: company._id,
            companyCode: company.companyCode,
            createdBy: company.createdBy,
            createdAt: company.createdAt,
            updatedAt: company.updatedAt
        }));

        res.status(200).json({
            success: true,
            message: "Companies retrieved successfully",
            data: transformedCompanies,
            count: transformedCompanies.length
        });

    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyCode } = req.body;

        console.log("Updating company with ID:", id, "New company code:", companyCode);

        if (!id || id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: "Company ID is required"
            });
        }

        if (!companyCode) {
            return res.status(400).json({
                success: false,
                message: "Company code is required"
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        if (company.companyCode !== companyCode) {
            const existingCompany = await Company.findOne({
                companyCode,
                _id: { $ne: id }
            });
            if (existingCompany) {
                return res.status(409).json({
                    success: false,
                    message: "Company code already exists"
                });
            }
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            id,
            { companyCode },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username');

        res.status(200).json({
            success: true,
            message: "Company updated successfully",
            data: {
                id: updatedCompany._id,
                companyCode: updatedCompany.companyCode,
                createdBy: updatedCompany.createdBy,
                createdAt: updatedCompany.createdAt,
                updatedAt: updatedCompany.updatedAt
            }
        });

    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: "Company ID is required"
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        await Company.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Company deleted successfully",
            data: {
                id: company._id,
                companyCode: company.companyCode
            }
        });

    } catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};