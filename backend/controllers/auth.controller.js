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
            from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Registration OTP - Aswaq Forwarder',
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">Welcome to Aswaq!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 25px 20px;">
                <p style="color: #4a5568; margin: 0 0 20px; font-size: 15px; line-height: 1.5;">Your verification code:</p>
                
                <!-- OTP -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #bbf7d0; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
                    <div style="font-size: 32px; font-weight: 700; color: #065f46; letter-spacing: 6px; font-family: 'Courier New', monospace;">
                        ${otp}
                    </div>
                    <div style="margin-top: 12px;">
                        <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                            Expires in 10 min
                        </span>
                    </div>
                </div>
                
                <!-- Welcome Note -->
                <div style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 12px 15px; border-radius: 0 6px 6px 0; margin: 20px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.4;">
                        <strong>Almost there!</strong> Complete registration to start forwarding packages.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 15px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                    © 2025 Aswaq Forwarder
                </p>
            </div>
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
            from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - Aswaq Forwarder',
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px 20px; text-align: center;">
                <div style="color: white; font-size: 28px; margin-bottom: 8px;">🔐</div>
                <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 600;">Password Reset</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 25px 20px;">
                <p style="color: #4a5568; margin: 0 0 20px; font-size: 15px; line-height: 1.5;">Your password reset code:</p>
                
                <!-- OTP -->
                <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px solid #e2e8f0; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
                    <div style="font-size: 32px; font-weight: 700; color: #2d3748; letter-spacing: 6px; font-family: 'Courier New', monospace;">
                        ${otp}
                    </div>
                    <div style="margin-top: 12px;">
                        <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 16px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                            Expires in 10 min
                        </span>
                    </div>
                </div>
                
                <!-- Security Note -->
                <div style="background: #fef5e7; border-left: 3px solid #f6d55c; padding: 12px 15px; border-radius: 0 6px 6px 0; margin: 20px 0;">
                    <p style="color: #744210; margin: 0; font-size: 13px; line-height: 1.4;">
                        <strong>Security:</strong> One-time use only. Ignore if you didn't request this.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 15px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #a0aec0; margin: 0; font-size: 12px;">
                    © 2025 Aswaq Forwarder
                </p>
            </div>
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
                from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Reset Successful - Aswaq Forwarder',
                html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 30px; text-align: center;">
                <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    <div style="color: white; font-size: 36px;">✅</div>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Password Updated Successfully</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Your account is now secure with your new password</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
                <!-- Success Message -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #a7f3d0; padding: 25px; margin: 25px 0; border-radius: 16px; position: relative;">
                        <div style="color: #065f46; font-size: 18px; font-weight: 600; margin-bottom: 10px;">🎉 All Set!</div>
                        <p style="color: #047857; font-size: 16px; margin: 0; line-height: 1.6;">Your password has been successfully updated. You can now log in to your Aswaq Forwarder account with your new password.</p>
                    </div>
                </div>
                
                
                <!-- Next Steps -->
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 25px; margin: 25px 0; border-radius: 0 12px 12px 0;">
                    <h3 style="color: #1e40af; margin: 0 0 15px; font-size: 16px; font-weight: 600;">🚀 What's Next?</h3>
                    <ul style="color: #1e40af; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Log in to your account with your new password</li>
                        <li>Review your account settings and security preferences</li>
                        <li>Continue using Aswaq Forwarder services seamlessly</li>
                    </ul>
                </div>
                
                <!-- Security Alert -->
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <div style="display: flex; align-items: flex-start;">
                        <div style="color: #dc2626; margin-right: 15px; font-size: 24px;">🚨</div>
                        <div>
                            <h4 style="color: #991b1b; margin: 0 0 10px; font-size: 16px; font-weight: 600;">Didn't change your password?</h4>
                            <p style="color: #7f1d1d; margin: 0 0 15px; font-size: 14px; line-height: 1.6;">If you did not request this password change, your account may be compromised. Please take immediate action:</p>
                            <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin-top: 15px;">
                                <p style="color: #991b1b; margin: 0 0 10px; font-size: 14px; font-weight: 600;">Immediate Steps:</p>
                                <ol style="color: #7f1d1d; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                                    <li>Contact our support team immediately</li>
                                    <li>Check your account for any unauthorized activity</li>
                                    <li>Review and update your security settings</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Timestamp -->
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
                    <p style="color: #64748b; margin: 0; font-size: 13px;">
                        <strong>Timestamp:</strong> ${new Date().toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                })}
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; margin: 0 0 15px; font-size: 14px;">
                    <strong style="color: #059669;">Aswaq Forwarder</strong> - Keeping your account secure
                </p>
                <div style="display: inline-flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap;">
                    <a href="#" style="color: #059669; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 16px; background-color: #ecfdf5; border-radius: 6px;">🛡️ Security Center</a>
                    <a href="#" style="color: #059669; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 16px; background-color: #ecfdf5; border-radius: 6px;">💬 Contact Support</a>
                    <a href="#" style="color: #059669; text-decoration: none; font-size: 13px; font-weight: 500; padding: 8px 16px; background-color: #ecfdf5; border-radius: 6px;">📋 Account Settings</a>
                </div>
                <p style="color: #a0aec0; margin: 20px 0 0; font-size: 12px;">
                    © 2025 Aswaq Forwarder. All rights reserved.
                </p>
            </div>
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
            from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Resend Password Reset OTP - Aswaq Forwarder',
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    <div style="color: white; font-size: 36px;">🔐</div>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Security Code Resent</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Your new password reset code is ready</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <p style="color: #4a5568; font-size: 18px; margin: 0 0 25px; line-height: 1.6;">We've generated a new OTP for your password reset request.</p>
                    
                    <!-- OTP Display -->
                    <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px solid #e2e8f0; padding: 25px; margin: 25px 0; border-radius: 16px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(102, 126, 234, 0.05) 0%, transparent 70%); pointer-events: none;"></div>
                        <p style="color: #718096; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Security Code</p>
                        <div style="font-size: 36px; font-weight: 700; color: #2d3748; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); position: relative;">
                            ${otp}
                        </div>
                        <div style="margin-top: 15px;">
                            <span style="display: inline-block; background-color: #667eea; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                ⏱️ Expires in 10 minutes
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #4c51bf; margin: 0 0 12px; font-size: 16px; font-weight: 600;">How to use this code:</h3>
                    <ol style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
                        <li>Return to the password reset page</li>
                        <li>Enter the 6-digit code above</li>
                        <li>Create your new secure password</li>
                    </ol>
                </div>
                
                <!-- Security Notice -->
                <div style="background-color: #fef5e7; border: 1px solid #f6d55c; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <div style="display: flex; align-items: flex-start;">
                        <div style="color: #d69e2e; margin-right: 12px; font-size: 20px;">⚠️</div>
                        <div>
                            <h4 style="color: #744210; margin: 0 0 8px; font-size: 14px; font-weight: 600;">Security Notice</h4>
                            <p style="color: #744210; margin: 0; font-size: 14px; line-height: 1.5;">If you didn't request this password reset, please secure your account immediately and contact our support team.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; margin: 0 0 15px; font-size: 14px;">
                    This is an automated message from <strong style="color: #4a5568;">Aswaq Forwarder</strong>
                </p>
                <div style="display: inline-flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap;">
                    <a href="#" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 500;">Support Center</a>
                    <span style="color: #cbd5e0;">•</span>
                    <a href="#" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 500;">Privacy Policy</a>
                    <span style="color: #cbd5e0;">•</span>
                    <a href="#" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 500;">Security</a>
                </div>
                <p style="color: #a0aec0; margin: 20px 0 0; font-size: 12px;">
                    © 2025 Aswaq Forwarder. All rights reserved.
                </p>
            </div>
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

        // Send email notification to admin about new user registration
        try {
            const transporter = createTransporter();
            const adminEmail = process.env.EMAIL_USER; // Make sure to set this in your .env file

            if (adminEmail) {
                const adminMailOptions = {
                    from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
                    to: adminEmail,
                    subject: 'New Client Registration - Aswaq Forwarder',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #007bff; margin: 0;">🆕 New Client Registration</h1>
                            </div>
                            
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h2 style="color: #333; margin-top: 0;">Admin Notification</h2>
                                <p style="font-size: 16px; line-height: 1.6; color: #555;">
                                    A new client has registered and is waiting for approval.
                                </p>
                            </div>

                            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h3 style="color: #0066cc; margin-top: 0;">Client Details:</h3>
                                <ul style="list-style: none; padding: 0;">
                                    <li style="margin-bottom: 10px;"><strong>Username:</strong> ${username}</li>
                                    <li style="margin-bottom: 10px;"><strong>Email:</strong> ${email}</li>
                                    <li style="margin-bottom: 10px;"><strong>Phone:</strong> ${countryCode} ${phoneNumber}</li>
                                    <li style="margin-bottom: 10px;"><strong>Registration Date:</strong> ${new Date().toLocaleString()}</li>
                                    <li style="margin-bottom: 10px;"><strong>Status:</strong> Pending Approval</li>
                                </ul>
                            </div>

                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                                <p style="margin: 0; color: #856404;">
                                    <strong>Action Required:</strong><br>
                                    Please log in to the admin panel to review and approve this client registration. 
                                    The client will need to be assigned a company code upon approval.
                                </p>
                            </div>

                            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="color: #666; font-size: 14px;">
                                    This email was sent automatically when a new client registered.<br>
                                    Please do not reply to this email.
                                </p>
                                <p style="color: #999; font-size: 12px;">
                                    © ${new Date().getFullYear()} Aswaq Forwarder. All rights reserved.
                                </p>
                            </div>
                        </div>
                    `
                };

                await transporter.sendMail(adminMailOptions);
                console.log(`Admin notification email sent successfully to: ${adminEmail}`);
            } else {
                console.log("Admin email not configured. Skipping admin notification.");
            }
        } catch (emailError) {
            console.log("Error sending admin notification email:", emailError.message);
            // Don't fail the request if email fails, but log the error
        }

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
            from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Resend Registration OTP - Aswaq Forwarder',
            html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                <div style="background-color: rgba(255, 255, 255, 0.1); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                    <div style="color: white; font-size: 36px;">🚀</div>
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">Welcome Aboard!</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">Your new registration code is ready</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <p style="color: #4a5568; font-size: 18px; margin: 0 0 25px; line-height: 1.6;">We've generated a fresh verification code to complete your registration with <strong style="color: #10b981;">Aswaq Forwarder</strong>.</p>
                    
                    <!-- OTP Display -->
                    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #bbf7d0; padding: 25px; margin: 25px 0; border-radius: 16px; position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%); pointer-events: none;"></div>
                        <p style="color: #059669; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                        <div style="font-size: 36px; font-weight: 700; color: #065f46; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); position: relative;">
                            ${otp}
                        </div>
                        <div style="margin-top: 15px;">
                            <span style="display: inline-block; background-color: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                ⏱️ Expires in 10 minutes
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #065f46; margin: 0 0 12px; font-size: 16px; font-weight: 600;">Complete your registration:</h3>
                    <ol style="color: #4a5568; margin: 0; padding-left: 20px; line-height: 1.6;">
                        <li>Return to the registration page</li>
                        <li>Enter the 6-digit verification code above</li>
                        <li>Complete your profile setup</li>
                        <li>Start using Aswaq Forwarder services!</li>
                    </ol>
                </div>
                
                <!-- Welcome Benefits -->
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <div style="text-align: center;">
                        <h3 style="color: #92400e; margin: 0 0 15px; font-size: 18px; font-weight: 600;">🎉 What's waiting for you?</h3>
                        <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
                            <div style="flex: 1; min-width: 140px; text-align: center;">
                                <div style="color: #d97706; font-size: 24px; margin-bottom: 8px;">📦</div>
                                <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0;">Fast Forwarding</p>
                            </div>
                            <div style="flex: 1; min-width: 140px; text-align: center;">
                                <div style="color: #d97706; font-size: 24px; margin-bottom: 8px;">🌍</div>
                                <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0;">Global Reach</p>
                            </div>
                            <div style="flex: 1; min-width: 140px; text-align: center;">
                                <div style="color: #d97706; font-size: 24px; margin-bottom: 8px;">🔒</div>
                                <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0;">Secure Service</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Security Notice -->
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <div style="display: flex; align-items: flex-start;">
                        <div style="color: #dc2626; margin-right: 12px; font-size: 20px;">🛡️</div>
                        <div>
                            <h4 style="color: #991b1b; margin: 0 0 8px; font-size: 14px; font-weight: 600;">Didn't request this?</h4>
                            <p style="color: #991b1b; margin: 0; font-size: 14px; line-height: 1.5;">If you didn't attempt to register with Aswaq Forwarder, you can safely ignore this email. No account will be created without verification.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096; margin: 0 0 15px; font-size: 14px;">
                    Welcome to <strong style="color: #10b981;">Aswaq Forwarder</strong> - Your trusted forwarding partner
                </p>
                <div style="display: inline-flex; gap: 20px; align-items: center; justify-content: center; flex-wrap: wrap;">
                    <a href="#" style="color: #10b981; text-decoration: none; font-size: 13px; font-weight: 500;">Help Center</a>
                    <span style="color: #cbd5e0;">•</span>
                    <a href="#" style="color: #10b981; text-decoration: none; font-size: 13px; font-weight: 500;">Contact Support</a>
                    <span style="color: #cbd5e0;">•</span>
                    <a href="#" style="color: #10b981; text-decoration: none; font-size: 13px; font-weight: 500;">Terms of Service</a>
                </div>
                <p style="color: #a0aec0; margin: 20px 0 0; font-size: 12px;">
                    © 2025 Aswaq Forwarder. All rights reserved.
                </p>
            </div>
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

// Updated approveClient function with email notification
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

        // Check if user has email
        if (!user.email) {
            return res.status(400).json({ message: "User email not found. Cannot send approval notification." });
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

        // Send push notification
        if (user.expoPushTokens && user.expoPushTokens.length > 0) {
            const userTokens = user.expoPushTokens.map(tokenObj => tokenObj.token);
            const notificationMessage = isReapproval
                ? `🎉 Great news! Your account has been re-approved and you've been assigned to company code: ${companyCode}. You can now access all features again.`
                : `🎉 Congratulations! Your account has been approved and you've been assigned to company code: ${companyCode}. You can now access all features.`;

            await sendPushNotificationToMultiple(userTokens, notificationMessage);
        }

        // Send email notification
        try {
            const transporter = createTransporter();
            const approverName = user.approvedBy?.username || 'Admin';

            const mailOptions = {
                from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: isReapproval
                    ? 'Account Re-Approved - Aswaq Forwarder'
                    : 'Account Approved - Aswaq Forwarder',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #28a745; margin: 0;">🎉 ${isReapproval ? 'Account Re-Approved!' : 'Account Approved!'}</h1>
                        </div>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="color: #333; margin-top: 0;">Hello ${user.username},</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #555;">
                                ${isReapproval
                        ? 'Great news! Your account has been re-approved and you can now access all features again.'
                        : 'Congratulations! Your account has been approved and you now have access to all features.'
                    }
                            </p>
                        </div>

                        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="color: #0066cc; margin-top: 0;">Account Details:</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 10px;"><strong>Username:</strong> ${user.username}</li>
                                <li style="margin-bottom: 10px;"><strong>Email:</strong> ${user.email}</li>
                                <li style="margin-bottom: 10px;"><strong>Company Code:</strong> ${companyCode}</li>
                                <li style="margin-bottom: 10px;"><strong>Approved By:</strong> ${approverName}</li>
                                <li style="margin-bottom: 10px;"><strong>Approved On:</strong> ${new Date().toLocaleString()}</li>
                                ${approvalNotes ? `<li style="margin-bottom: 10px;"><strong>Notes:</strong> ${approvalNotes}</li>` : ''}
                            </ul>
                        </div>

                        <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                            <p style="margin: 0; color: #155724;">
                                <strong>What's Next?</strong><br>
                                You can now log in to your account and access all available features. If you have any questions or need assistance, please don't hesitate to contact our support team.
                            </p>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; font-size: 14px;">
                                This email was sent automatically. Please do not reply to this email.<br>
                                If you have any questions, please contact our support team.
                            </p>
                            <p style="color: #999; font-size: 12px;">
                                © ${new Date().getFullYear()} Aswaq Forwarder. All rights reserved.
                            </p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Approval email sent successfully to: ${user.email}`);
        } catch (emailError) {
            console.log("Error sending approval email:", emailError.message);
            // Don't fail the request if email fails, but log the error
        }

        const successMessage = isReapproval
            ? "Client re-approved successfully. Notifications sent via push and email."
            : "Client approved successfully. Notifications sent via push and email.";

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

// Updated rejectClient function with email notification
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

        // Check if user has email
        if (!user.email) {
            return res.status(400).json({ message: "User email not found. Cannot send rejection notification." });
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

        // Send push notification
        if (user.expoPushTokens && user.expoPushTokens.length > 0) {
            const userTokens = user.expoPushTokens.map(tokenObj => tokenObj.token);
            const notificationMessage = isRerejection
                ? `⚠️ Your account approval has been revoked. Reason: ${rejectionMessage}. Please contact support for more information.`
                : `❌ Your account approval has been declined. Reason: ${rejectionMessage}. Please contact support for more information.`;

            await sendPushNotificationToMultiple(userTokens, notificationMessage);
        }

        // Send email notification
        try {
            const transporter = createTransporter();
            const rejectorName = user.rejectedBy?.username || 'Admin';

            const mailOptions = {
                from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: isRerejection
                    ? 'Account Approval Revoked - Aswaq Forwarder'
                    : 'Account Application Update - Aswaq Forwarder',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #dc3545; margin: 0;">
                                ${isRerejection ? '⚠️ Account Approval Revoked' : '❌ Account Application Update'}
                            </h1>
                        </div>
                        
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="color: #333; margin-top: 0;">Hello ${user.username},</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #555;">
                                ${isRerejection
                        ? 'We regret to inform you that your account approval has been revoked.'
                        : 'We have reviewed your account application, and unfortunately, we are unable to approve it at this time.'
                    }
                            </p>
                        </div>

                        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
                            <h3 style="color: #721c24; margin-top: 0;">Reason for ${isRerejection ? 'Revocation' : 'Rejection'}:</h3>
                            <p style="margin: 0; color: #721c24; font-weight: 500;">
                                ${rejectionMessage}
                            </p>
                        </div>

                        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="color: #0066cc; margin-top: 0;">Application Details:</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 10px;"><strong>Username:</strong> ${user.username}</li>
                                <li style="margin-bottom: 10px;"><strong>Email:</strong> ${user.email}</li>
                                <li style="margin-bottom: 10px;"><strong>${isRerejection ? 'Revoked' : 'Rejected'} By:</strong> ${rejectorName}</li>
                                <li style="margin-bottom: 10px;"><strong>${isRerejection ? 'Revoked' : 'Rejected'} On:</strong> ${new Date().toLocaleString()}</li>
                                ${previousData && previousData.companyCode ?
                        `<li style="margin-bottom: 10px;"><strong>Previous Company Code:</strong> ${previousData.companyCode}</li>`
                        : ''
                    }
                            </ul>
                        </div>

                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                            <p style="margin: 0; color: #856404;">
                                <strong>What can you do next?</strong><br>
                                If you believe this decision was made in error or if you have additional information to provide, 
                                please contact our support team. You may also reapply for account approval in the future 
                                after addressing the concerns mentioned above.
                            </p>
                        </div>

                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="color: #666; font-size: 14px;">
                                This email was sent automatically. Please do not reply to this email.<br>
                                If you have any questions, please contact our support team.
                            </p>
                            <p style="color: #999; font-size: 12px;">
                                © ${new Date().getFullYear()} Aswaq Forwarder. All rights reserved.
                            </p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Rejection email sent successfully to: ${user.email}`);
        } catch (emailError) {
            console.log("Error sending rejection email:", emailError.message);
            // Don't fail the request if email fails, but log the error
        }

        const successMessage = isRerejection
            ? "Client approval revoked successfully. Notifications sent via push and email."
            : "Client rejected successfully. Notifications sent via push and email.";

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