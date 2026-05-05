import { createClient } from '@supabase/supabase.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Invalid or missing token.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_token', token)
      .maybeSingle();

    if (error || !user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token.' });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_verified: true, verification_token: null })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    res.writeHead(302, { Location: `${process.env.NEXT_PUBLIC_SITE_URL}/login?verified=true`});
    res.end();
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}