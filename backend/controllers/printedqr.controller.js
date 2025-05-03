import Voyage from "../models/voyage.model.js";
import PrintedQr from "../models/printedQr.model.js";
import { imageSync } from "qr-image";
import PrintBatch from "../models/printBatch.model.js"
import mongoose from "mongoose";


export const generatePrintedQrBatch = async (req, res) => {
    try {
      const { productCode, voyageNumber, quantity } = req.body;
      console.log("Received batch request:", req.body);
  
      if (!productCode || !voyageNumber || !quantity) {
        console.error("Validation failed: Missing fields");
        return res.status(400).json({ message: "All fields are required" });
      }
  
      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
  
      const voyage = await Voyage.findOne({ voyageNumber });
      if (!voyage) {
        console.error(`Voyage not found for voyageNumber: ${voyageNumber}`);
        return res.status(400).json({ message: "Voyage not found" });
      }
  
      // Generate a unique batch number
      const batchNumber = `${voyageNumber}-${productCode}-${Date.now()}`;
      
      let lastCount = voyage.lastPrintedCounts.get(productCode) || 0;
      console.log(`Initial lastCount for ${productCode}:`, lastCount);
  
      let qrList = [];
      let qrIds = [];
      
      // Start a transaction
      const session = await mongoose.startSession();
      let batchId;
      
      try {
        await session.withTransaction(async () => {
          // Create a new batch
          const newBatch = new PrintBatch({
            batchNumber,
            productCode,
            voyageNumber,
            printedBy: req.user.id,
            printStatus: "generated",
            qrCodes: []
          });
          
          await newBatch.save({ session });
          batchId = newBatch._id;
          
          // Generate QR codes
          for (let i = 0; i < qty; i++) {
            lastCount++;
            const sequenceNumber = lastCount.toString().padStart(2, "0");
            const qrData = `${productCode}|${sequenceNumber}|${voyageNumber}`;
            
            const qr_svg = imageSync(qrData, { type: "png" });
            const qrImage = `data:image/png;base64,${qr_svg.toString("base64")}`;
  
            const printedQr = new PrintedQr({
              productCode,
              voyageNumber,
              quantity: lastCount,
              printedBy: req.user.id,
              qrImage,
              printStatus: "generated",
              batchId: newBatch._id // Link to batch
            });
  
            await printedQr.save({ session });
            
            // Add QR ID to batch
            newBatch.qrCodes.push(printedQr._id);
            qrIds.push(printedQr._id);
            
            qrList.push({
              id: printedQr._id,
              productCode,
              sequenceNumber,
              voyageNumber,
              qrImage,
              printStatus: "generated"
            });
          }
          
          // Save batch with QR IDs
          await newBatch.save({ session });
          
          // Update voyage's last printed count
          voyage.lastPrintedCounts.set(productCode, lastCount);
          await voyage.save({ session });
        });
        
        await session.endSession();
        
        res.status(200).json({
          message: "QR batch generated successfully",
          batchId,
          batchNumber,
          qrCount: qrList.length,
          qrList
        });
        
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        console.error("Error in batch generation:", error);
        
        res.status(500).json({ message: "Failed to generate QR batch" });
      }
    } catch (error) {
      console.error("Error in generatePrintedQrBatch controller:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Update print status for a batch or individual QR codes
  export const updatePrintStatus = async (req, res) => {
    try {
      const { batchId, qrIds, status } = req.body;
      
      if ((!batchId && !qrIds) || !status) {
        return res.status(400).json({ message: "Either batchId or qrIds, and status are required" });
      }
      
      if (!["printed", "failed"].includes(status)) {
        return res.status(400).json({ message: "Status must be either 'printed' or 'failed'" });
      }
      
      // Start a transaction
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // If updating entire batch
          if (batchId) {
            const batch = await PrintBatch.findById(batchId).session(session);
            if (!batch) {
              throw new Error("Batch not found");
            }
            
            // Update batch status
            batch.printStatus = status;
            await batch.save({ session });
            
            // Update all QR codes in the batch
            await PrintedQr.updateMany(
              { _id: { $in: batch.qrCodes } },
              { 
                $set: { printStatus: status },
                $inc: { printAttempts: 1 },
                $currentDate: { lastPrintAttempt: true }
              },
              { session }
            );
            
            res.status(200).json({
              message: `Print status updated to ${status} for batch ${batch.batchNumber}`,
              updatedCount: batch.qrCodes.length
            });
          } 
          // If updating individual QR codes
          else if (qrIds && Array.isArray(qrIds)) {
            // Update the status of specific QR codes
            const updateResult = await PrintedQr.updateMany(
              { _id: { $in: qrIds } },
              { 
                $set: { printStatus: status },
                $inc: { printAttempts: 1 },
                $currentDate: { lastPrintAttempt: true }
              },
              { session }
            );
            
            // Check if these QR codes belong to any batch
            const qrCodes = await PrintedQr.find({ _id: { $in: qrIds } }).session(session);
            const batchIds = [...new Set(qrCodes.map(qr => qr.batchId).filter(id => id))];
            
            // Update batch statuses if necessary
            for (const bId of batchIds) {
              const batch = await PrintBatch.findById(bId).session(session);
              if (batch) {
                // Get count of QR codes in this batch with each status
                const batchQrCounts = await PrintedQr.aggregate([
                  { $match: { batchId: mongoose.Types.ObjectId(bId) } },
                  { $group: { _id: "$printStatus", count: { $sum: 1 } } }
                ]).session(session);
                
                // Determine new batch status
                const statusCounts = Object.fromEntries(
                  batchQrCounts.map(item => [item._id, item.count])
                );
                
                const totalQrs = batch.qrCodes.length;
                const printedCount = statusCounts.printed || 0;
                const failedCount = statusCounts.failed || 0;
                
                let newBatchStatus;
                if (printedCount === totalQrs) {
                  newBatchStatus = "printed";
                } else if (failedCount === totalQrs) {
                  newBatchStatus = "failed";
                } else if (printedCount > 0 || failedCount > 0) {
                  newBatchStatus = "partially_printed";
                } else {
                  newBatchStatus = "generated";
                }
                
                batch.printStatus = newBatchStatus;
                await batch.save({ session });
              }
            }
            
            res.status(200).json({
              message: `Print status updated to ${status}`,
              updatedCount: updateResult.modifiedCount,
              updatedBatches: batchIds.length
            });
          }
        });
        
        await session.endSession();
      } catch (error) {
        await session.abortTransaction();
        await session.endSession();
        console.error("Error updating print status:", error);
        
        res.status(500).json({ message: "Failed to update print status" });
      }
    } catch (error) {
      console.error("Error in updatePrintStatus controller:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Get all batches with filters
  export const getBatches = async (req, res) => {
    try {
      const { voyageNumber, productCode, status } = req.query;
      
      const query = {};
      if (voyageNumber) query.voyageNumber = voyageNumber;
      if (productCode) query.productCode = productCode;
      if (status) query.printStatus = status;
      
      const batches = await PrintBatch.find(query)
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.status(200).json({
        message: "Batches retrieved successfully",
        count: batches.length,
        batches
      });
    } catch (error) {
      console.error("Error in getBatches controller:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Get a specific batch with its QR codes
  export const getBatchWithQRs = async (req, res) => {
    try {
      const { batchId } = req.params;
      
      const batch = await PrintBatch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      const qrCodes = await PrintedQr.find({ _id: { $in: batch.qrCodes } });

      console.log(qrCodes);
      
      
      res.status(200).json({
        message: "Batch retrieved successfully",
        batch,
        qrCodes
      });
    } catch (error) {
      console.error("Error in getBatchWithQRs controller:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Get failed QR codes (can filter by batch)
  export const getFailedPrints = async (req, res) => {
    try {
      const { voyageNumber, productCode, batchId } = req.query;
      
      const query = { printStatus: "failed" };
      if (voyageNumber) query.voyageNumber = voyageNumber;
      if (productCode) query.productCode = productCode;
      if (batchId) query.batchId = batchId;
      
      const failedPrints = await PrintedQr.find(query)
        .sort({ createdAt: -1 })
        .limit(100);
      
      res.status(200).json({
        message: "Failed prints retrieved successfully",
        count: failedPrints.length,
        failedPrints
      });
    } catch (error) {
      console.error("Error in getFailedPrints controller:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // Add this new controller function to your existing controller file

  export const getBatchesByProductCode = async (req, res) => {
    try {
      const { productCode } = req.params;
      
      if (!productCode) {
        return res.status(400).json({ message: "Product code is required" });
      }
      
      // First get all batches for the product code
      const batches = await PrintBatch.find({ productCode })
        .sort({ createdAt: -1 });
      
      // Get all related QR codes in one query
      const batchIds = batches.map(batch => batch._id);
      const qrCodes = await PrintedQr.find({
        batchId: { $in: batchIds }
      }).sort({ createdAt: 1 }); // Sort by creation time to ensure proper order
      
      // Create lookup map for quick QR access
      const qrCodesByBatchId = {};
      qrCodes.forEach(qr => {
        if (!qrCodesByBatchId[qr.batchId]) {
          qrCodesByBatchId[qr.batchId] = [];
        }
        qrCodesByBatchId[qr.batchId].push(qr);
      });
      
      // Group by voyage and categorize by status
      const voyageGroups = {};
      
      batches.forEach(batch => {
        if (!voyageGroups[batch.voyageNumber]) {
          voyageGroups[batch.voyageNumber] = {
            voyageNumber: batch.voyageNumber,
            generated: [],
            printed: [],
            failed: [] // Will include both failed and partially_printed
          };
        }
        
        // Get QR codes for this batch
        const batchQrCodes = qrCodesByBatchId[batch._id] || [];
        
        // Get first and last QR in the batch (if any exist)
        let qrCodeRange = "No QR codes";
        if (batchQrCodes.length > 0) {
          // Sort QR codes by creation date to ensure proper sequence
          const sortedQrCodes = [...batchQrCodes].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          const firstQr = sortedQrCodes[0];
          const lastQr = sortedQrCodes[sortedQrCodes.length - 1];
          
          // Only display the quantity numbers as the range
          qrCodeRange = `${firstQr.quantity} to ${lastQr.quantity}`;
        }
        
        // Create batch data with QR summaries
        const batchData = {
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          createdAt: batch.createdAt,
          printStatus: batch.printStatus,
          totalQrCodes: batch.qrCodes.length,
          printedCount: batchQrCodes.filter(qr => qr.printStatus === 'printed').length,
          failedCount: batchQrCodes.filter(qr => qr.printStatus === 'failed').length,
          qrCodeRange: qrCodeRange // Simplified QR code range
        };
        
        // Add batch to appropriate category
        if (batch.printStatus === 'generated') {
          voyageGroups[batch.voyageNumber].generated.push(batchData);
        } else if (batch.printStatus === 'printed') {
          voyageGroups[batch.voyageNumber].printed.push(batchData);
        } else {
          // Both 'failed' and 'partially_printed' go into failed category
          voyageGroups[batch.voyageNumber].failed.push(batchData);
        }
      });
      
      // Convert to array for easier frontend consumption
      const result = Object.values(voyageGroups);
      
      res.status(200).json({
        message: `Data for product code ${productCode} retrieved successfully`,
        voyageGroups: result
      });
    } catch (error) {
      console.error("Error in getBatchesByProductCodeGroupedByVoyage controller:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

// export const generatePrintedQr = async (req, res) => {
//     try {
//         const { productCode, voyageNumber, quantity } = req.body;

//         console.log("Received request:", req.body);

//         if (!productCode || !voyageNumber || !quantity) {
//             console.error("Validation failed: Missing fields");
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         const qty = Number(quantity);
//         if (!Number.isInteger(qty) || qty <= 0) {
//             return res.status(400).json({ message: "Invalid quantity" });
//         }

//         const voyage = await Voyage.findOne({ voyageNumber });
//         if (!voyage) {
//             console.error(`Voyage not found for voyageNumber: ${voyageNumber}`);
//             return res.status(400).json({ message: "Voyage not found" });
//         }

//         let lastCount = voyage.lastPrintedCounts.get(productCode) || 0;
//         console.log(`Initial lastCount for ${productCode}:`, lastCount);

//         let qrList = [];

//         for (let i = 0; i < qty; i++) {
//             lastCount++;  
//             const sequenceNumber = lastCount.toString().padStart(2, "0"); 
//             const qrData = `${productCode}|${sequenceNumber}|${voyageNumber}`;

//             console.log(`Generated QR: ${qrData}`);

//             const qr_svg = imageSync(qrData, { type: "png" });
//             const qrImage = `data:image/png;base64,${qr_svg.toString("base64")}`;

//             const printedQr = new PrintedQr({
//                 productCode,
//                 voyageNumber,
//                 quantity: lastCount, 
//                 printedBy: req.user.id,
//                 qrImage,
//             });

//             await printedQr.save();

//             qrList.push({
//                 productCode,
//                 sequenceNumber,
//                 voyageNumber,
//                 qrImage
//             });
//         }

//         console.log(`Updating lastCount for ${productCode}:`, lastCount);
//         voyage.lastPrintedCounts.set(productCode, lastCount);
//         await voyage.save();
//         console.log(`Voyage updated successfully with lastCount:`, voyage.lastPrintedCounts.get(productCode));

//         console.log(qrList);

//         res.status(200).json({ message: "QR Data generated successfully", qrList });
        

//     } catch (error) {
//         console.error("Error in generatePrintedQr controller:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// };

