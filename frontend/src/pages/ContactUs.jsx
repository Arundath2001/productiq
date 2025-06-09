import React, { useState, useEffect } from 'react';
import { Phone, Mail, X, CheckCircle } from 'lucide-react';
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

  const [showPopup, setShowPopup] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      // Check if phone starts with + and has at least 10 digits total, or no + and at least 10 digits
      if (cleanPhone.startsWith('+')) {
        if (cleanPhone.length < 11 || !/^\+[1-9]\d{9,14}$/.test(cleanPhone)) {
          errors.phone = 'International number must have country code + at least 10 digits (e.g., +971521634640)';
        }
      } else {
        if (cleanPhone.length < 10 || !/^[1-9]\d{9,14}$/.test(cleanPhone)) {
          errors.phone = 'Phone number must have at least 10 digits';
        }
      }
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format phone number as user types
    let formattedValue = value;
    if (name === 'phone') {
      // Remove all non-digit characters except + at the beginning
      formattedValue = value.replace(/[^\d+]/g, '');
      if (formattedValue.length > 1 && formattedValue.startsWith('+')) {
        formattedValue = '+' + formattedValue.slice(1).replace(/[^0-9]/g, '');
      } else if (!formattedValue.startsWith('+') && formattedValue.length > 0) {
        formattedValue = formattedValue.replace(/[^0-9]/g, '');
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (error || successMessage) {
      clearMessages();
    }
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await submitContact(formData);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
      setShowPopup(true);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  // Auto-hide popup after 5 seconds
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 w-6 h-6 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Message Sent!</h3>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Your message has been successfully sent. Our team will get back to you within 24 hours.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Got it
            </button>
          </div>
        </div>
      )}

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

          {/* Error Message (only show non-success messages) */}
          {error && !error.includes('Thank you for your message') && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Contact Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +971521634640 or 5551234567"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  formErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                required
              />
              {formErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message"
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
                  formErrors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                required
              />
              {formErrors.message && (
                <p className="mt-1 text-sm text-red-600">{formErrors.message}</p>
              )}
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