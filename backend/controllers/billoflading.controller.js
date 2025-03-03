import BillOfLading from "../models/billOfLading.model.js";

export const saveBillOFLading = async (req, res) => {
    try {
        const data = req.body;
        console.log(req.body);
        
        const newBill = new BillOfLading(data);
        await newBill.save();
        res.status(201).json({ message: "Bill of Lading saved successfully", bill: newBill });
    } catch (error) {
        res.status(500).json({ message: "Error saving Bill of Lading", error: error.message });
    }
};

export const getAllBills = async (req, res) => {
    try {
        const bills = await BillOfLading.find();
        res.status(200).json(bills);
    } catch (error) {
        console.error("Error fetching Bills of Lading:", error);
        res.status(500).json({ message: "Error fetching Bills of Lading", error: error.message });
    }
};

export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await BillOfLading.findById(id);

        if (!bill) {
            return res.status(404).json({ message: "Bill of Lading not found" });
        }

        res.status(200).json(bill);
    } catch (error) {
        console.error("Error fetching Bill of Lading:", error);
        res.status(500).json({ message: "Error fetching Bill of Lading", error: error.message });
    }
};

export const updateBillOfLading = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedBill = await BillOfLading.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedBill) {
            return res.status(404).json({ message: "Bill of Lading not found" });
        }

        res.status(200).json({ message: "Bill of Lading updated successfully", bill: updatedBill });
    } catch (error) {
        console.error("Error updating Bill of Lading:", error);
        res.status(500).json({ message: "Error updating Bill of Lading", error: error.message });
    }
};

export const deleteBillOfLading = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBill = await BillOfLading.findByIdAndDelete(id);

        if (!deletedBill) {
            return res.status(404).json({ message: "Bill of Lading not found" });
        }

        res.status(200).json({ message: "Bill of Lading deleted successfully" });
    } catch (error) {
        console.error("Error deleting Bill of Lading:", error);
        res.status(500).json({ message: "Error deleting Bill of Lading", error: error.message });
    }
};
