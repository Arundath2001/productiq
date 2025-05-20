import { io } from "../lib/socket.js";
import User from "../models/user.model.js";
import { Expo } from 'expo-server-sdk';

// Main notification controller
export const notification = async (req, res) => {
    try {
        const { message, title = "Aswaq Forwarder", sendPushNotification = true } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message content is required" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admin can broadcast messages" });
        }

        // Emit WebSocket message
        io.emit("broadcast-message", {
            title,
            message,
            timestamp: new Date(),
            sender: req.user.username || "Admin"
        });

        // Send push notification if enabled
        if (sendPushNotification) {
            const usersWithTokens = await User.find(
                { expoPushToken: { $exists: true, $ne: "" } },
                "expoPushToken"
            );

            const tokens = usersWithTokens
                .map(user => user.expoPushToken)
                .filter(token => token && token.startsWith('ExponentPushToken[')); // basic validation

            // Filter for the desired experience ID
            const validTokens = tokens.filter(token => {
                const projectId = Expo.getPushNotificationExperienceId(token);
                return projectId === '@arundath44/Aswaq';
            });

            if (validTokens.length > 0) {
                await sendPushNotifications(validTokens, message, title);
            } else {
                console.warn("No valid push tokens found for @arundath44/Aswaq.");
            }
        }

        res.status(200).json({
            success: true,
            message: "Broadcast sent successfully",
            recipientCount: io.engine.clientsCount || 0
        });

    } catch (error) {
        console.error("Error in broadcast message controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Helper function to send push notifications
const sendPushNotifications = async (tokens, message, title) => {
    const expo = new Expo();

    const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body: message,
        data: { type: 'broadcast' },
    }));

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
        try {
            await expo.sendPushNotificationsAsync(chunk);
            console.log(`Push notifications sent to ${chunk.length} devices`);
        } catch (error) {
            console.error('Error sending push notifications:', error);
        }
    }
};
