import Voyage from "../models/voyage.model.js";
import PrintedQr from "../models/printedQr.model.js";
import { imageSync } from "qr-image";
import PrintBatch from "../models/printBatch.model.js"
import mongoose from "mongoose";


export const generatePrintedQrBatch = async (req, res) => {
  try {
    const { productCode, voyageNumber, quantity } = req.body;
    console.log("[QR-BATCH] Received request:", { productCode, voyageNumber, quantity });

    if (!productCode || !voyageNumber || !quantity) {
      console.error("[QR-BATCH] Validation failed: Missing fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      console.error("[QR-BATCH] Invalid quantity:", quantity);
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const voyage = await Voyage.findOne({ voyageNumber });
    if (!voyage) {
      console.error(`[QR-BATCH] Voyage not found for voyageNumber: ${voyageNumber}`);
      return res.status(400).json({ message: "Voyage not found" });
    }

    console.log(`[QR-BATCH] Found voyage: ${voyageNumber}`, { voyageId: voyage._id });

    let lastCount = voyage.lastPrintedCounts.get(productCode) || 0;
    console.log(`[QR-BATCH] Initial lastCount for ${productCode}: ${lastCount}`);

    // Calculate first and last QR sequence numbers
    const firstSequenceNumber = (lastCount + 1).toString().padStart(2, "0");
    const lastSequenceNumber = (lastCount + qty).toString().padStart(2, "0");

    // Create batch number with first and last QR data
    const batchNumber = `${productCode}|${firstSequenceNumber}|${voyageNumber} to ${productCode}|${lastSequenceNumber}|${voyageNumber}`;
    console.log(`[QR-BATCH] Generated batch number: ${batchNumber}`);

    let qrList = [];
    let qrIds = [];

    // Start a transaction
    console.log("[QR-BATCH] Starting MongoDB transaction");
    const session = await mongoose.startSession();
    let batchId;
    let transactionStarted = false;

    try {
      // Start the transaction
      transactionStarted = true;
      console.log("[QR-BATCH] Transaction started");

      await session.withTransaction(async () => {
        // Create a new batch
        console.log("[QR-BATCH] Creating new batch record");
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
        console.log(`[QR-BATCH] New batch created with ID: ${batchId}`);

        // Generate QR codes
        console.log(`[QR-BATCH] Generating ${qty} QR codes`);
        for (let i = 0; i < qty; i++) {
          lastCount++;
          const sequenceNumber = lastCount.toString().padStart(2, "0");
          const qrData = `${productCode}|${sequenceNumber}|${voyageNumber}`;

          const printedQr = new PrintedQr({
            productCode,
            voyageNumber,
            quantity: lastCount,
            printedBy: req.user.id,
            printStatus: "generated",
            batchId: newBatch._id,
            branchId: req.user.branchId._id
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
            qrData,
            printStatus: "generated"
          });

          if ((i + 1) % 10 === 0 || i === qty - 1) {
            console.log(`[QR-BATCH] Generated ${i + 1}/${qty} QR codes`);
          }
        }

        // Save batch with QR IDs
        console.log(`[QR-BATCH] Saving batch with ${qrIds.length} QR codes`);
        await newBatch.save({ session });

        // Update voyage's last printed count
        console.log(`[QR-BATCH] Updating voyage lastPrintedCounts for ${productCode} to ${lastCount}`);
        voyage.lastPrintedCounts.set(productCode, lastCount);
        await voyage.save({ session });
      });

      // Transaction was successful, end the session
      console.log("[QR-BATCH] Transaction completed successfully");
      transactionStarted = false;
      await session.endSession();
      console.log("[QR-BATCH] Session ended");

      console.log(`[QR-BATCH] QR batch generated successfully: ${batchNumber} with ${qrList.length} codes`);
      res.status(200).json({
        message: "QR batch generated successfully",
        batchId,
        batchNumber,
        qrCount: qrList.length,
        qrList
      });

    } catch (error) {
      console.error("[QR-BATCH] Error in batch generation:", error);

      // Only abort if transaction is still active
      if (transactionStarted) {
        console.log("[QR-BATCH] Attempting to abort transaction");
        try {
          await session.abortTransaction();
          console.log("[QR-BATCH] Transaction aborted successfully");
        } catch (abortError) {
          console.error("[QR-BATCH] Error aborting transaction:", abortError);
        }
        await session.endSession();
        console.log("[QR-BATCH] Session ended after abort");
      }

      res.status(500).json({ message: "Failed to generate QR batch" });
    }
  } catch (error) {
    console.error("[QR-BATCH] Error in generatePrintedQrBatch controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Get all batches with filters
export const getBatches = async (req, res) => {
  try {
    const { voyageNumber, productCode, status } = req.query;
    console.log("[GET-BATCHES] Request with filters:", { voyageNumber, productCode, status });

    const query = {};
    if (voyageNumber) query.voyageNumber = voyageNumber;
    if (productCode) query.productCode = productCode;
    if (status) query.printStatus = status;

    console.log("[GET-BATCHES] Executing query with filters:", query);
    const batches = await PrintBatch.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`[GET-BATCHES] Retrieved ${batches.length} batches`);
    res.status(200).json({
      message: "Batches retrieved successfully",
      count: batches.length,
      batches
    });
  } catch (error) {
    console.error("[GET-BATCHES] Error in getBatches controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a specific batch with its QR codes
export const getBatchWithQRs = async (req, res) => {
  try {
    const { batchId } = req.params;
    console.log(`[GET-BATCH] Retrieving batch: ${batchId}`);

    const batch = await PrintBatch.findById(batchId);
    if (!batch) {
      console.error(`[GET-BATCH] Batch not found: ${batchId}`);
      return res.status(404).json({ message: "Batch not found" });
    }

    console.log(`[GET-BATCH] Fetching ${batch.qrCodes.length} QR codes for batch: ${batchId}`);
    const qrCodes = await PrintedQr.find({ _id: { $in: batch.qrCodes } });
    console.log(`[GET-BATCH] Retrieved ${qrCodes.length} QR codes for batch: ${batchId}`);

    res.status(200).json({
      message: "Batch retrieved successfully",
      batch,
      qrCodes
    });
  } catch (error) {
    console.error("[GET-BATCH] Error in getBatchWithQRs controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get failed QR codes (can filter by batch)
export const getFailedPrints = async (req, res) => {
  try {
    const { voyageNumber, productCode, batchId } = req.query;
    console.log("[FAILED-PRINTS] Request with filters:", { voyageNumber, productCode, batchId });

    const query = { printStatus: "failed" };
    if (voyageNumber) query.voyageNumber = voyageNumber;
    if (productCode) query.productCode = productCode;
    if (batchId) query.batchId = batchId;

    console.log("[FAILED-PRINTS] Executing query with filters:", query);
    const failedPrints = await PrintedQr.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`[FAILED-PRINTS] Retrieved ${failedPrints.length} failed prints`);
    res.status(200).json({
      message: "Failed prints retrieved successfully",
      count: failedPrints.length,
      failedPrints
    });
  } catch (error) {
    console.error("[FAILED-PRINTS] Error in getFailedPrints controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add this new controller function to your existing controller file
export const getBatchesByProductCode = async (req, res) => {
  try {
    const { productCode } = req.params;
    const userBranchId = req.user.branchId._id;
    console.log(`[PRODUCT-BATCHES] Retrieving batches for product code: ${productCode}`);

    if (!productCode) {
      console.error("[PRODUCT-BATCHES] Missing product code");
      return res.status(400).json({ message: "Product code is required" });
    }

    // First get all batches for the product code
    console.log(`[PRODUCT-BATCHES] Fetching batches for product code: ${productCode}`);
    const batches = await PrintBatch.find({ productCode })
      .sort({ createdAt: -1 });
    console.log(`[PRODUCT-BATCHES] Found ${batches.length} batches for product code: ${productCode}`);

    // Get all related QR codes in one query
    const batchIds = batches.map(batch => batch._id);
    console.log(`[PRODUCT-BATCHES] Fetching QR codes for ${batchIds.length} batches`);
    const qrCodes = await PrintedQr.find({
      batchId: { $in: batchIds }, branchId: userBranchId
    }).sort({ createdAt: 1 }); // Sort by creation time to ensure proper order
    console.log(`[PRODUCT-BATCHES] Retrieved ${qrCodes.length} QR codes`);

    // Create lookup map for quick QR access
    const qrCodesByBatchId = {};
    qrCodes.forEach(qr => {
      if (!qrCodesByBatchId[qr.batchId]) {
        qrCodesByBatchId[qr.batchId] = [];
      }
      qrCodesByBatchId[qr.batchId].push(qr);
    });

    // Group by voyage and categorize by status
    console.log("[PRODUCT-BATCHES] Grouping batches by voyage and status");
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
    console.log(`[PRODUCT-BATCHES] Returning data for ${result.length} voyages`);

    res.status(200).json({
      message: `Data for product code ${productCode} retrieved successfully`,
      voyageGroups: result
    });
  } catch (error) {
    console.error("[PRODUCT-BATCHES] Error in getBatchesByProductCode controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update print status for individual QR codes
export const updateQrPrintStatus = async (req, res) => {
  try {
    const { qrIds, status } = req.body;
    console.log("[QR-PRINT] Update request:", { qrIds: qrIds?.length, status });

    if (!qrIds || !Array.isArray(qrIds) || qrIds.length === 0 || !status) {
      console.error("[QR-PRINT] Validation failed: Missing required fields");
      return res.status(400).json({ message: "QR IDs array and status are required" });
    }

    if (!["printed", "failed"].includes(status)) {
      console.error("[QR-PRINT] Invalid status:", status);
      return res.status(400).json({ message: "Status must be either 'printed' or 'failed'" });
    }

    // Start a transaction
    const session = await mongoose.startSession();
    let transactionStarted = false;

    try {
      transactionStarted = true;
      session.startTransaction();

      // Update the status of specific QR codes
      console.log(`[QR-PRINT] Updating ${qrIds.length} QR codes to status: ${status}`);
      const updateResult = await PrintedQr.updateMany(
        { _id: { $in: qrIds } },
        {
          $set: { printStatus: status },
          $inc: { printAttempts: 1 },
          $currentDate: { lastPrintAttempt: true }
        },
        { session }
      );

      // Find all affected batches
      const qrCodes = await PrintedQr.find({ _id: { $in: qrIds } }).session(session);
      const batchIds = [...new Set(qrCodes.map(qr => qr.batchId).filter(id => id))];
      console.log(`[QR-PRINT] Found ${batchIds.length} affected batches`);

      // Check if any batches need status updates
      let updatedBatches = 0;
      for (const batchId of batchIds) {
        const batch = await PrintBatch.findById(batchId).session(session);
        if (!batch) continue;

        // Check if all QRs in batch have reached the same state
        const allQrsInBatch = await PrintedQr.find({ batchId: batchId }).session(session);
        const qrStatuses = allQrsInBatch.map(qr => qr.printStatus);

        let newBatchStatus = batch.printStatus; // Default to current status

        // Only update batch status when ALL QRs are in the same state
        const allPrinted = qrStatuses.every(status => status === 'printed');
        const allFailed = qrStatuses.every(status => status === 'failed');

        if (allPrinted) {
          console.log(`[QR-PRINT] All QRs in batch ${batchId} are printed`);
          newBatchStatus = 'printed';
        } else if (allFailed) {
          console.log(`[QR-PRINT] All QRs in batch ${batchId} failed`);
          newBatchStatus = 'failed';
        } else if (qrStatuses.some(status => status === 'printed' || status === 'failed')) {
          console.log(`[QR-PRINT] Batch ${batchId} has mixed QR statuses`);
          newBatchStatus = 'partially_printed';
        }

        // Only update if status changed
        if (batch.printStatus !== newBatchStatus) {
          console.log(`[QR-PRINT] Updating batch ${batchId} status from ${batch.printStatus} to ${newBatchStatus}`);
          batch.printStatus = newBatchStatus;
          await batch.save({ session });
          updatedBatches++;
        }
      }

      await session.commitTransaction();
      transactionStarted = false;
      await session.endSession();

      res.status(200).json({
        message: `QR print status updated to ${status}`,
        updatedQrs: updateResult.modifiedCount,
        updatedBatches
      });

    } catch (error) {
      console.error("[QR-PRINT] Error updating QR print status:", error);

      if (transactionStarted) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          console.error("[QR-PRINT] Error aborting transaction:", abortError);
        }
        await session.endSession();
      }

      res.status(500).json({ message: "Failed to update QR print status" });
    }
  } catch (error) {
    console.error("[QR-PRINT] Error in updateQrPrintStatus controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update print status for an entire batch
export const updateBatchPrintStatus = async (req, res) => {
  try {
    const { batchId, status } = req.body;
    console.log("[BATCH-PRINT] Update request:", { batchId, status });

    if (!batchId || !status) {
      console.error("[BATCH-PRINT] Validation failed: Missing required fields");
      return res.status(400).json({ message: "Batch ID and status are required" });
    }

    if (!["printed", "failed"].includes(status)) {
      console.error("[BATCH-PRINT] Invalid status:", status);
      return res.status(400).json({ message: "Status must be either 'printed' or 'failed'" });
    }

    // Start a transaction
    const session = await mongoose.startSession();
    let transactionStarted = false;

    try {
      transactionStarted = true;
      session.startTransaction();

      // Find the batch
      const batch = await PrintBatch.findById(batchId).session(session);
      if (!batch) {
        console.error(`[BATCH-PRINT] Batch not found: ${batchId}`);
        await session.abortTransaction();
        await session.endSession();
        return res.status(404).json({ message: "Batch not found" });
      }

      // Update batch status
      console.log(`[BATCH-PRINT] Updating batch status from ${batch.printStatus} to ${status}`);
      batch.printStatus = status;
      await batch.save({ session });

      // Update all QR codes in the batch
      console.log(`[BATCH-PRINT] Updating ${batch.qrCodes.length} QR codes to status: ${status}`);
      const updateResult = await PrintedQr.updateMany(
        { _id: { $in: batch.qrCodes } },
        {
          $set: { printStatus: status },
          $inc: { printAttempts: 1 },
          $currentDate: { lastPrintAttempt: true }
        },
        { session }
      );

      await session.commitTransaction();
      transactionStarted = false;
      await session.endSession();

      res.status(200).json({
        message: `Batch print status updated to ${status}`,
        batchId,
        updatedQrs: updateResult.modifiedCount
      });

    } catch (error) {
      console.error("[BATCH-PRINT] Error updating batch print status:", error);

      if (transactionStarted) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          console.error("[BATCH-PRINT] Error aborting transaction:", abortError);
        }
        await session.endSession();
      }

      res.status(500).json({ message: "Failed to update batch print status" });
    }
  } catch (error) {
    console.error("[BATCH-PRINT] Error in updateBatchPrintStatus controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};