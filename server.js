require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));

// Serve resume PDF and other static files from /public
app.use('/static', express.static(path.join(__dirname, 'public')));

// Resume download endpoint
app.get('/api/resume', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'resume.pdf');
  res.download(filePath, 'Rashi_Vishwakarma_Resume.pdf', err => {
    if (err) {
      console.error('Failed to send resume:', err);
      res.status(500).send('Failed to download resume');
    }
  });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (typeof message !== 'string' || message.trim().length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Portfolio Contact Form" <${process.env.SMTP_USER}>`,
      to: process.env.RECEIVER_EMAIL,
      subject: `New message from ${name} <${email}>`,
      text: message,
      html: `<p>You have a new message from your portfolio contact form:</p>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});