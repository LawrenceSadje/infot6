import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import styles from '../styles/login.module.css'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false) // default = signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) setMessage(error.message)
    else {
      setMessage('Login successful!')
      router.push('/dashboard')
    }
  }

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) setMessage(error.message)
    else {
      setMessage('Signup successful! You can now log in.')
      setIsLogin(true)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          {isLogin ? 'Login' : 'Sign Up'}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className={styles.input}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className={styles.button}
          onClick={isLogin ? handleLogin : handleSignUp}
        >
          {isLogin ? 'Login' : 'Sign Up'}
        </button>

        <p className={styles.message}>{message}</p>

        <p className={styles.subtext}>
          {isLogin ? (
            <>
              No account?{' '}
              <span onClick={() => setIsLogin(false)}>Sign up</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span onClick={() => setIsLogin(true)}>Login</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
