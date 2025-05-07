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
        const savedCodes = await SavedCode.find({}).populate("savedBy", "username");

        if(!savedCodes.length){
            return res.status(400).json({message: "No saved product code found"})
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
        res.status(500).json({message: "Internal server error"});
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

