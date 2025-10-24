import SavedCode from "../models/savedCode.model.js";
import PrintedQr from "../models/printedQr.model.js";
import PrintBatch from "../models/printBatch.model.js";

export const saveProductCode = async (req, res) => {
    try {
        const { productCode, companyCode } = req.body;

        if (!companyCode) {
            return res.status(400).json({ message: "Company code is required" });
        }

        if (req.user.role !== 'employee') {
            return res.status(400).json({ message: "Only employee can add product code" });
        }

        const savedCode = await SavedCode.findOne({ productCode });
        if (savedCode) return res.status(400).json({ message: "Product code already exists" });

        const newSavedCode = new SavedCode({
            productCode,
            companyCode,
            savedBy: req.user.id
        });

        await newSavedCode.save();

        res.status(200).json(newSavedCode);
    } catch (error) {
        console.log("Error in saveProductCode controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getSavedProductCode = async (req, res) => {
    try {
        const savedCodes = await SavedCode.find({}).populate("savedBy", "username").sort({ productCode: 1 });

        if (!savedCodes.length) {
            return res.status(400).json({ message: "No saved product code found" })
        }

        const codesWithSummary = await Promise.all(savedCodes.map(async (code) => {
            const productCode = code.productCode;

            const voyageStatusCounts = await PrintedQr.aggregate([
                { $match: { productCode } },
                {
                    $group: {
                        _id: { status: "$printStatus", voyage: "$voyageNumber" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.voyage": 1 } }
            ]);

            const voyageSummaries = {};

            voyageStatusCounts.forEach(item => {
                const voyage = item._id.voyage;
                const status = item._id.status;

                if (!voyageSummaries[voyage]) {
                    voyageSummaries[voyage] = {
                        voyageNumber: voyage,
                        generated: 0,
                        printed: 0,
                        failed: 0
                    };
                }

                if (status === "generated") {
                    voyageSummaries[voyage].generated = item.count;
                } else if (status === "printed") {
                    voyageSummaries[voyage].printed = item.count;
                } else if (status === "failed") {
                    voyageSummaries[voyage].failed = item.count;
                }
            });

            return {
                ...code.toObject(),
                voyageSummaries: Object.values(voyageSummaries)
            };
        }));

        res.status(200).json(codesWithSummary);

    } catch (error) {
        console.log("Error in getSavedProductCode controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteSavedCode = async (req, res) => {
    try {
        const { codeId } = req.params;

        const savedCode = await SavedCode.findById(codeId);
        if (!savedCode) {
            return res.status(404).json({ message: "Saved product code not found" });
        }

        await SavedCode.findByIdAndDelete(codeId);
        res.status(200).json({ message: "Product code deleted successfully" });
    } catch (error) {
        console.log("Error in deleteSavedCode controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// v2 codes 

export const getSavedProductCodeV2 = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';
        const userBranchId = req.user.branchId._id;

        const filter = searchQuery ? { productCode: { $regex: searchQuery, $options: 'i' } } : {}

        const totalCount = await SavedCode.countDocuments(filter);

        if (totalCount === 0) {
            return res.status(404).json({
                message: 'No saved product codes found',
                data: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit
                }
            });
        }

        const savedCodes = await SavedCode.find(filter)
            .populate("savedBy", "username")
            .sort({ productCode: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const productsCodes = savedCodes.map((code) => code.productCode);

        const allVoyageSummaries = await PrintedQr.aggregate([
            {
                $match: {
                    productCode: { $in: productsCodes },
                    branchId: userBranchId
                }
            },
            {
                $group: {
                    _id: {
                        productCode: "$productCode",
                        status: "$printStatus",
                        voyage: "$voyageNumber",
                    },
                    count: { $sum: 1 },
                },

            },
            { $sort: { "_id:productCode": 1, "_id.voyage": 1 } }

        ]);

        const summariesByProductCode = {};

        allVoyageSummaries.forEach((item) => {
            const { productCode, voyage, status } = item._id;
            if (!summariesByProductCode[productCode]) summariesByProductCode[productCode] = {};
            if (!summariesByProductCode[productCode][voyage])
                summariesByProductCode[productCode][voyage] = {
                    voyageNumber: voyage,
                    generated: 0,
                    printed: 0,
                    failed: 0,
                };

            summariesByProductCode[productCode][voyage][status] = item.count;
        });

        const codesWithSummary = savedCodes.map((code) => ({
            ...code,
            voyageSummaries: summariesByProductCode[code.productCode]
                ? Object.values(summariesByProductCode[code.productCode])
                : [],
        }));

        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            success: true,
            data: codesWithSummary,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.log("Error in getSavedProductCodeV2 controller", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getCompanyCode = async (req, res) => {
    try {
        const productCode = decodeURIComponent(req.params.productCode);

        console.log(productCode);

        const baseProductCode = productCode.split('|')[0];

        if (!baseProductCode) {
            return res.status(400).json({
                success: false,
                message: "Invalid product code format"
            });
        }

        const savedCode = await SavedCode.findOne({
            productCode: { $regex: `^${baseProductCode}`, $options: 'i' }
        }).sort({ createdAt: -1 }).lean();

        if (!savedCode) {
            return res.status(404).json({
                success: false,
                message: "No company code found for this product code"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                companyCode: savedCode.companyCode,
                productCode: savedCode.productCode
            }
        });

    } catch (error) {
        console.error('Error fetching company code:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}