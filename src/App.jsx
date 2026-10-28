
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ShieldCheck,
  Menu,
  X,
  RefreshCw,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react'

import Auth from './Auth'
import './App.css'
import Dashboard from './Dashboard'


function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState('register')

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('apexUser')
      const savedToken = localStorage.getItem('apexToken')

      return savedUser && savedToken
        ? JSON.parse(savedUser)
        : null
    } catch {
      return null
    }
  })

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [plansReloadKey, setPlansReloadKey] = useState(0)

  // LOAD INVESTMENT PLANS FROM THE BACKEND
  useEffect(() => {
    const controller = new AbortController()

    async function loadPlans() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          'http://localhost:5000/api/plans',
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(
            `Unable to load investment plans (HTTP ${response.status}).`
          )
        }

        const data = await response.json()

        if (!data.success || !Array.isArray(data.plans)) {
          throw new Error(
            'The server returned an unexpected investment plans response.'
          )
        }

        setPlans(data.plans)
      } catch (err) {
        if (err.name === 'AbortError') return

        setError(
          err instanceof TypeError
            ? 'Cannot connect to the backend. Make sure the server is running on port 5000.'
            : err.message || 'Could not load investment plans.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPlans()

    return () => controller.abort()
  }, [plansReloadKey])

  function retryLoadingPlans() {
    setPlansReloadKey((key) => key + 1)
  }

  function openAuth(mode) {
    setMenuOpen(false)
    setAuthMode(mode)
    setShowAuth(true)

    window.history.replaceState(
      null,
      '',
      mode === 'login' ? '#login' : '#register'
    )

    window.scrollTo(0, 0)
  }

  function closeAuth() {
    setShowAuth(false)
    setMenuOpen(false)

    window.history.replaceState(null, '', '#home')
    window.scrollTo(0, 0)
  }

  function handleAuthenticated(user, token) {
    localStorage.setItem('apexToken', token)
    localStorage.setItem('apexUser', JSON.stringify(user))

    setCurrentUser(user)
    setShowAuth(false)

    window.history.replaceState(null, '', '#dashboard')
    window.scrollTo(0, 0)
  }

  function handleLogout() {
    localStorage.removeItem('apexToken')
    localStorage.removeItem('apexUser')

    setCurrentUser(null)
    setShowAuth(false)
    setAuthMode('login')

    window.history.replaceState(null, '', '#home')
    window.scrollTo(0, 0)
  }

  function viewPlan(plan) {
    setSelectedPlan(plan)

    document.getElementById('investments')?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  function backToPlans() {
    setSelectedPlan(null)
  }

  // AUTHENTICATED DASHBOARD
  if (currentUser) {
    return (
      <Dashboard
        user={currentUser}
        onLogout={handleLogout}
      />
    )
  }

  // LOGIN AND REGISTRATION PAGES
  if (showAuth) {
    return (
      <Auth
        key={authMode}
        initialMode={authMode}
        onBack={closeAuth}
        onAuthenticated={handleAuthenticated}
      />
    )
  }

  // PUBLIC HOMEPAGE
  return (
    <div className="app">
      <header className="navbar">
        <a
          href="#home"
          className="logo"
          onClick={() => setMenuOpen(false)}
        >
          APEX<span>CAPITAL</span>
        </a>

        <button
          className="menu-button"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#home" onClick={() => setMenuOpen(false)}>
            Home
          </a>

          <a href="#markets" onClick={() => setMenuOpen(false)}>
            Markets
          </a>

          <a
            href="#investments"
            onClick={() => {
              setMenuOpen(false)
              setSelectedPlan(null)
            }}
          >
            Investment plans
          </a>

          <a href="#about" onClick={() => setMenuOpen(false)}>
            About us
          </a>

          <button
            type="button"
            className="nav-cta"
            onClick={() => openAuth('login')}
          >
            Sign in
          </button>

          <button
            type="button"
            className="nav-cta"
            onClick={() => openAuth('register')}
          >
            Get started <ArrowUpRight size={16} />
          </button>
        </nav>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">
              <span className="status-dot" />
              A SMARTER WAY TO INVEST
            </p>

            <h1>
              Your money.
              <br />
              Your future.
              <br />
              <em>Your advantage.</em>
            </h1>

            <p className="hero-description">
              Discover a more thoughtful approach to investing.
              Explore financial markets, understand your options,
              and build a strategy around your goals.
            </p>

            <div className="hero-buttons">
              <a href="#markets" className="primary-button">
                Explore the markets <ArrowRight size={17} />
              </a>

              <a href="#about" className="secondary-button">
                Discover Apex
              </a>
            </div>

            <div className="hero-note">
              <ShieldCheck size={20} />
              <span>
                <strong>Clarity. Discipline. Perspective.</strong>
                <small>Designed around long-term thinking.</small>
              </span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-heading">
              <span>MARKET OVERVIEW</span>
              <span className="demo-label">ILLUSTRATIVE DATA</span>
            </div>

            <div className="portfolio-summary">
              <p>Illustrative portfolio value</p>
              <h2>$128,430.80</h2>
              <span className="positive">
                ↗ +8.24% illustrative growth
              </span>
            </div>

            <div className="chart">
              <div className="chart-line line-one" />
              <div className="chart-line line-two" />
              <div className="chart-line line-three" />

              <svg viewBox="0 0 500 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient
                    id="area"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#86d8a8"
                      stopOpacity=".3"
                    />
                    <stop
                      offset="100%"
                      stopColor="#86d8a8"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <path
                  d="M0 150 L55 130 L100 143 L155 95 L205 112 L260 72 L315 90 L365 48 L420 60 L470 22 L500 12 L500 180 L0 180 Z"
                  fill="url(#area)"
                />

                <path
                  d="M0 150 L55 130 L100 143 L155 95 L205 112 L260 72 L315 90 L365 48 L420 60 L470 22 L500 12"
                  fill="none"
                  stroke="#86d8a8"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="chart-labels">
              <span>JAN</span>
              <span>MAR</span>
              <span>MAY</span>
              <span>JUL</span>
              <span>SEP</span>
              <span>DEC</span>
            </div>

            <div className="panel-footer">
              <BarChart3 size={18} />
              <span>Think long term. Invest with intention.</span>
            </div>
          </div>
        </section>

        {/* MARKETS SECTION */}
        <section className="markets-section" id="markets">
          <div className="section-heading">
            <p className="eyebrow">FINANCIAL MARKETS</p>
            <h2>See the bigger picture.</h2>
            <p>
              Explore selected market indices using illustrative figures.
            </p>
          </div>

          <div className="market-grid">
            <article className="market-card">
              <span>S&amp;P 500</span>
              <h3>5,842.47</h3>
              <p className="positive">
                +0.84% <small>sample change</small>
              </p>
            </article>

            <article className="market-card">
              <span>NASDAQ</span>
              <h3>18,291.62</h3>
              <p className="positive">
                +1.12% <small>sample change</small>
              </p>
            </article>

            <article className="market-card">
              <span>FTSE 100</span>
              <h3>8,732.46</h3>
              <p className="negative">
                −0.21% <small>sample change</small>
              </p>
            </article>
          </div>

          <p className="disclaimer">
            Market figures shown here are illustrative, not live prices.
          </p>
        </section>

        {/* INVESTMENT PLANS */}
        <section className="markets-section" id="investments">
          <div className="section-heading">
            <p className="eyebrow">APEX PORTFOLIOS</p>

            <h2>
              {selectedPlan
                ? selectedPlan.name
                : 'Explore our investment plans.'}
            </h2>

            <p>
              {selectedPlan
                ? 'Explore the details of this investment plan.'
                : 'Review the available plans and their risk classifications.'}
            </p>
          </div>

          {loading && (
            <p role="status">Loading investment plans...</p>
          )}

          {!loading && error && (
            <div className="feature-card" role="alert">
              <h3>We couldn't load the plans.</h3>
              <p>{error}</p>

              <button
                className="primary-button"
                type="button"
                onClick={retryLoadingPlans}
              >
                <RefreshCw size={17} /> Try again
              </button>
            </div>
          )}

          {!loading && !error && plans.length === 0 && (
            <p>No investment plans are available yet.</p>
          )}

          {!loading && !error && !selectedPlan && plans.length > 0 && (
            <div className="market-grid">
              {plans.map((plan) => (
                <article className="market-card" key={plan.id}>
                  <span>APEX PORTFOLIO</span>
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>

                  <p>
                    <strong>Risk level: </strong>
                    {plan.risk_level}
                  </p>

                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => viewPlan(plan)}
                  >
                    View details <ArrowRight size={17} />
                  </button>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && selectedPlan && (
            <article className="feature-card plan-details">
              <div className="plan-detail-icon">
                <BarChart3 size={30} />
              </div>

              <p className="eyebrow">PORTFOLIO DETAILS</p>
              <h3>{selectedPlan.name}</h3>
              <p>{selectedPlan.description}</p>

              <div className="plan-detail-row">
                <span>Risk classification</span>
                <strong>{selectedPlan.risk_level}</strong>
              </div>

              <div className="plan-detail-row">
                <span>Plan reference</span>
                <strong>
                  APEX-{String(selectedPlan.id).padStart(3, '0')}
                </strong>
              </div>

              <div className="plan-detail-notice">
                <ShieldAlert size={20} />
                <p>
                  Risk classifications do not guarantee returns or
                  prevent losses. Review your circumstances before
                  making financial decisions.
                </p>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={backToPlans}
              >
                <ChevronLeft size={17} /> Back to plans
              </button>
            </article>
          )}
        </section>

        {/* ABOUT SECTION */}
        <section className="about-section" id="about">
          <div className="section-heading">
            <p className="eyebrow">THE APEX APPROACH</p>
            <h2>
              Invest with purpose.
              <br />
              <em>Move with perspective.</em>
            </h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <BarChart3 size={27} />
              <h3>Market insights</h3>
              <p>
                Make complex market information easier to explore
                and understand.
              </p>
            </article>

            <article className="feature-card">
              <ShieldCheck size={27} />
              <h3>Transparency first</h3>
              <p>
                Understand the risks, choices, and considerations
                behind financial decisions.
              </p>
            </article>

            <article className="feature-card">
              <ArrowUpRight size={27} />
              <h3>Long-term vision</h3>
              <p>
                Keep your bigger financial goals in focus while
                learning about investment opportunities.
              </p>
            </article>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section className="contact-section" id="contact">
          <p className="eyebrow">START A CONVERSATION</p>
          <h2>
            Every great plan starts
            <br />
            with a clear first step.
          </h2>
          <p>
            Discover the Apex Capital approach to financial markets.
          </p>

          <a
            href="mailto:hello@apexcapital.example"
            className="primary-button"
          >
            Contact Apex Capital <ArrowRight size={17} />
          </a>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <a href="#home" className="logo">
          APEX<span>CAPITAL</span>
        </a>

        <p>Clarity for the road ahead.</p>

        <small>
          © 2026 Apex Capital. This portfolio project uses illustrative
          market data and sample investment plans. It does not execute
          real trades or guarantee investment returns.
        </small>
      </footer>
    </div>
  )
}

export default App
