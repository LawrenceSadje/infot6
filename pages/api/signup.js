import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing email or password' });
  }

  try {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const { error: insertError } = await supabase.from('profiles').insert([
      {
        email,
        password: password, // Tandaan: I-hash ito sa production (e.g. gamit ang bcrypt)
        is_verified: false,
        verification_token: token,
      },
    ]);

    if (insertError) {
      throw insertError;
    }

    const verificationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/verify-email?token=${token}`;

    await transporter.sendMail({
      from: `"ML Hub Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Account Verification - ML Hub',
      html:`
        <h2>Welcome to ML Hub!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verificationLink}" target="_blank" style="padding: 10px 15px; background: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Signup successful! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}