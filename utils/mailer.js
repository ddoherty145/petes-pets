const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create transporter with Mailgun SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'api',
    pass: process.env.MAILGUN_API_KEY
  }
});

// Simple template renderer
const renderTemplate = (templateName, context) => {
  const templatePath = path.join(__dirname, '..', 'views', 'emails', `${templateName}.handlebars`);
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Simple handlebars-like replacement
  Object.keys(context).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, context[key]);
  });
  
  return template;
};

/**
 * Send purchase confirmation email
 * @param {Object} user - User object with email property
 * @param {Object} pet - Pet object with name, species, price, purchasedAt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMail = async (user, pet, req, res) => {
  try {
    const context = {
      petName: pet.name,
      species: pet.species,
      amount: (pet.price || 0).toFixed(2),
      purchaseDate: pet.purchasedAt ? pet.purchasedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };
    
    const html = renderTemplate('email', context);
    
    const info = await transporter.sendMail({
      from: process.env.MAILGUN_FROM,
      to: user.email,
      subject: `Your New Pet: ${pet.name}!`,
      html: html
    });
    
    console.log('✅ Email sent successfully:', info.response);
    console.log('📧 Message ID:', info.messageId);
    
    // Redirect to pet page regardless of email success
    res.redirect(`/pets/${req.params.id}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
    console.error('📧 Failed to send email to:', user.email);
    
    // Still redirect to pet page even if email fails
    res.redirect(`/pets/${req.params.id}`);
  }
};

/**
 * Send welcome email for new users
 * @param {Object} user - User object with email and name properties
 * @param {Object} res - Express response object
 */
const sendWelcomeEmail = async (user, res) => {
  try {
    const context = {
      userName: user.name || 'Pet Lover',
      userEmail: user.email
    };
    
    const html = renderTemplate('welcome', context);
    
    const info = await transporter.sendMail({
      from: process.env.MAILGUN_FROM,
      to: user.email,
      subject: 'Welcome to Pete\'s Pet Emporium!',
      html: html
    });
    
    console.log('✅ Welcome email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Welcome email error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send notification email to admin about new purchase
 * @param {Object} pet - Pet object
 * @param {Object} user - User object
 * @param {Object} res - Express response object
 */
const sendAdminNotification = async (pet, user, res) => {
  try {
    const context = {
      petName: pet.name,
      species: pet.species,
      amount: (pet.price || 0).toFixed(2),
      customerEmail: user.email,
      purchaseDate: new Date().toISOString().split('T')[0]
    };
    
    const html = renderTemplate('admin-notification', context);
    
    const info = await transporter.sendMail({
      from: process.env.MAILGUN_FROM,
      to: process.env.ADMIN_EMAIL || 'admin@petstore.com',
      subject: `New Pet Purchase: ${pet.name}`,
      html: html
    });
    
    console.log('✅ Admin notification sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Admin notification error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { 
  sendMail, 
  sendWelcomeEmail, 
  sendAdminNotification 
};
