import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function CreateArticle() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      // Get logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Check if user exists
      if (!user) {
        alert('You must login first.');
        setLoading(false);
        return;
      }

      // Insert article into Supabase
      const { error } = await supabase.from('articles').insert([
        {
          title,
          content,
          user_id: user.id,
          email: user.email,
        },
      ]);

      // Handle insert error
      if (error) {
        console.error(error);
        alert('Failed to publish article.');
        setLoading(false);
        return;
      }

      // Send email notification to admin
      try {
        await fetch('/api/send-article-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content,
            email: user.email,
            authorName:
              user.user_metadata?.full_name ||
              user.email ||
              'Unknown User',
          }),
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      alert('Article published successfully!');

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <form
        onSubmit={handlePublish}
        style={{
          width: '100%',
          maxWidth: '700px',
          background: '#1e293b',
          padding: '30px',
          borderRadius: '15px',
          color: 'white',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '25px',
          }}
        >
          Publish Article
        </h1>

        <input
          type="text"
          placeholder="Article Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: 'none',
            outline: 'none',
            fontSize: '16px',
          }}
        />

        <textarea
          placeholder="Write your article content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={10}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '16px',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Publishing...' : 'Publish Article'}
        </button>
      </form>
    </div>
  );
}