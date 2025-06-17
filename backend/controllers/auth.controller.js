import User from "../models/user.model.js";
import crypto from "crypto";
import nodemailer from 'nodemailer';
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import { Expo } from 'expo-server-sdk'; // Add this import
import { io } from "../lib/socket.js";

// Using Map for in-memory storage (consider Redis for production)
const otpStore = new Map();
const verificationStore = new Map(); // Store verification status

// Email configuration with better error handling
const createTransporter = () => {

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials not found in environment variables");
    }

    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Push notification helper function
const sendPushNotificationToMultiple = async (expoPushTokens, message) => {
    let expo = new Expo();

    // Create messages for all tokens
    const messages = expoPushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: 'Aswaq Forwarder',
        body: message,
        data: { withSome: 'data' },
    }));

    try {
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        let failedTokens = [];

        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        // Check for failed notifications and collect failed tokens
        tickets.forEach((ticket, index) => {
            if (ticket.status === 'error') {
                console.error(`Push notification failed for token ${expoPushTokens[index]}:`, ticket.message);
                // If token is invalid/dead, add to failed tokens list
                if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
                    failedTokens.push(expoPushTokens[index]);
                }
            }
        });

        // Optionally clean up failed tokens from database
        if (failedTokens.length > 0) {
            console.log(`Found ${failedTokens.length} dead tokens, cleaning up...`);
            await cleanupDeadTokens(failedTokens);
        }

        console.log(`Push notifications sent to ${expoPushTokens.length} devices`);
    } catch (error) {
        console.error('Error sending push notifications:', error);
    }
};

// Helper function to cleanup dead tokens
const cleanupDeadTokens = async (deadTokens) => {
    try {
        await User.updateMany(
            {},
            {
                $pull: {
                    expoPushTokens: {
                        token: { $in: deadTokens }
                    }
                }
            }
        );
        console.log(`Cleaned up ${deadTokens.length} dead tokens from database`);
    } catch (error) {
        console.error('Error cleaning up dead tokens:', error);
    }
};

// Step 1: Send OTP to email for client registration
export const sendRegistrationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        console.log("Request body for sendRegistrationOTP:", req.body);

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Store OTP with 10 minutes expiry
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0 // Track verification attempts
        });

        // Reset verification status
        verificationStore.delete(email);

        // Create transporter (with error handling)
        let transporter;
        try {
            transporter = createTransporter();
        } catch (error) {
            console.log("Transporter creation error:", error.message);
            return res.status(500).json({
                message: "Email service configuration error",
                error: error.message
            });
        }

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Registration OTP - Your App Name',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Registration OTP</h2>
                    <p>Your OTP for registration is:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        // Test transporter connection before sending
        await transporter.verify();
        console.log("SMTP connection verified successfully");

        await transporter.sendMail(mailOptions);
        console.log("OTP email sent successfully to:", email);

        res.status(200).json({
            message: "OTP sent successfully to your email",
            email,
            expiresIn: 600 // 10 minutes in seconds
        });

    } catch (error) {
        console.log("Error in sendRegistrationOTP controller:", error.message);

        // More specific error handling
        if (error.code === 'EAUTH') {
            return res.status(500).json({
                message: "Email authentication failed. Please check your credentials."
            });
        } else if (error.code === 'ECONNECTION') {
            return res.status(500).json({
                message: "Failed to connect to email server"
            });
        } else {
            return res.status(500).json({
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

// Step 2: Verify OTP only (separate from registration)
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log("OTP verification request:", { email, otp });

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        // Check if OTP exists
        const storedOTPData = otpStore.get(email);
        if (!storedOTPData) {
            return res.status(400).json({ message: "OTP not found or expired. Please request a new OTP." });
        }

        // Check if OTP is expired
        if (Date.now() > storedOTPData.expiresAt) {
            otpStore.delete(email);
            verificationStore.delete(email);
            return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
        }

        // Check attempt limit (prevent brute force)
        if (storedOTPData.attempts >= 5) {
            otpStore.delete(email);
            verificationStore.delete(email);
            return res.status(400).json({
                message: "Too many failed attempts. Please request a new OTP."
            });
        }

        // Verify OTP
        if (storedOTPData.otp !== otp) {
            // Increment attempts
            storedOTPData.attempts += 1;
            otpStore.set(email, storedOTPData);

            return res.status(400).json({
                message: "Invalid OTP",
                attemptsLeft: 5 - storedOTPData.attempts
            });
        }

        // OTP is valid - mark as verified
        verificationStore.set(email, {
            verified: true,
            verifiedAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes to complete registration
        });

        // Keep OTP for potential resend, but mark as used
        storedOTPData.verified = true;
        otpStore.set(email, storedOTPData);

        res.status(200).json({
            message: "OTP verified successfully. You can now complete your registration.",
            email,
            verified: true
        });

    } catch (error) {
        console.log("Error in verifyOTP controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Add these new stores for forgot password functionality (add to your existing stores)
const forgotPasswordOTPStore = new Map();
const forgotPasswordVerificationStore = new Map();

// Step 1: Send OTP to email for password reset
export const sendForgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;

        console.log("Request body for sendForgotPasswordOTP:", req.body);

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // Check if email exists in database
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "No account found with this email address" });
        }

        // Generate 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Store OTP with 10 minutes expiry
        forgotPasswordOTPStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0, // Track verification attempts
            userId: existingUser._id // Store user ID for reference
        });

        // Reset verification status
        forgotPasswordVerificationStore.delete(email);

        // Create transporter (with error handling)
        let transporter;
        try {
            transporter = createTransporter();
        } catch (error) {
            console.log("Transporter creation error:", error.message);
            return res.status(500).json({
                message: "Email service configuration error",
                error: error.message
            });
        }

        // Send OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - Aswaq Forwarder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested to reset your password. Your OTP is:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 8px;">
                        ${otp}
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p style="color: #666;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
                    <p style="color: #666;">For security reasons, this OTP can only be used once.</p>
                </div>
            `
        };

        // Test transporter connection before sending
        await transporter.verify();
        console.log("SMTP connection verified successfully");

        await transporter.sendMail(mailOptions);
        console.log("Forgot password OTP email sent successfully to:", email);

        res.status(200).json({
            message: "Password reset OTP sent successfully to your email",
            email,
            expiresIn: 600 // 10 minutes in seconds
        });

    } catch (error) {
        console.log("Error in sendForgotPasswordOTP controller:", error.message);

        // More specific error handling
        if (error.code === 'EAUTH') {
            return res.status(500).json({
                message: "Email authentication failed. Please check your credentials."
            });
        } else if (error.code === 'ECONNECTION') {
            return res.status(500).json({
                message: "Failed to connect to email server"
            });
        } else {
            return res.status(500).json({
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

// Step 2: Verify OTP for password reset
export const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        console.log("Forgot password OTP verification request:", { email, otp });

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        // Check if OTP exists
        const storedOTPData = forgotPasswordOTPStore.get(email);
        if (!storedOTPData) {
            return res.status(400).json({ 
                message: "OTP not found or expired. Please request a new password reset OTP." 
            });
        }

        // Check if OTP is expired
        if (Date.now() > storedOTPData.expiresAt) {
            forgotPasswordOTPStore.delete(email);
            forgotPasswordVerificationStore.delete(email);
            return res.status(400).json({ 
                message: "OTP has expired. Please request a new password reset OTP." 
            });
        }

        // Check attempt limit (prevent brute force)
        if (storedOTPData.attempts >= 5) {
            forgotPasswordOTPStore.delete(email);
            forgotPasswordVerificationStore.delete(email);
            return res.status(400).json({
                message: "Too many failed attempts. Please request a new password reset OTP."
            });
        }

        // Verify OTP
        if (storedOTPData.otp !== otp) {
            // Increment attempts
            storedOTPData.attempts += 1;
            forgotPasswordOTPStore.set(email, storedOTPData);

            return res.status(400).json({
                message: "Invalid OTP",
                attemptsLeft: 5 - storedOTPData.attempts
            });
        }

        // OTP is valid - mark as verified
        forgotPasswordVerificationStore.set(email, {
            verified: true,
            verifiedAt: Date.now(),
            expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes to reset password
            userId: storedOTPData.userId
        });

        // Mark OTP as used but keep it for potential cleanup
        storedOTPData.verified = true;
        forgotPasswordOTPStore.set(email, storedOTPData);

        res.status(200).json({
            message: "OTP verified successfully. You can now reset your password.",
            email,
            verified: true
        });

    } catch (error) {
        console.log("Error in verifyForgotPasswordOTP controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Step 3: Reset password with new password
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        console.log("Reset password request:", { email, newPassword: "***", confirmPassword: "***" });

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Email, new password, and confirm password are required"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New password and confirm password do not match"
            });
        }

        // Check if email is verified for password reset
        const verificationData = forgotPasswordVerificationStore.get(email);
        if (!verificationData || !verificationData.verified) {
            return res.status(400).json({
                message: "Email not verified. Please verify your OTP first."
            });
        }

        // Check if verification is still valid (15 minutes)
        if (Date.now() > verificationData.expiresAt) {
            forgotPasswordVerificationStore.delete(email);
            forgotPasswordOTPStore.delete(email);
            return res.status(400).json({
                message: "Verification expired. Please start the password reset process again."
            });
        }

        // Find user by ID (more secure than email)
        const user = await User.findById(verificationData.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify email matches (double security check)
        if (user.email !== email) {
            return res.status(400).json({ message: "Invalid verification data" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        // Clean up stores
        forgotPasswordOTPStore.delete(email);
        forgotPasswordVerificationStore.delete(email);

        // Send push notification if user has tokens
        if (user.expoPushTokens && user.expoPushTokens.length > 0) {
            const userTokens = user.expoPushTokens.map(tokenObj => tokenObj.token);
            await sendPushNotificationToMultiple(
                userTokens,
                `🔒 Your password has been successfully reset. If this wasn't you, please contact support immediately.`
            );
        }

        // Send confirmation email
        try {
            const transporter = createTransporter();
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset Successful - Aswaq Forwarder',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Reset Successful</h2>
                        <p>Your password has been successfully reset.</p>
                        <p>If you didn't make this change, please contact our support team immediately.</p>
                        <p style="color: #666;">This email was sent on ${new Date().toLocaleString()}</p>
                    </div>
                `
            };
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.log("Error sending confirmation email:", emailError.message);
            // Don't fail the request if email fails
        }

        res.status(200).json({
            message: "Password reset successfully",
            email
        });

    } catch (error) {
        console.log("Error in resetPassword controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Resend forgot password OTP function
export const resendForgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if email exists in database
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "No account found with this email address" });
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Update/Set OTP with new expiry
        forgotPasswordOTPStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0,
            userId: existingUser._id
        });

        // Reset verification status
        forgotPasswordVerificationStore.delete(email);

        // Create transporter
        let transporter;
        try {
            transporter = createTransporter();
        } catch (error) {
            console.log("Transporter creation error:", error.message);
            return res.status(500).json({
                message: "Email service configuration error"
            });
        }

        // Send new OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Resend Password Reset OTP - Aswaq Forwarder',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset OTP (Resent)</h2>
                    <p>You requested to resend the password reset OTP. Your new OTP is:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 8px;">
                        ${otp}
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log("Forgot password OTP resent successfully to:", email);

        res.status(200).json({
            message: "Password reset OTP resent successfully to your email",
            email,
            expiresIn: 600
        });

    } catch (error) {
        console.log("Error in resendForgotPasswordOTP controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Check forgot password verification status (optional endpoint for frontend)
export const checkForgotPasswordStatus = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const verificationData = forgotPasswordVerificationStore.get(email);
        const otpData = forgotPasswordOTPStore.get(email);

        res.status(200).json({
            email,
            hasOTP: !!otpData,
            isVerified: !!(verificationData && verificationData.verified),
            otpExpired: otpData ? Date.now() > otpData.expiresAt : true,
            verificationExpired: verificationData ? Date.now() > verificationData.expiresAt : true
        });

    } catch (error) {
        console.log("Error in checkForgotPasswordStatus controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user._id; // Assumes middleware sets req.user
        const { newPassword, confirmPassword } = req.body;

        // Validate inputs
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All password fields are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "New password must be at least 8 characters" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Error in changePassword:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Step 3: Complete registration with user details
export const completeRegistration = async (req, res) => {
    try {
        const { email, username, password, phoneNumber, countryCode } = req.body;

        console.log("Complete registration request:", req.body);

        if (!email || !username || !password || !phoneNumber || !countryCode) {
            return res.status(400).json({
                message: "Email, username, password, phone number, and country code are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        // Validate country code format
        const countryCodeRegex = /^\+[1-9]\d{0,3}$/;
        if (!countryCodeRegex.test(countryCode)) {
            return res.status(400).json({
                message: "Please enter a valid country code (e.g., +1, +91, +44)"
            });
        }

        // Validate phone number format
        const phoneRegex = /^[\+]?[0-9][\d\s\-\(\)]{6,17}$/;
        const digitCount = phoneNumber.replace(/[\s\-\(\)\+]/g, '').length;
        
        if (!phoneRegex.test(phoneNumber) || digitCount < 7) {
            return res.status(400).json({
                message: "Please enter a valid phone number (minimum 7 digits)"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // Check if email is verified
        const verificationData = verificationStore.get(email);
        if (!verificationData || !verificationData.verified) {
            return res.status(400).json({
                message: "Email not verified. Please verify your OTP first."
            });
        }

        // Check if verification is still valid (30 minutes)
        if (Date.now() > verificationData.expiresAt) {
            verificationStore.delete(email);
            otpStore.delete(email);
            return res.status(400).json({
                message: "Verification expired. Please start the registration process again."
            });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Check if email already exists (double check)
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new client user
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            phoneNumber,
            countryCode,
            role: 'client',
            companyCode: null,
        });

        await newUser.save();

        // Clean up stores
        otpStore.delete(email);
        verificationStore.delete(email);

        // Generate token for immediate login
        const token = generateToken(newUser._id, res);

        res.status(201).json({
            message: "Registration completed successfully",
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                phoneNumber: newUser.phoneNumber,
                countryCode: newUser.countryCode,
                role: newUser.role,
                companyCode: newUser.companyCode,
            },
            token
        });

    } catch (error) {
        console.log("Error in completeRegistration controller:", error.message);


        res.status(500).json({ message: "Internal server error" });
    }
};

// Resend OTP function
export const resendRegistrationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Update/Set OTP with new expiry
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0
        });

        // Reset verification status
        verificationStore.delete(email);

        // Create transporter
        let transporter;
        try {
            transporter = createTransporter();
        } catch (error) {
            console.log("Transporter creation error:", error.message);
            return res.status(500).json({
                message: "Email service configuration error"
            });
        }

        // Send new OTP email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Resend Registration OTP - Your App Name',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Registration OTP (Resent)</h2>
                    <p>Your new OTP for registration is:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This OTP will expire in 10 minutes.</p>
                    <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: "OTP resent successfully to your email",
            email,
            expiresIn: 600
        });

    } catch (error) {
        console.log("Error in resendRegistrationOTP controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Check verification status (optional endpoint for frontend)
export const checkVerificationStatus = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const verificationData = verificationStore.get(email);
        const otpData = otpStore.get(email);

        res.status(200).json({
            email,
            hasOTP: !!otpData,
            isVerified: !!(verificationData && verificationData.verified),
            otpExpired: otpData ? Date.now() > otpData.expiresAt : true,
            verificationExpired: verificationData ? Date.now() > verificationData.expiresAt : true
        });

    } catch (error) {
        console.log("Error in checkVerificationStatus controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createUser = async (req, res) => {
    try {
        const { username, password, companyCode, role, position, location, phoneNumber, email } = req.body;

        console.log(req.body);


        if (!username || !password || !role) {
            return res.status(400).json({ message: "All are required fields" });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const user = await User.findOne({ username })

        if (user) return res.status(400).json({ message: "Username already exists" });

        if (role === "employee" && !position) {
            return res.status(400).json({ message: "position is a required field for employee" });
        }

        if (role === "client" && (!location || !phoneNumber || !email)) {
            return res.status(400).json({ message: "location, phone number, and email are required fields for client" });
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
            companyCode: role === "client" ? companyCode : undefined,
            role,
            position: role === "employee" ? position : undefined,
            location: role === "client" ? location : undefined,
            phoneNumber: role === "client" ? phoneNumber : undefined,
            email: role === "client" ? email : undefined,
            createdBy: role === "admin" ? undefined : createdBy
        });

        if (newUser) {

            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                companyCode: companyCode,
                role: role,
                position: position,
                location: location,
                phoneNumber: phoneNumber,
                email: email
            })
        } else {
            return res.status(400).json({ message: "Invalid user data" })
        }

    } catch (error) {
        console.log("Error in create user controller", error.message);
        res.status(500).json({ message: "internal server error" });
    }
}

export const login = async (req, res) => {
    try {
        const { username, password, companyCode } = req.body;

        console.log(req.body);

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        // Check if user role is client for org login
        // if (user.role !== 'client') {
        //     return res.status(400).json({ message: "Only client users can access org login" });
        // }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        const token = generateToken(user._id, res);

        console.log("Generated Token:", token);

        res.status(200).json({
            _id: user._id,
            username: user.username,
            companyCode: user.companyCode,
            role: user.role,
            position: user.position,
            location: user.location,
            phoneNumber: user.phoneNumber,
            email: user.email,
            token,
        });

    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" })
    } catch (error) {
        console.log("Error in logout controller");
        res.status(500).json({ message: "Internal server error" })
    }

}

export const getCompanyCode = async (req, res) => {
    try {
        const clients = await User.find({ role: "client" }, "companyCode");

        const companyCodes = [...new Set(clients.map(client => client.companyCode).filter(code => code !== null))];

        res.status(200).json({ companyCodes });

    } catch (error) {
        console.log("Error in getCompanyCode controller", error.message);
        res.status(500).json({ message: "Internal server error" });
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
        const employees = await User.find({ role: "employee" }, "-password").populate("createdBy", "username").sort({ createdAt: -1 });
        const clients = await User.find({ role: "client" }, "-password")
            .populate("createdBy", "username")
            .populate("approvedBy", "username")    // Add this line
            .populate("rejectedBy", "username")    // Add this line
            .sort({ createdAt: -1 });

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
        const { username, password, companyCode, role, position, location, phoneNumber, email } = req.body;

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
            user.phoneNumber = role === "client" ? phoneNumber : undefined;
            user.email = role === "client" ? email : undefined;
        }

        await user.save();

        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.log("Error in editUser controller", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Updated function to handle multiple devices
export const updateExpoPushToken = async (req, res) => {
    try {
        const { userId, expoPushToken, deviceId } = req.body;

        if (!userId || !expoPushToken || !deviceId) {
            return res.status(400).json({ message: "userId, expoPushToken, and deviceId are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove existing token for this device if it exists
        user.expoPushTokens = user.expoPushTokens.filter(tokenObj => tokenObj.deviceId !== deviceId);

        // Add new token
        user.expoPushTokens.push({
            token: expoPushToken,
            deviceId: deviceId,
            createdAt: new Date()
        });

        await user.save();

        console.log(`Updated push token for user ${userId}, device ${deviceId}`);
        res.status(200).json({ message: "Expo push token updated successfully" });
    } catch (error) {
        console.error("Error updating Expo push token:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// New function to remove push token on logout
export const removeExpoPushToken = async (req, res) => {
    try {
        const { userId, deviceId } = req.body;

        if (!userId || !deviceId) {
            return res.status(400).json({ message: "userId and deviceId are required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove token for this specific device
        user.expoPushTokens = user.expoPushTokens.filter(tokenObj => tokenObj.deviceId !== deviceId);
        await user.save();

        console.log(`Removed push token for user ${userId}, device ${deviceId}`);
        res.status(200).json({ message: "Expo push token removed successfully" });
    } catch (error) {
        console.error("Error removing Expo push token:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Helper function to get all push tokens for a user (for sending notifications)
export const getUserPushTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return [];

        return user.expoPushTokens.map(tokenObj => tokenObj.token);
    } catch (error) {
        console.error("Error getting user push tokens:", error.message);
        return [];
    }
};

// Add these methods to your auth controller

export const approveClient = async (req, res) => {
    try {
        const { userId } = req.params;
        const { companyCode, approvalNotes } = req.body;
        const approvedBy = req.user._id; //  The admin/employee who is approving 

        if (!companyCode) {
            return res.status(400).json({ message: "Company code is required for approval" });
        }

        // Find the user to approve
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is a client
        if (user.role !== 'client') {
            return res.status(400).json({ message: "Only client users can be approved" });
        }

        // Allow approval for pending and rejected users
        if (user.approvalStatus === 'approved') {
            return res.status(400).json({
                message: "User is already approved"
            });
        }

        // Determine if this is a re-approval
        const isReapproval = user.approvalStatus === 'rejected';

        // Update user with approval details
        user.approvalStatus = 'approved';
        user.companyCode = companyCode;
        user.approvedBy = approvedBy;
        user.approvedAt = new Date();
        user.approvalNotes = approvalNotes || null;

        // Clear any previous rejection data
        user.rejectedBy = null;
        user.rejectedAt = null;
        user.rejectionMessage = null;

        await user.save();

        // Populate the approvedBy field for response
        await user.populate('approvedBy', 'username');

        // Emit socket event for real-time updates
        io.emit("client-approval-updated", {
            userId: user._id,
            username: user.username,
            email: user.email,
            companyCode: user.companyCode,
            approvalStatus: user.approvalStatus,
            approvedBy: user.approvedBy,
            approvedAt: user.approvedAt,
            approvalNotes: user.approvalNotes,
            updateType: isReapproval ? 'reapproved' : 'approved'
        });

        // Send appropriate push notification
        if (user.expoPushTokens && user.expoPushTokens.length > 0) {
            const userTokens = user.expoPushTokens.map(tokenObj => tokenObj.token);
            const notificationMessage = isReapproval 
                ? `🎉 Great news! Your account has been re-approved and you've been assigned to company code: ${companyCode}. You can now access all features again.`
                : `🎉 Congratulations! Your account has been approved and you've been assigned to company code: ${companyCode}. You can now access all features.`;
            
            await sendPushNotificationToMultiple(userTokens, notificationMessage);
        }

        const successMessage = isReapproval 
            ? "Client re-approved successfully and notification sent"
            : "Client approved successfully and notification sent";

        res.status(200).json({
            message: successMessage,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                companyCode: user.companyCode,
                approvalStatus: user.approvalStatus,
                approvedBy: user.approvedBy,
                approvedAt: user.approvedAt,
                approvalNotes: user.approvalNotes,
                isReapproval
            }
        });

    } catch (error) {
        console.log("Error in approveClient controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const rejectClient = async (req, res) => {
    try {
        const { userId } = req.params;
        const { rejectionMessage } = req.body;
        const rejectedBy = req.user._id;

        if (!rejectionMessage?.trim()) {
            return res.status(400).json({ message: "Rejection message is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'client') {
            return res.status(400).json({ message: "Only client users can be rejected" });
        }

        // Allow rejection for pending and approved users
        if (user.approvalStatus === 'rejected') {
            return res.status(400).json({
                message: "User is already rejected"
            });
        }

        // Determine if this is a re-rejection (from approved status)
        const isRerejection = user.approvalStatus === 'approved';
        
        // Store previous approval data for logging/audit purposes
        const previousData = isRerejection ? {
            companyCode: user.companyCode,
            approvedBy: user.approvedBy,
            approvedAt: user.approvedAt,
            approvalNotes: user.approvalNotes
        } : null;

        // Update user with rejection details
        user.approvalStatus = 'rejected';
        user.rejectedBy = rejectedBy;
        user.rejectedAt = new Date();
        user.rejectionMessage = rejectionMessage.trim();

        // Clear approval data when rejecting
        user.companyCode = null;
        user.approvedBy = null;
        user.approvedAt = null;
        user.approvalNotes = null;

        await user.save();
        await user.populate('rejectedBy', 'username');

        // Emit socket event for real-time updates
        io.emit("client-approval-updated", {
            userId: user._id,
            username: user.username,
            email: user.email,
            approvalStatus: user.approvalStatus,
            rejectedBy: user.rejectedBy,
            rejectedAt: user.rejectedAt,
            rejectionMessage: user.rejectionMessage,
            updateType: isRerejection ? 'rerejected' : 'rejected',
            previousData
        });

        // Send appropriate push notification
        if (user.expoPushTokens && user.expoPushTokens.length > 0) {
            const userTokens = user.expoPushTokens.map(tokenObj => tokenObj.token);
            const notificationMessage = isRerejection
                ? `⚠️ Your account approval has been revoked. Reason: ${rejectionMessage}. Please contact support for more information.`
                : `❌ Your account approval has been declined. Reason: ${rejectionMessage}. Please contact support for more information.`;
            
            await sendPushNotificationToMultiple(userTokens, notificationMessage);
        }

        const successMessage = isRerejection
            ? "Client approval revoked successfully and notification sent"
            : "Client rejected successfully and notification sent";

        res.status(200).json({
            message: successMessage,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                approvalStatus: user.approvalStatus,
                rejectedBy: user.rejectedBy,
                rejectedAt: user.rejectedAt,
                rejectionMessage: user.rejectionMessage,
                isRerejection
            }
        });

    } catch (error) {
        console.log("Error in rejectClient controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get pending clients for approval
export const getPendingClients = async (req, res) => {
    try {
        const pendingClients = await User.find({
            role: 'client',
            approvalStatus: 'pending'
        }, '-password')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Pending clients retrieved successfully",
            count: pendingClients.length,
            clients: pendingClients
        });

    } catch (error) {
        console.log("Error in getPendingClients controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get clients by approval status
export const getClientsByStatus = async (req, res) => {
    try {
        const { status } = req.params; // 'pending', 'approved', 'rejected'

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Use: pending, approved, or rejected" });
        }

        const clients = await User.find({
            role: 'client',
            approvalStatus: status
        }, '-password')
            .populate('createdBy', 'username')
            .populate('approvedBy', 'username')
            .populate('rejectedBy', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: `${status.charAt(0).toUpperCase() + status.slice(1)} clients retrieved successfully`,
            count: clients.length,
            clients: clients
        });

    } catch (error) {
        console.log("Error in getClientsByStatus controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Resubmit rejected client (allows rejected clients to be reconsidered)
export const resubmitRejectedClient = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'client') {
            return res.status(400).json({ message: "Only client users can be resubmitted" });
        }

        if (user.approvalStatus !== 'rejected') {
            return res.status(400).json({ message: "Only rejected clients can be resubmitted" });
        }

        // Reset to pending status
        user.approvalStatus = 'pending';
        user.rejectedBy = null;
        user.rejectedAt = null;
        user.rejectionMessage = null;

        await user.save();

        res.status(200).json({
            message: "Client resubmitted for approval successfully",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                approvalStatus: user.approvalStatus
            }
        });

    } catch (error) {
        console.log("Error in resubmitRejectedClient controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};