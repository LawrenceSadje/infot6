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

  // 📥 FETCH ARTICLES
  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('likes', { ascending: false })

    setArticles(data || [])
  }

  // 💬 FETCH COMMENTS
  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    setComments(data || [])
  }

  // 📝 CREATE ARTICLE
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
    setContent()

    fetchArticles()
  }

  // 👍 LIKE ARTICLE (ONE LIKE PER ACCOUNT)
  const handleLike = async (article) => {
    const { data: existingLike } = await supabase
      .from('article_reactions')
      .select('*')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .single()

    // IF ALREADY LIKED
    if (existingLike?.type === 'like') {
      alert('You already liked this article')
      return
    }

    // REMOVE DISLIKE IF EXISTS
    if (existingLike?.type === 'dislike') {
      await supabase
        .from('articles')
        .update({
          dislikes: article.dislikes - 1,
        })
        .eq('id', article.id)

      await supabase
        .from('article_reactions')
        .delete()
        .eq('id', existingLike.id)
    }

    // ADD LIKE
    await supabase.from('article_reactions').insert([
      {
        article_id: article.id,
        user_id: user.id,
        type: 'like',
      },
    ])

    await supabase
      .from('articles')
      .update({
        likes: article.likes + 1,
      })
      .eq('id', article.id)

    fetchArticles()
  }

  // 👎 DISLIKE ARTICLE (ONE DISLIKE PER ACCOUNT)
  const handleDislike = async (article) => {
    const { data: existingReaction } = await supabase
      .from('article_reactions')
      .select('*')
      .eq('article_id', article.id)
      .eq('user_id', user.id)
      .single()

    // IF ALREADY DISLIKED
    if (existingReaction?.type === 'dislike') {
      alert('You already disliked this article')
      return
    }

    // REMOVE LIKE IF EXISTS
    if (existingReaction?.type === 'like') {
      await supabase
        .from('articles')
        .update({
          likes: article.likes - 1,
        })
        .eq('id', article.id)

      await supabase
        .from('article_reactions')
        .delete()
        .eq('id', existingReaction.id)
    }

    // ADD DISLIKE
    await supabase.from('article_reactions').insert([
      {
        article_id: article.id,
        user_id: user.id,
        type: 'dislike',
      },
    ])

    await supabase
      .from('articles')
      .update({
        dislikes: article.dislikes + 1,
      })
      .eq('id', article.id)

    fetchArticles()
  }

  // 🗑 DELETE ARTICLE
  const handleDelete = async (id) => {
    const confirmDelete = confirm(
      'Are you sure you want to delete this article?'
    )

    if (!confirmDelete) return

    await supabase
      .from('articles')
      .delete()
      .eq('id', id)

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
    <div
      style={{
        padding: '40px',
        fontFamily: 'Segoe UI',
        background: '#f5f7fb',
        minHeight: '100vh',
      }}
    >
      <h1>Dashboard 🚀</h1>

      {/* 📝 CREATE ARTICLE */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '30px',
        }}
      >
        <h2>Publish Article</h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
          }}
        />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            height: '120px',
            padding: '10px',
          }}
        />

        <button onClick={handlePublish}>
          Publish
        </button>
      </div>

      {/* 📊 ARTICLES */}
      <h2>Top Articles</h2>

      {articles.map((article) => (
        <div
          key={article.id}
          style={{
            background: 'white',
            padding: '20px',
            marginBottom: '20px',
            borderRadius: '15px',
          }}
        >
          <h3>{article.title}</h3>

          <p>{article.content}</p>

          <p>
            👍 {article.likes} | 👎{' '}
            {article.dislikes || 0}
          </p>

          {/* BUTTONS */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleLike(article)}
            >
              👍 Like
            </button>

            <button
              onClick={() =>
                handleDislike(article)
              }
            >
              👎 Dislike
            </button>

            <button
              onClick={() =>
                handleDelete(article.id)
              }
            >
              🗑 Delete
            </button>
          </div>

          {/* 🔗 SHARE BUTTON */}
<button
  onClick={async () => {
    const shareData = {
      title: article.title,
      text: article.content,
      url: `${window.location.origin}/article/${article.id}`,
    }

    // MOBILE SHARE
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // FALLBACK COPY LINK
      navigator.clipboard.writeText(shareData.url)
      alert('Link copied!')
    }
  }}
  style={{
    marginTop: '10px',
    background: '#0ea5e9',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
  }}
>
  🔗 Share
</button>

          {/* COMMENT */}
          <div>
            <input
              placeholder="Write comment..."
              value={commentText}
              onChange={(e) =>
                setCommentText(e.target.value)
              }
            />

            <button
              onClick={() =>
                handleComment(article.id)
              }
            >
              Comment
            </button>
          </div>

          {/* COMMENTS */}
          <div style={{ marginTop: '15px' }}>
            <h4>Comments</h4>

            {comments
              .filter(
                (c) =>
                  c.article_id === article.id &&
                  c.parent_id === null
              )
              .map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    marginLeft: '10px',
                    marginTop: '10px',
                  }}
                >
                  <p>💬 {comment.content}</p>

                  {/* REPLIES */}
                  {comments
                    .filter(
                      (r) =>
                        r.parent_id === comment.id
                    )
                    .map((reply) => (
                      <p
                        key={reply.id}
                        style={{
                          marginLeft: '20px',
                          fontSize: '13px',
                        }}
                      >
                        ↩️ {reply.content}
                      </p>
                    ))}

                  {/* REPLY BUTTON */}
                  <button
                    onClick={() =>
                      setActiveReply(comment.id)
                    }
                  >
                    Reply
                  </button>

                  {/* REPLY INPUT */}
                  {activeReply === comment.id && (
                    <div>
                      <input
                        placeholder="Write reply..."
                        value={replyText}
                        onChange={(e) =>
                          setReplyText(
                            e.target.value
                          )
                        }
                      />

                      <button
                        onClick={() =>
                          handleReply(
                            article.id,
                            comment.id
                          )
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

      {/* LOGOUT */}
      <button onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}