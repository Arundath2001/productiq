import { io } from "../lib/socket.js";
import User from "../models/user.model.js";
import { Expo } from 'expo-server-sdk';

export const notification = async (req, res) => {
    try {
        const { message, title = "Aswaq Forwarder", sendPushNotification = true } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message content is required" });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admin can broadcast messages" });
        }

        io.emit("broadcast-message", {
            title,
            message,
            timestamp: new Date(),
            sender: req.user.username || "Admin"
        });

        if (sendPushNotification) {
            const usersWithTokens = await User.find(
                { expoPushToken: { $exists: true, $ne: "" } },
                "expoPushToken"
            );

            const tokens = usersWithTokens
                .map(user => user.expoPushToken)
                .filter(Boolean);

            if (tokens.length > 0) {
                await sendPushNotificationsGroupedByExperienceId(tokens, message, title);
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

const sendPushNotificationsGroupedByExperienceId = async (tokens, message, title) => {
    const expo = new Expo();

    const groupedByExperienceId = {};

    for (const token of tokens) {
        const experienceId = Expo.getPushNotificationExperienceId(token);
        if (!groupedByExperienceId[experienceId]) {
            groupedByExperienceId[experienceId] = [];
        }
        groupedByExperienceId[experienceId].push(token);
    }

    for (const [experienceId, tokenGroup] of Object.entries(groupedByExperienceId)) {
        const messages = tokenGroup.map(token => ({
            to: token,
            sound: 'default',
            title,
            body: message,
            data: { type: 'broadcast' },
        }));

        const chunks = expo.chunkPushNotifications(messages);

        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(`Sent to ${chunk.length} tokens for ${experienceId}`);
            } catch (error) {
                console.error(`Failed to send to ${experienceId}:`, error);
            }
        }
    }
};
