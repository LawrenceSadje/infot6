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

  // 📝 CREATE ARTICLE
  const handlePublish = async () => {
    await supabase.from('articles').insert([
      {
        title,
        content,
        user_id: user.id,
        likes: 0,
      },
    ])

    setTitle('')
    setContent('')
    fetchArticles()
  }

  // 👍 LIKE
  const handleLike = async (article) => {
    await supabase
      .from('articles')
      .update({ likes: article.likes + 1 })
      .eq('id', article.id)

    fetchArticles()
  }

  // 💬 COMMENT
  const handleComment = async (articleId) => {
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
    <div style={{ padding: '40px', fontFamily: 'Segoe UI' }}>
      <h1>Dashboard 🚀</h1>

      {/* 📝 CREATE ARTICLE */}
      <div>
        <h2>Publish Article</h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <br />

        <button onClick={handlePublish}>Publish</button>
      </div>

      <hr />

      {/* 📊 ARTICLES */}
      <h2>Top Liked Articles</h2>

      {articles.map((article) => (
        <div
          key={article.id}
          style={{
            border: '1px solid #ccc',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '10px',
          }}
        >
          <h3>{article.title}</h3>
          <p>{article.content}</p>

          <p>👍 {article.likes}</p>

          <button onClick={() => handleLike(article)}>Like +</button>

          {/* 🔗 SHARE */}
          <p>
            Share: <a href={`/article/${article.id}`}>/article/{article.id}</a>
          </p>

          {/* 💬 COMMENT INPUT */}
          <div style={{ marginTop: '10px' }}>
            <input
              placeholder="Write comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button onClick={() => handleComment(article.id)}>
              Comment
            </button>
          </div>

          {/* 💬 COMMENTS LIST */}
          <div style={{ marginTop: '15px' }}>
            <h4>Comments</h4>

            {comments
              .filter(
                (c) =>
                  c.article_id === article.id && c.parent_id === null
              )
              .map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    marginLeft: '10px',
                    padding: '5px',
                  }}
                >
                  <p>💬 {comment.content}</p>

                  {/* ↩️ REPLIES */}
                  {comments
                    .filter((r) => r.parent_id === comment.id)
                    .map((reply) => (
                      <p
                        key={reply.id}
                        style={{ marginLeft: '20px', fontSize: '12px' }}
                      >
                        ↩️ {reply.content}
                      </p>
                    ))}

                  {/* REPLY BUTTON */}
                  <button onClick={() => setActiveReply(comment.id)}>
                    Reply
                  </button>

                  {/* REPLY INPUT */}
                  {activeReply === comment.id && (
                    <div>
                      <input
                        placeholder="Write reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
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

      <br />
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
