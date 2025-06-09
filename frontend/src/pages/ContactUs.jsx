import React, { useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import { useContactStore } from '../store/useContact.js';
import images from '../lib/images.js';

const ContactUs = () => {
  const {
    submitContact,
    isSubmitting,
    error,
    successMessage,
    clearMessages
  } = useContactStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (error || successMessage) {
      clearMessages();
    }
  };

  const handleSubmit = async () => {
    try {
      await submitContact(formData);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={images.logo}
              alt="Aswaq Forwarder Logo"
              className="h-12 w-12 object-contain rounded-full shadow-sm mr-3"
            />
            <span className="text-xl font-bold text-gray-900">Aswaq Forwarder</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-12">
          {/* Heading */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-gray-600">
              We're here to help. Reach out to us with any questions or inquiries, and our team will get back to you promptly.
            </p>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Contact Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                disabled={isSubmitting}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>

          {/* Contact Info */}
          <div className="pt-10 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center space-x-3">
                <Mail className="text-blue-500" />
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Email</h3>
                  <p className="text-gray-900">aswaqforwarder@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="text-blue-500" />
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Phone</h3>
                  <p className="text-gray-900">+971521634640</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">© {currentYear} Aswaq Forwarder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ContactUs;
