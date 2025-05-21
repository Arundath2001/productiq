import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useSendNotification } from '../store/useSendNotification.js';

const SendNotification = () => {
  const { sendNotification, isLoading, error, clearError } = useSendNotification();

  const [notificationData, setNotificationData] = useState({
    title: 'Aswaq Forwarder',
    message: '',
    sendPushNotification: true
  });

  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    let timer;
    if (successMessage) {
      timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationData({
      ...notificationData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (successMessage) setSuccessMessage('');
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await sendNotification(notificationData);
      setSuccessMessage(`Notification sent successfully to ${result.recipientCount} recipients!`);

      setNotificationData({
        title: 'Aswaq Forwarder',
        message: '',
        sendPushNotification: true
      });
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  return (
    <div className="w-full mx-auto p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Send Notification</h1>

      {successMessage && (
        <div className="relative mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md">
          <div className="pr-8">{successMessage}</div>

        </div>
      )}

      {error && (
        <div className="relative mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
          <div className="pr-8">Error: {error}</div>
          <button
            onClick={clearError}
            className="absolute top-3 right-3 text-red-700 hover:text-red-900 focus:outline-none"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Notification Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={notificationData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave blank to use default: "Aswaq Forwarder"
          </p>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message Content *
          </label>
          <textarea
            id="message"
            name="message"
            value={notificationData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder="Enter your message here..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="sendPushNotification"
            name="sendPushNotification"
            checked={notificationData.sendPushNotification}
            onChange={handleChange}
            className="h-5 w-5 border-gray-300 rounded text-black focus:ring-black"
          />
          <label htmlFor="sendPushNotification" className="ml-2 block text-sm text-gray-700">
            Send as Push Notification
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || !notificationData.message}
          className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 transition duration-200 disabled:bg-gray-800 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
};

export default SendNotification;