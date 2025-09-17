import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Branch from "../models/branch.model.js";
import User from "../models/user.model.js";

export const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find()
            .populate('createdBy', 'username')
            .sort({ branchName: 1 });

        res.status(200).json({
            message: "Branches fetched successfully",
            branches
        });
    } catch (error) {
        console.log("Error in getBranches controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getBranchById = async (req, res) => {
    try {
        const { id } = req.params;

        const branch = await Branch.findById(id)
            .populate('createdBy', 'username');

        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        res.status(200).json({
            message: "Branch fetched successfully",
            branch
        });
    } catch (error) {
        console.log("Error in getBranchById controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getBranchAdmins = async (req, res) => {
    try {
        const { branchId } = req.params;

        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" })
        }

        if (!mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ message: "Invalid branch ID format" });
        }

        const admins = await User.find({
            branchId: branchId,
            role: 'admin'
        }).select('username adminRoles createdAt').sort({ createdAt: -1 });

        res.status(200).json({
            message: "Branch administrators fetched successfully",
            admins
        });
    } catch (error) {
        console.log("Error in getBranchAdmins controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const checkUsernames = async (req, res) => {
    try {
        const { usernames } = req.body;

        if (!usernames || !Array.isArray(usernames)) {
            return res.status(400).json({ message: "Usernames array is required!" });
        }

        const existingUsers = await User.find({
            username: { $in: usernames }
        }).select('username');

        const existingUsernames = existingUsers.map(user => user.username);

        res.status(200).json({ existingUsernames });
    } catch (error) {
        console.log("Error in checkUsernames controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// export const createBranchWithAdmins = async (req, res) => {
//     const session = await mongoose.startSession();

//     try {
//         const { branchName, admins, countryCode } = req.body;

//         if (!branchName) {
//             return res.status(400).json({ message: "Branch name is required!" });
//         }

//         if (!countryCode) {
//             return res.status(400).json({ message: "Country code is required!" });
//         }

//         // Validate country code format
//         if (!/^[A-Za-z]{2,3}$/.test(countryCode)) {
//             return res.status(400).json({
//                 message: "Country code must be 2-3 letters (ISO format)!"
//             });
//         }

//         if (!admins || !Array.isArray(admins) || admins.length === 0) {
//             return res.status(400).json({
//                 message: "Admins array is required and must contain at least one admin!"
//             });
//         }

//         const createdBy = req.user ? req.user._id : null;
//         if (!createdBy) {
//             return res.status(400).json({
//                 message: "Unauthorized: Missing creator information."
//             });
//         }

//         const validationErrors = [];
//         const usernames = [];

//         for (let i = 0; i < admins.length; i++) {
//             const admin = admins[i];
//             const { username, password, adminRoles } = admin;

//             if (!username || !password || !adminRoles) {
//                 validationErrors.push(`Admin ${i + 1}: All fields are required`);
//                 continue;
//             }

//             if (password.length < 8) {
//                 validationErrors.push(`Admin ${i + 1}: Password must be at least 8 characters`);
//                 continue;
//             }

//             if (usernames.includes(username)) {
//                 validationErrors.push(`Admin ${i + 1}: Duplicate username in request - ${username}`);
//                 continue;
//             }

//             usernames.push(username);
//         }

//         if (validationErrors.length > 0) {
//             return res.status(400).json({
//                 message: "Validation errors",
//                 errors: validationErrors
//             });
//         }

//         session.startTransaction();

//         // Check if branch already exists with same name and country code
//         const existingBranch = await Branch.findOne({
//             branchName,
//             countryCode: countryCode.toUpperCase()
//         }).session(session);

//         if (existingBranch) {
//             await session.abortTransaction();
//             return res.status(400).json({
//                 message: `Branch "${branchName}" already exists in ${countryCode.toUpperCase()}!`
//             });
//         }

//         const existingUsers = await User.find({
//             username: { $in: usernames }
//         }).select('username').session(session);

//         if (existingUsers.length > 0) {
//             await session.abortTransaction();
//             const existingUsernames = existingUsers.map(user => user.username);
//             return res.status(400).json({
//                 message: "Some usernames already exist",
//                 existingUsernames
//             });
//         }

//         // Create new branch with country code
//         const newBranch = new Branch({
//             branchName,
//             countryCode: countryCode.toUpperCase(), // Ensure uppercase
//             createdBy: createdBy,
//         });

//         const savedBranch = await newBranch.save({ session });

//         const usersToCreate = [];
//         for (const admin of admins) {
//             const { username, password, adminRoles } = admin;

//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);

//             usersToCreate.push({
//                 username,
//                 password: hashedPassword,
//                 role: 'admin',
//                 adminRoles,
//                 branchId: savedBranch._id,
//                 createdBy: createdBy
//             });
//         }

//         const createdAdmins = await User.insertMany(usersToCreate, { session });

//         await session.commitTransaction();

//         res.status(201).json({
//             message: `Branch "${branchName}" created successfully in ${savedBranch.countryCode} with ${createdAdmins.length} administrator(s)`,
//             branch: {
//                 id: savedBranch._id,
//                 branchName: savedBranch.branchName,
//                 countryCode: savedBranch.countryCode,
//                 createdBy: savedBranch.createdBy,
//                 createdAt: savedBranch.createdAt,
//                 updatedAt: savedBranch.updatedAt
//             },
//             createdAdmins: createdAdmins.map(user => ({
//                 id: user._id,
//                 username: user.username,
//                 role: user.role,
//                 adminRoles: user.adminRoles,
//                 branchId: user.branchId
//             }))
//         });

//     } catch (error) {
//         await session.abortTransaction();
//         console.log("Error in createBranchWithAdmins controller", error.message);
//         res.status(500).json({ message: "Internal server error" });
//     } finally {
//         session.endSession();
//     }
// };

export const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedBranch = await Branch.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('createdBy', 'username');

        if (!updatedBranch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        res.status(200).json({
            message: "Branch updated successfully",
            branch: updatedBranch
        });
    } catch (error) {
        console.log("Error in updateBranch controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteBranch = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        session.startTransaction();

        const branch = await Branch.findById(id).session(session);
        if (!branch) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Branch not found" });
        }

        await User.deleteMany({
            branch: branch.branchName
        }).session(session);

        await Branch.findByIdAndDelete(id).session(session);

        await session.commitTransaction();

        res.status(200).json({
            message: "Branch and associated administrators deleted successfully"
        });

    } catch (error) {
        await session.abortTransaction();
        console.log("Error in deleteBranch controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    } finally {
        session.endSession();
    }
};

export const addAdminToBranch = async (req, res) => {
    try {
        const { branchName } = req.params;
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const branch = await Branch.findOne({ branchName });
        if (!branch) {
            return res.status(404).json({ message: "Branch not found" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        const createdBy = req.user ? req.user._id : null;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = new User({
            username,
            password: hashedPassword,
            role,
            branch: branchName,
            createdBy
        });

        const savedAdmin = await newAdmin.save();

        res.status(201).json({
            message: "Administrator added to branch successfully",
            admin: {
                id: savedAdmin._id,
                username: savedAdmin.username,
                role: savedAdmin.role,
                branch: savedAdmin.branch
            }
        });

    } catch (error) {
        console.log("Error in addAdminToBranch controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const editBranchAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        console.log(adminId);


        const { username, password, adminRoles } = req.body;

        if (!adminId) {
            return res.status(400).json({ message: "Admin ID is required!" });
        }

        const admin = await User.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: "Administrator not found" });
        }

        if (admin.role !== 'admin') {
            return res.status(400).json({ message: "User is not an administrator" });
        }

        const updateData = {};

        if (username && username.trim() && username !== admin.username) {
            const exisitngUser = await User.findOne({ username: username.trim(), _id: { $ne: adminId } });

            if (exisitngUser) {
                return res.status(400).json({ message: "Username already exists!" });
            }
            updateData.username = username.trim();

        }

        if (adminRoles !== undefined) {
            if (typeof adminRoles === 'string' && adminRoles.trim()) {
                updateData.adminRoles = adminRoles.trim();
            } else if (Array.isArray(adminRoles)) {
                updateData.adminRoles = adminRoles.join(',');
            }
        }

        if (password && password.trim()) {
            if (password.length < 8) {
                return res.status(400).json({
                    message: "Password must be at least 8 characters"
                });
            }

            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }

        const updatedAdmin = await User.findByIdAndUpdate(adminId, updateData, {
            new: true,
            runValidators: true,
            select: '-password'
        });

        if (!updatedAdmin) {
            return res.status(404).json({ message: "Administrator not found" });
        }

        res.status(200).json({
            message: "Administrator updated successfully",
            admin: {
                id: updatedAdmin._id,
                username: updatedAdmin.username,
                role: updatedAdmin.role,
                adminRoles: updatedAdmin.adminRoles,
                branch: updatedAdmin.branch,
                createdAt: updatedAdmin.createdAt,
                updatedAt: updatedAdmin.updatedAt
            }
        });


    } catch (error) {

        console.log("Error in editBranchAdmin controller", error.message);
        res.status(500).json({ message: "Internal server error" });

    }
}

export const removeAdminFromBranch = async (req, res) => {
    try {
        const { adminId } = req.params;

        const adminToDelete = await User.findById(adminId);

        if (!adminToDelete) {
            return res.status(404).json({ message: "Administrator not found" });
        }

        const adminsInBranch = await User.find({
            branch: adminToDelete.branch,
            _id: { $ne: adminId },
            adminRoles: adminToDelete.adminRoles
        });

        if (adminsInBranch.length === 0) {
            return res.status(400).json({
                message: "Cannot delete the only admin in this branch",
                remainingAdmin: adminToDelete,
            });
        }

        await User.findByIdAndDelete(adminId);

        res.status(200).json({
            message: "Administrator removed successfully",
            remainingAdmins: adminsInBranch,
        });

    } catch (error) {
        console.log("Error in removeAdminFromBranch controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createBranchWithAdmins = async (req, res) => {
    try {
        const { branchData, adminsData } = req.body;

        if (!branchData || !adminsData || adminsData.legth === 0) {
            return res.status(400).json({ message: "Branch data and at least one admin are required" });
        }

        const { branchName, country } = branchData;

    } catch (error) {

    }
}