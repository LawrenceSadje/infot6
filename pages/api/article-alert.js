// pages/api/send-article-email.js

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  // Allow POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // Get request body data
    const { title, content, email, authorName } = req.body;

    // Validate required fields
    if (!title || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing title or email',
      });
    }

    // Fetch active admin email from Supabase
    const { data: admins, error: adminError } = await supabase
      .from('admin_emails')
      .select('email')
      .eq('is_active', true);

    // Handle database errors
    if (adminError) {
      console.error('Supabase error:', adminError);

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch admin email',
      });
    }

    // Check if admin email exists
    if (!admins || admins.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'No active admin email found',
      });
    }

    // Use first active admin email
    const adminEmail = admins[0].email;

    console.log('Sending email to:', adminEmail);

    // Send email
    const info = await transporter.sendMail({
      from: `"ML Hub Article Alert" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `New Article Posted: ${title}`,

      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          
          <h2 style="color: #2563eb;">
            📢 New Article Posted
          </h2>

          <p>
            <strong>Author:</strong>
            ${authorName || 'Unknown User'}
          </p>

          <p>
            <strong>Email:</strong>
            ${email}
          </p>

          <p>
            <strong>Posted Time:</strong>
            ${new Date().toLocaleString('en-PH', {
              timeZone: 'Asia/Manila',
            })}
          </p>

          <hr />

          <h3>📝 Article Title</h3>
          <p>${title}</p>

          <h3>📄 Article Content</h3>
          <p>${content || 'No content provided.'}</p>

        </div>
      `,
    });

    console.log('Email sent successfully:', info.response);

    return res.status(200).json({
      success: true,
      message: 'Article alert sent successfully',
    });
  } catch (error) {
    console.error('Article email error:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}