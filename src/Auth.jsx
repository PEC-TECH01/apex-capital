
import { useState } from 'react'

const API_URL = 'http://localhost:5000/api/auth'

export default function Auth({
  initialMode = 'login',
  onBack,
  onAuthenticated,
}) {
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setMessage('')
    setFullName('')
    setPassword('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (isRegister && !fullName.trim()) {
      setMessage('Please enter your full name.')
      setMessageType('error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/${isRegister ? 'register' : 'login'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(isRegister && { fullName: fullName.trim() }),
            email: email.trim(),
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || 'Authentication failed.'
        )
      }

      if (!data.token || !data.user) {
        throw new Error(
          'The server response is missing the user or authentication token.'
        )
      }

      setMessageType('success')
      setMessage(isRegister ? 'Account created successfully.' : 'Login successful.')

      onAuthenticated(data.user, data.token)
    } catch (error) {
      setMessageType('error')
      setMessage(
        error.message ||
          'Unable to connect to the server. Make sure your backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <button
          type="button"
          className="auth-back"
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
          Back to home
        </button>

        <a
          href="/"
          className="auth-brand"
          onClick={(event) => {
            event.preventDefault()
            onBack?.()
          }}
        >
          APEX <span>CAPITAL</span>
        </a>

        <div className="auth-icon" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="10" width="18" height="11" rx="2" />
            <path d="M7 10V7a5 5 0 0 1 10 0v3" />
            <path d="M12 14v3" />
          </svg>
        </div>

        <p className="eyebrow">
          {isRegister ? 'GET STARTED' : 'WELCOME BACK'}
        </p>

        <h1>
          {isRegister ? 'Create your account' : 'Sign in to Apex'}
        </h1>

        <p className="auth-description">
          {isRegister
            ? 'Create your account to explore your investment dashboard.'
            : 'Access your portfolio dashboard and explore your investments.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="auth-full-name">Full name</label>
              <input
                id="auth-full-name"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete={
                isRegister ? 'new-password' : 'current-password'
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
            {isRegister && (
              <span className="auth-hint">
                Use at least 8 characters.
              </span>
            )}
          </div>

          {message && (
            <p
              className={`auth-message ${
                messageType === 'error' ? 'auth-error' : 'auth-success'
              }`}
              role="alert"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isRegister
                ? 'Create account'
                : 'Sign in'}
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {isRegister ? 'Sign in' : 'Create account'}
          </button>
        </p>

        <div className="auth-disclaimer">
          This is a portfolio demonstration of an investment platform.
          Investment values and features should not be treated as live
          financial data or actual investment advice.
        </div>

        <p className="auth-legal">
          Secure account access · Apex Capital
        </p>
      </section>
    </main>
  )
}
