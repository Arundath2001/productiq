import SavedCode from "../models/savedCode.model.js";
import PrintedQr from "../models/printedQr.model.js";
import PrintBatch from "../models/printBatch.model.js";

export const saveProductCode = async (req, res) => {
    try {
        const {productCode} = req.body;

        if(req.user.role !== 'employee'){
            return res.status(400).json({message : "Only employee can add product code"});
        }

        const savedCode = await SavedCode.findOne({productCode});

        if(savedCode) return res.status(400).json({message : "Product code already exisits"});

        const newSavedCode = new SavedCode({
            productCode,
            savedBy: req.user.id
        });

        await newSavedCode.save();

        res.status(200).json(newSavedCode);

    } catch (error) {
        console.log("Error in saveProductCode controller", error.message);
        res.status(500).json({message: "Inernal server error"});
    }
}

export const getSavedProductCode = async (req, res) => {
    try {
        const savedCodes = await SavedCode.find({}).populate("savedBy", "username");

        if(!savedCodes.length){
            return res.status(400).json({message: "No saved product code found"})
        }

        res.status(200).json(savedCodes);

    } catch (error) {
        console.log("Error in getSavedProductCode controller", error.message);
        res.status(500).json({message: "Inernal server error"});
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

export const getFailedPrintsForSavedCode = async (req, res) => {
    try {
        const { productCode } = req.params;
        console.log(`[SAVED-CODE-FAILED] Retrieving failed prints for product code: ${productCode}`);
        
        const savedCode = await SavedCode.findOne({ productCode });
        if (!savedCode) {
            return res.status(404).json({ message: "Product code not found in saved codes" });
        }
        
        const failedPrints = await PrintedQr.find({ 
            productCode,
            printStatus: "failed"
        }).sort({ createdAt: -1 }).limit(100);
        
        console.log(`[SAVED-CODE-FAILED] Retrieved ${failedPrints.length} failed prints`);
        
        const failedByVoyage = {};
        failedPrints.forEach(print => {
            if (!failedByVoyage[print.voyageNumber]) {
                failedByVoyage[print.voyageNumber] = [];
            }
            failedByVoyage[print.voyageNumber].push(print);
        });
        
        res.status(200).json({
            message: "Failed prints retrieved successfully",
            productCode,
            count: failedPrints.length,
            voyageCount: Object.keys(failedByVoyage).length,
            failedByVoyage
        });
    } catch (error) {
        console.log("Error in getFailedPrintsForSavedCode controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPrintStatusSummaryForSavedCode = async (req, res) => {
    try {
        const { productCode } = req.params;
        console.log(`[SAVED-CODE-SUMMARY] Retrieving print status summary for: ${productCode}`);
        
        const savedCode = await SavedCode.findOne({ productCode });
        if (!savedCode) {
            return res.status(404).json({ message: "Product code not found in saved codes" });
        }
        
        const voyageStatusCounts = await PrintedQr.aggregate([
            { $match: { productCode } },
            { 
                $group: { 
                    _id: { status: "$printStatus", voyage: "$voyageNumber" },
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { "_id.voyage": 1, "_id.status": 1 } }
        ]);
        
        const batchSummary = await PrintBatch.find({ productCode })
            .select('batchNumber voyageNumber printStatus createdAt')
            .sort({ createdAt: -1 })
            .limit(20);
        
        const voyageSummaries = {};
        
        voyageStatusCounts.forEach(item => {
            const voyage = item._id.voyage;
            const status = item._id.status;
            
            if (!voyageSummaries[voyage]) {
                voyageSummaries[voyage] = {
                    voyageNumber: voyage,
                    statusCounts: {},
                    totalPrints: 0,
                    batches: []
                };
            }
            
            voyageSummaries[voyage].statusCounts[status] = item.count;
            voyageSummaries[voyage].totalPrints += item.count;
        });
        
        batchSummary.forEach(batch => {
            const voyage = batch.voyageNumber;
            
            if (!voyageSummaries[voyage]) {
                voyageSummaries[voyage] = {
                    voyageNumber: voyage,
                    statusCounts: {},
                    totalPrints: 0,
                    batches: []
                };
            }
            
            if (voyageSummaries[voyage].batches.length < 5) {
                voyageSummaries[voyage].batches.push({
                    batchId: batch._id,
                    batchNumber: batch.batchNumber,
                    status: batch.printStatus,
                    createdAt: batch.createdAt
                });
            }
        });
        
        const overallTotals = {
            totalVoyages: Object.keys(voyageSummaries).length,
            totalPrints: 0,
            totalByStatus: {}
        };
        
        Object.values(voyageSummaries).forEach(voyage => {
            overallTotals.totalPrints += voyage.totalPrints;
            
            Object.entries(voyage.statusCounts).forEach(([status, count]) => {
                if (!overallTotals.totalByStatus[status]) {
                    overallTotals.totalByStatus[status] = 0;
                }
                overallTotals.totalByStatus[status] += count;
            });
        });
        
        console.log(`[SAVED-CODE-SUMMARY] Retrieved summary for ${productCode} across ${overallTotals.totalVoyages} voyages`);
        
        res.status(200).json({
            message: "Print status summary retrieved successfully",
            productCode,
            overallTotals,
            voyageSummaries: Object.values(voyageSummaries)
        });
    } catch (error) {
        console.log("Error in getPrintStatusSummaryForSavedCode controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
