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
            
            const tokens = usersWithTokens.map(user => user.expoPushToken).filter(token => token);
            
            if (tokens.length > 0) {
                await sendPushNotifications(tokens, message, title);
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


const sendPushNotifications = async (tokens, message, title) => {
    let expo = new Expo();
    
    const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: message,
        data: { type: 'broadcast' },
    }));

    try {
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`Push notifications sent to ${tokens.length} devices`);
        return tickets;
    } catch (error) {
        console.error('Error sending push notifications:', error);
        throw error;
    }
};