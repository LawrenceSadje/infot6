import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [articles, setArticles] = useState([])

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [replyText, setReplyText] = useState('')
  const [activeReply, setActiveReply] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/')
      } else {
        setUser(data.user)
        fetchArticles()
        fetchComments()
      }
    }

    checkUser()
  }, [])

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('likes', { ascending: false })

    setArticles(data || [])
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    setComments(data || [])
  }

  const handlePublish = async () => {
    if (!title || !content) {
      alert('Please fill all fields')
      return
    }

    await supabase.from('articles').insert([
      {
        title,
        content,
        user_id: user.id,
        likes: 0,
        dislikes: 0,
      },
    ])

    setTitle('')
    setContent('')
    fetchArticles()
  }

  const handleDelete = async (id) => {
    const article = articles.find(a => a.id === id)

    if (!article) return

    if (article.user_id !== user.id) {
      alert("You are not allowed to delete this article")
      return
    }

    const confirmDelete = confirm('Are you sure?')
    if (!confirmDelete) return

    await supabase.from('articles').delete().eq('id', id)

    fetchArticles()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI', background: '#f5f7fb', minHeight: '100vh' }}>

      {/* 🎨 ANIMATION */}
      <style jsx>{`
        @keyframes glowPulse {
          0% {
            box-shadow: 0 0 4px rgba(34, 197, 94, 0.35),
                        0 0 10px rgba(34, 197, 94, 0.2);
            transform: translateY(0px);
            opacity: 0.95;
          }

          50% {
            box-shadow: 0 0 14px rgba(34, 197, 94, 0.9),
                        0 0 28px rgba(34, 197, 94, 0.6);
            transform: translateY(-2px);
            opacity: 1;
          }

          100% {
            box-shadow: 0 0 4px rgba(34, 197, 94, 0.35),
                        0 0 10px rgba(34, 197, 94, 0.2);
            transform: translateY(0px);
            opacity: 0.95;
          }
        }

        .owner-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 12px;
          border-radius: 999px;
          font-weight: 600;
          animation: glowPulse 2s ease-in-out infinite;
          will-change: transform, box-shadow;
        }
      `}</style>

      <h1>Dashboard 🚀</h1>

      {/* CREATE ARTICLE */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Publish Article</h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: '100%', height: '120px', padding: '10px' }}
        />

        <button onClick={handlePublish}>Publish</button>
      </div>

      {/* ARTICLES */}
      <h2>Top Articles</h2>

      {articles.map((article) => (
        <div
          key={article.id}
          style={{
            marginBottom: '20px',
            padding: '15px',
            borderRadius: '12px',
            background: 'white',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3>{article.title}</h3>

          {/* ⭐ OWNER BADGE */}
          {article.user_id === user.id && (
            <span className="owner-badge">
              ⭐ You own this article
            </span>
          )}

          <p>{article.content}</p>

          <p>👍 {article.likes} | 👎 {article.dislikes}</p>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button>👍 Like</button>
            <button>👎 Dislike</button>

            <button onClick={() => handleDelete(article.id)}>
              🗑 Delete
            </button>

            <button>
              🔗 Share
            </button>
          </div>
        </div>
      ))}

      {/* 🚪 LOGOUT BUTTON (RESTORED) */}
      <div style={{ marginTop: '40px' }}>
        <button
          onClick={handleLogout}
          style={{
            background: '#ef4444',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}