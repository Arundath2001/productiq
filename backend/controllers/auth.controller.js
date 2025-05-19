import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const createUser = async (req, res) => {
    try {
        const {username, password, companyCode, role, position, location} = req.body;

        console.log(req.body);
        

        if(!username || !password || !role ){
            return res.status(400).json({message : "All are required fields"});
        }

        if(password.length < 8){
            return res.status(400).json({message : "Password must be at least 8 characters"});
        }

        const user = await User.findOne({username})

        if(user) return res.status(400).json({message : "Username already exists"});

        if(role === "employee" && !position){
            return res.status(400).json({message : "position is a required field for employee"});
        }

        if(role === "client" && (!companyCode || !location)){
            return res.status(400).json({message : "companycode and location are required field for client"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const createdBy = req.user ? req.user._id : null;

        console.log(createdBy);
        

        if (!createdBy) {
            return res.status(400).json({ message: "Unauthorized: Missing creator information." });
        }

        const newUser = new User({
            username,
            password: hashedPassword,
            companyCode : role === "client" ? companyCode : undefined ,
            role,
            position : role === "employee" ? position : undefined,
            location : role === "client" ? location : undefined,
            createdBy : role === "admin" ? undefined : createdBy
        });

        if(newUser){
            
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                compnayCode: companyCode,
                role: role,
                position: position,
                location: location,
            })
        }else{
            return res.status(400).json({message: "Invalid user data"})
        }

    } catch (error) {
        console.log("Error in create user controller", error.message);
        res.status(500).json({message: "internal server error"});
    }
}

export const login = async (req,res) => {
    try {
        const {username, password, companyCode} = req.body;

        console.log(req.body);
        

        const user = await User.findOne({username});

        if(!user) return res.status(400).json({message : "Invalid credentials"});

        if(user.role === 'client' && user.companyCode !== companyCode){
            return res.status(400).json({message : "Invalid compnay code"});
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect) return res.status(400).json({message : "Invalid credentials"});

        const token = generateToken(user._id, res); 

        console.log("Generated Token:", token); 

        res.status(200).json({
            _id : user._id,
            username: user.username,
            companyCode : user.companyCode,
            role: user.role,
            position : user.position,
            location : user.location,
            token,
        },
    )

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({message : "Internal server error"})
    }
}

export const logout = async  (req,res) => {
    try {
        res.cookie("jwt","", {maxAge : 0});
        res.status(200).json({message : "Logged out successfully"})
    } catch (error) {
        console.log("Error in logout controller");
        res.status(500).json({message : "Internal server error"})
    }
    
}

export const getCompnayCode = async (req,res) => {
    try {
        const clients = await User.find({role : "client"}, "companyCode");

        const companyCodes = [...new Set(clients.map(client => client.companyCode))];

        res.status(200).json({companyCodes});
        
    } catch (error) {
        console.log("Error in getCompnayCode controller", error.message);
        res.status(500).json({message : "Internal server error"});
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller");
        res.status(500).json("Internal server error");
    }
}

export const getUserData = async (req, res) => {
    try {
        const employees = await User.find({ role: "employee" }, "-password").populate("createdBy", "username").sort({ createdAt: -1 });;
        const clients = await User.find({ role: "client" }, "-password").populate("createdBy", "username").sort({ createdAt: -1 });;

        res.status(200).json({
            employees,
            clients
        });

    } catch (error) {
        console.log("Error in getUserData controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const loggedInUserId = req.user._id;

        console.log(loggedInUserId);

        if (userId === loggedInUserId.toString()) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({ message: "No user found with this ID" });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        console.log("Error in deleteUser controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const editUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, password, companyCode, role, position, location } = req.body;        

        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (!user.role === 'admin') {
            return res.status(400).json({ message: "User not found" });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: "Username already exists" });
            }
            user.username = username;
        }

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        if (role) {
            user.role = role;
            user.companyCode = role === "client" ? companyCode : undefined;
            user.position = role === "employee" ? position : undefined;
            user.location = role === "client" ? location : undefined;
        }

        await user.save();

        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.log("Error in editUser controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateExpoPushToken = async (req, res) => {
    try {
        const { userId, expoPushToken } = req.body;
        await User.findByIdAndUpdate(userId, { expoPushToken });
        res.status(200).json({ message: "Expo push token updated successfully" });
    } catch (error) {
        console.error("Error updating Expo push token:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
