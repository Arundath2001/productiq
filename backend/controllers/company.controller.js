import Company from "../models/company.model.js";

// Create a new company
export const createCompany = async (req, res) => {
    try {
        const { companyCode } = req.body;
        const createdBy = req.user.id; // Assuming user ID comes from auth middleware

        // Validate required fields
        if (!companyCode) {
            return res.status(400).json({
                success: false,
                message: "Company code is required"
            });
        }

        // Check if company code already exists
        const existingCompany = await Company.findOne({ companyCode });
        if (existingCompany) {
            return res.status(409).json({
                success: false,
                message: "Company code already exists"
            });
        }

        // Create new company
        const newCompany = await Company.create({
            companyCode,
            createdBy
        });

        // Populate createdBy for consistent response
        await newCompany.populate('createdBy', 'username');

        res.status(201).json({
            success: true,
            message: "Company created successfully",
            data: {
                id: newCompany._id, // Transform _id to id
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

// Get all companies
export const getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find()
            .populate('createdBy', 'username')
            .select('companyCode createdBy createdAt updatedAt')
            .sort({ createdAt: -1 });

        // Transform _id to id for frontend consistency
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

// Update company
export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { companyCode } = req.body;

        console.log("Updating company with ID:", id, "New company code:", companyCode);
        
        // Validate ID parameter
        if (!id || id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: "Company ID is required"
            });
        }

        // Validate required fields
        if (!companyCode) {
            return res.status(400).json({
                success: false,
                message: "Company code is required"
            });
        }

        // Check if company exists
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        // Check if new company code already exists (if changed)
        if (company.companyCode !== companyCode) {
            const existingCompany = await Company.findOne({ 
                companyCode,
                _id: { $ne: id } // Exclude current company from check
            });
            if (existingCompany) {
                return res.status(409).json({
                    success: false,
                    message: "Company code already exists"
                });
            }
        }

        // Update company
        const updatedCompany = await Company.findByIdAndUpdate(
            id,
            { companyCode },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username');

        res.status(200).json({
            success: true,
            message: "Company updated successfully",
            data: {
                id: updatedCompany._id, // Transform _id to id
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

// Delete company
export const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID parameter
        if (!id || id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: "Company ID is required"
            });
        }

        // Check if company exists
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        // Delete company
        await Company.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Company deleted successfully",
            data: {
                id: company._id, // Transform _id to id
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