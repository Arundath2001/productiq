import Branch from "../models/branch.model.js";

export const createBranch = async (req, res) => {
    try {
        const { branchName, createdBy, updatedBy } = req.body;

        if (!branchName) {
            return res.status(400).json({ message: "Branch name is required!" });
        }

        const exisitngBranch = await Branch.findOne({ branchName });

        if (exisitngBranch) {
            res.status(400).json({ message: "Branch already exist!" });
        }

        const newBranch = new Branch({
            branchName,
            createdBy,
            updatedBy
        });

        const savedBranch = await newBranch.save();

        res.status(201).json({
            message: "Branch created successfully!",
            branch: savedBranch
        })

    } catch (error) {
        console.log("Error in createBranch controller", error.message);
        res.status(500).json({ message: "internal server error" });
    }
}

export const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find().populate("createdBy", "username").sort({ createdAt: -1 });

        res.status(200).json({
            message: "Branches retrieved successfully!",
            count: branches.length,
            branches
        })
    } catch (error) {
        console.log("Error in getBranches controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const editBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { branchName, createdBy, updatedBy } = req.body;

        const exisitngBranch = await Branch.findById(branchId);

        if (!exisitngBranch) {
            res.status(400).json({ message: "Branch not found!" });
        }


        if (branchName && branchName !== exisitngBranch.branchName) {
            const duplicateBranch = await Branch.findOne({
                branchName,
                _id: { $ne: branchId }
            })

            if (duplicateBranch) {
                res.status(200).json({ message: "Branch name already exists!" })
            }
        }

        const updatedBranch = await Branch.findByIdAndUpdate(branchId, {
            branchName,
            updatedBy,
            updatedAt: new Date()
        },
            { new: true }
        );

        res.status(200).json({
            message: "Branch updated successfully!",
            data: updatedBranch
        });

    } catch (error) {
        console.log("Error in editBranch controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}