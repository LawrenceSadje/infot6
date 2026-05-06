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

  // 📥 ARTICLES
  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('likes', { ascending: false })

    setArticles(data || [])
  }

  // 💬 COMMENTS
  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    setComments(data || [])
  }

  // 📝 PUBLISH
  const handlePublish = async () => {
    if (!title || !content) return alert('Fill all fields')

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

  // 🔗 SHARE
  const handleShare = (id) => {
    const link = `${window.location.origin}/article/${id}`
    navigator.clipboard.writeText(link)
    alert('Link copied!')
  }

  // 👍 LIKE
  const handleLike = async (article) => {
    const { data: existing } = await supabase
      .from('article_reactions')
      .select('*')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.type === 'like') return alert('Already liked')

    if (existing?.type === 'dislike') {
      await supabase
        .from('articles')
        .update({ dislikes: Math.max(0, article.dislikes - 1) })
        .eq('id', article.id)

      await supabase
        .from('article_reactions')
        .delete()
        .eq('id', existing.id)
    }

    await supabase.from('article_reactions').insert([
      {
        article_id: article.id,
        user_id: user.id,
        type: 'like',
      },
    ])

    await supabase
      .from('articles')
      .update({ likes: article.likes + 1 })
      .eq('id', article.id)

    fetchArticles()
  }

  // 👎 DISLIKE
  const handleDislike = async (article) => {
    const { data: existing } = await supabase
      .from('article_reactions')
      .select('*')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing?.type === 'dislike') return alert('Already disliked')

    if (existing?.type === 'like') {
      await supabase
        .from('articles')
        .update({ likes: Math.max(0, article.likes - 1) })
        .eq('id', article.id)

      await supabase
        .from('article_reactions')
        .delete()
        .eq('id', existing.id)
    }

    await supabase.from('article_reactions').insert([
      {
        article_id: article.id,
        user_id: user.id,
        type: 'dislike',
      },
    ])

    await supabase
      .from('articles')
      .update({ dislikes: article.dislikes + 1 })
      .eq('id', article.id)

    fetchArticles()
  }

  // 🗑 DELETE (ONLY OWNER)
  const handleDelete = async (article) => {
    if (article.user_id !== user.id) {
      alert("You can't delete this article")
      return
    }

    await supabase
      .from('articles')
      .delete()
      .eq('id', article.id)

    fetchArticles()
  }

  // 💬 COMMENT
  const handleComment = async (articleId) => {
    if (!commentText) return

    await supabase.from('comments').insert([
      {
        article_id: articleId,
        user_id: user.id,
        content: commentText,
        parent_id: null,
      },
    ])

    setCommentText('')
    fetchComments()
  }

  // ↩️ REPLY
  const handleReply = async (articleId, parentId) => {
    if (!replyText) return

    await supabase.from('comments').insert([
      {
        article_id: articleId,
        user_id: user.id,
        content: replyText,
        parent_id: parentId,
      },
    ])

    setReplyText('')
    setActiveReply(null)
    fetchComments()
  }

  // 🚪 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ padding: 40, fontFamily: 'Segoe UI' }}>

      {/* HEADER + LOGOUT */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h1>Dashboard 🚀</h1>

        <button
          onClick={handleLogout}
          style={{
            background: '#ff4d4f',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* CREATE ARTICLE */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <br /><br />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <br /><br />

        <button onClick={handlePublish}>
          Publish
        </button>
      </div>

      <h2>Articles</h2>

      {articles.map((article) => (
        <div
          key={article.id}
          style={{
            marginTop: 20,
            padding: 20,
            background: '#fff',
            borderRadius: 10,
          }}
        >
          <h3>{article.title}</h3>
          <p>{article.content}</p>

          <p>
            👍 {article.likes} | 👎 {article.dislikes}
          </p>

          {/* BUTTONS */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>

            <button onClick={() => handleShare(article.id)}>
              🔗 Share
            </button>

            <button onClick={() => handleLike(article)}>
              👍 Like
            </button>

            <button onClick={() => handleDislike(article)}>
              👎 Dislike
            </button>

            {article.user_id === user.id && (
              <button onClick={() => handleDelete(article)}>
                🗑 Delete
              </button>
            )}
          </div>

          {/* COMMENT */}
          <div style={{ marginTop: 15 }}>
            <input
              placeholder="Write comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />

            <button onClick={() => handleComment(article.id)}>
              Comment
            </button>
          </div>

          {/* COMMENTS */}
          <div style={{ marginTop: 15 }}>
            <h4>Comments</h4>

            {comments
              .filter(
                (c) =>
                  c.article_id === article.id &&
                  c.parent_id === null
              )
              .map((comment) => (
                <div key={comment.id}>
                  <p>💬 {comment.content}</p>

                  {comments
                    .filter((r) => r.parent_id === comment.id)
                    .map((reply) => (
                      <p
                        key={reply.id}
                        style={{ marginLeft: 20, fontSize: 13 }}
                      >
                        ↩️ {reply.content}
                      </p>
                    ))}

                  <button onClick={() => setActiveReply(comment.id)}>
                    Reply
                  </button>

                  {activeReply === comment.id && (
                    <div>
                      <input
                        placeholder="Write reply..."
                        value={replyText}
                        onChange={(e) =>
                          setReplyText(e.target.value)
                        }
                      />

                      <button
                        onClick={() =>
                          handleReply(article.id, comment.id)
                        }
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}