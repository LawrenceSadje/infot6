import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../styles/Home.module.css'


export default function Landing() {
  const router = useRouter()

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, aquamarine, rgb(0,115,255))',
      color: '#fff',
      fontFamily: 'Segoe UI'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
        Welcome to ML Hub 🚀
      </h1>

      <p style={{ marginBottom: '30px' }}>
        Build, Learn, and Explore
      </p>

      <button
        onClick={() => router.push('/auth')}
        style={{
          padding: '15px 30px',
          fontSize: '1rem',
          borderRadius: '10px',
          border: 'none',
          background: '#fff',
          color: '#0073ff',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Get Started
      </button>
    </div>
  )
}
