import nodemailer from 'nodemailer';

export const contactController = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    console.log(req.body);

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields'
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create transporter - FIXED: changed createTransporter to createTransport
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or 'smtp.gmail.com'
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your app password
      }
    });


    // Email content for the business owner
    const businessOwnerMailOptions = {
      from: `"Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #333; text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-bottom: 15px;">Contact Details:</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: bold; color: #555; width: 30%;">Name:</td>
                <td style="padding: 10px; color: #333;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 10px; color: #333;">
                  <a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: bold; color: #555;">Phone:</td>
                <td style="padding: 10px; color: #333;">
                  <a href="tel:${phone}" style="color: #007bff; text-decoration: none;">${phone}</a>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-bottom: 15px;">Message:</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px; line-height: 1.6; color: #333;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              This email was sent from the Aswaq Forwarder contact form
            </p>
            <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
              Received on: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    };

    // Auto-reply email content for the sender
    const autoReplyMailOptions = {
      from: `"Aswaq Forwarder" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting Aswaq Forwarder - We received your message',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #007bff; margin: 0;">Aswaq Forwarder</h2>
            <p style="color: #666; margin: 5px 0 0 0;">Logistics & Forwarding Services</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">Hello ${name},</h3>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">
              Thank you for reaching out to us! We have successfully received your message and appreciate you taking the time to contact Aswaq Forwarder.
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">
              Our team will review your inquiry and get back to you within 24 hours during business days. In the meantime, feel free to browse our services or contact us directly if you have any urgent matters.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; margin: 20px 0;">
              <h4 style="color: #333; margin: 0 0 10px 0;">Your Message Summary:</h4>
              <p style="color: #666; margin: 0; font-style: italic;">"${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"</p>
            </div>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #333; margin-bottom: 15px;">Contact Information:</h4>
            <p style="color: #555; margin: 5px 0;">📧 Email: aswaqforwarder@gmail.com</p>
            <p style="color: #555; margin: 5px 0;">📞 Phone: +971521634640</p>
            <p style="color: #555; margin: 5px 0;">🏢 Address: Shed No.2, Ras Ali Khor Industrial Area 2, Dubai, UAE</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              Best regards,<br>
              <strong>Aswaq Forwarder Team</strong>
            </p>
          </div>
        </div>
      `
    };

    // Send email to business owner
    await transporter.sendMail(businessOwnerMailOptions);

    // Send auto-reply to the sender
    await transporter.sendMail(autoReplyMailOptions);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: {
        name,
        email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);

    // Handle specific nodemailer errors
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        success: false,
        message: 'Email authentication failed. Please check email configuration.'
      });
    }

    if (error.code === 'ENOTFOUND') {
      return res.status(500).json({
        success: false,
        message: 'Email service not found. Please check network connection.'
      });
    }

    // General error response
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};