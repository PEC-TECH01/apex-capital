
import { useCallback, useEffect, useState } from 'react'
import './Dashboard.css'
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  CircleCheck,
  ReceiptText,
  LayoutDashboard,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Wallet,
  UserRound,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  CalendarDays,
  CircleDollarSign,
} from 'lucide-react'

function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('Overview')
  const [menuOpen, setMenuOpen] = useState(false)

  const [plans, setPlans] = useState([])
  const [plansError, setPlansError] = useState('')

  const [portfolios, setPortfolios] = useState([])
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [portfolioError, setPortfolioError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const [cashAmount, setCashAmount] = useState('')
  const [cashOperationType, setCashOperationType] = useState('deposit')
  const [cashOperationLoading, setCashOperationLoading] = useState(false)
  const [cashOperationError, setCashOperationError] = useState('')
  const [cashOperationSuccess, setCashOperationSuccess] = useState('')

  const [transactions, setTransactions] = useState([])
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [transactionRefreshing, setTransactionRefreshing] = useState(false)
  const [transactionError, setTransactionError] = useState('')
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionStatus, setTransactionStatus] = useState('all')

  const [investments, setInvestments] = useState([])
  const [investmentLoading, setInvestmentLoading] = useState(false)
  const [investmentError, setInvestmentError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedInvestment, setSelectedInvestment] = useState(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [investmentSubmitting, setInvestmentSubmitting] = useState(false)
  const [investmentSuccess, setInvestmentSuccess] = useState('')

  const displayName =
    user?.full_name || user?.fullName || 'Investor'

  // Load available investment plans.
  useEffect(() => {
    async function loadPlans() {
      try {
        const response = await fetch('http://localhost:5000/api/plans')
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load investment plans.')
        }

        setPlans(Array.isArray(data.plans) ? data.plans : [])
        setPlansError('')
      } catch (error) {
        setPlansError(error.message || 'Unable to load investment plans.')
      }
    }

    loadPlans()
  }, [])

  // Load portfolios from the database.
  const loadPortfolio = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true)
    } else {
      setPortfolioLoading(true)
    }

    try {
      const token = localStorage.getItem('apexToken')

      if (!token) {
        throw new Error('Please sign in again to view your portfolio.')
      }

      const response = await fetch('http://localhost:5000/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load your portfolio.')
      }

      setPortfolios(Array.isArray(data.portfolios) ? data.portfolios : [])
      setPortfolioError('')
    } catch (error) {
      setPortfolioError(error.message || 'Unable to load your portfolio.')
    } finally {
      setPortfolioLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Load transaction history.
  const loadTransactions = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setTransactionRefreshing(true)
    } else {
      setTransactionLoading(true)
    }

    try {
      const token = localStorage.getItem('apexToken')

      if (!token) {
        throw new Error('Please sign in again to view your transactions.')
      }

      const response = await fetch('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load transaction history.')
      }

      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : []
      )
      setTransactionError('')
    } catch (error) {
      setTransactionError(
        error.message || 'Unable to load transaction history.'
      )
    } finally {
      setTransactionLoading(false)
      setTransactionRefreshing(false)
    }
  }, [])

  // Load investments from the database.
  const loadInvestments = useCallback(async () => {
    setInvestmentLoading(true)
    setInvestmentError('')

    try {
      const token = localStorage.getItem('apexToken')

      if (!token) {
        throw new Error('Please sign in again to view your investments.')
      }

      const response = await fetch('http://localhost:5000/api/investments', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load your investments.')
      }

      setInvestments(
        Array.isArray(data.investments) ? data.investments : []
      )
    } catch (error) {
      setInvestmentError(error.message || 'Unable to load your investments.')
    } finally {
      setInvestmentLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  useEffect(() => {
    if (activePage === 'My investments') {
      loadInvestments()
    }
  }, [activePage, loadInvestments])

  useEffect(() => {
    if (activePage === 'Transactions') {
      loadTransactions()
    }
  }, [activePage, loadTransactions])

  const totalCashBalance = portfolios.reduce(
    (total, portfolio) => total + Number(portfolio.cash_balance || 0),
    0
  )

  // Calculate summaries from saved investment principal.
  const investmentPerformance = investments.reduce(
    (summary, investment) => {
      const principal = Number(investment.principal_amount || 0)
      const status = String(investment.status || '').toLowerCase()

      summary.totalInvested += principal

      if (status === 'active') {
        summary.activeInvestments += 1
        summary.activePrincipal += principal
      }

      return summary
    },
    {
      totalInvested: 0,
      activeInvestments: 0,
      activePrincipal: 0,
    }
  )

  const investmentBreakdown = Object.values(
    investments.reduce((groups, investment) => {
      const key = String(
        investment.plan_id ?? investment.plan_name ?? 'other'
      )
      const principal = Number(investment.principal_amount || 0)

      if (!groups[key]) {
        groups[key] = {
          planId: key,
          planName: investment.plan_name || 'Investment plan',
          riskLevel: investment.risk_level || 'Not specified',
          investmentCount: 0,
          totalInvested: 0,
          activePrincipal: 0,
        }
      }

      groups[key].investmentCount += 1
      groups[key].totalInvested += principal

      if (String(investment.status || '').toLowerCase() === 'active') {
        groups[key].activePrincipal += principal
      }

      return groups
    }, {})
  ).sort((a, b) => b.totalInvested - a.totalInvested)

  // Process a deposit or withdrawal.
  async function handleCashOperation(event) {
    event.preventDefault()
    setCashOperationError('')
    setCashOperationSuccess('')

    const trimmedAmount = cashAmount.trim()
    const amount = Number(trimmedAmount)

    if (!trimmedAmount || !Number.isFinite(amount) || amount <= 0) {
      setCashOperationError('Enter a valid amount greater than zero.')
      return
    }

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      setCashOperationError(
        'Enter an amount with no more than two decimal places.'
      )
      return
    }

    if (amount > 100000000000) {
      setCashOperationError('The amount entered is too large.')
      return
    }

    if (cashOperationType === 'withdraw' && amount > totalCashBalance) {
      setCashOperationError(
        'Your withdrawal amount exceeds your available cash balance.'
      )
      return
    }

    setCashOperationLoading(true)

    try {
      const token = localStorage.getItem('apexToken')

      if (!token) {
        throw new Error('Please sign in again to continue.')
      }

      const response = await fetch(
        `http://localhost:5000/api/portfolio/${cashOperationType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to process this transaction.')
      }

      setCashOperationSuccess(
        data.message ||
          `${cashOperationType === 'deposit' ? 'Deposit' : 'Withdrawal'} processed successfully.`
      )
      setCashAmount('')

      await Promise.all([
        loadPortfolio(true),
        loadTransactions(true),
      ])
    } catch (error) {
      setCashOperationError(
        error.message || 'Unable to process this transaction.'
      )
    } finally {
      setCashOperationLoading(false)
    }
  }

  // Submit an investment.
  async function handleInvestment(event) {
    event.preventDefault()
    setInvestmentError('')
    setInvestmentSuccess('')

    if (!selectedPlan) {
      setInvestmentError('Please select an investment plan.')
      return
    }

    const amountText = investmentAmount.trim()
    const amount = Number(amountText)

    if (
      !amountText ||
      !/^\d+(\.\d{1,2})?$/.test(amountText) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000000000
    ) {
      setInvestmentError(
        'Enter a valid amount with no more than two decimal places.'
      )
      return
    }

    if (amount > totalCashBalance) {
      setInvestmentError(
        'Your investment exceeds your available cash balance.'
      )
      return
    }

    setInvestmentSubmitting(true)

    try {
      const token = localStorage.getItem('apexToken')

      if (!token) {
        throw new Error('Please sign in again to continue.')
      }

      const response = await fetch('http://localhost:5000/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to complete your investment.')
      }

      setInvestmentSuccess(
        data.message || 'Investment completed successfully.'
      )
      setInvestmentAmount('')

      await Promise.all([
        loadPortfolio(true),
        loadInvestments(),
        loadTransactions(true),
      ])
    } catch (error) {
      setInvestmentError(
        error.message || 'Unable to complete your investment.'
      )
    } finally {
      setInvestmentSubmitting(false)
    }
  }

  const navigation = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'My investments', icon: BriefcaseBusiness },
    { label: 'Investment plans', icon: ChartNoAxesCombined },
    { label: 'Transactions', icon: Wallet },
    { label: 'My profile', icon: UserRound },
    { label: 'Settings', icon: Settings },
  ]

  function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    })
  }

  function formatDate(date) {
    if (!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable'
    }

    return parsedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatDateTime(date) {
    if (!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable'
    }

    return parsedDate.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getTransactionLabel(type) {
    const labels = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      investment: 'Investment',
      return: 'Investment return',
    }

    return (
      labels[String(type || '').toLowerCase()] ||
      String(type || 'Transaction')
    )
  }

  function getTransactionIcon(type) {
    switch (String(type || '').toLowerCase()) {
      case 'deposit':
        return ArrowDownLeft
      case 'withdrawal':
        return ArrowUpRight
      case 'investment':
        return BriefcaseBusiness
      case 'return':
        return ChartNoAxesCombined
      default:
        return ReceiptText
    }
  }

  function getTransactionAmount(transaction) {
    const type = String(transaction.transaction_type || '').toLowerCase()
    const amount = formatCurrency(transaction.amount)

    if (type === 'deposit' || type === 'return') return `+${amount}`
    if (type === 'withdrawal' || type === 'investment') return `−${amount}`

    return amount
  }

  function logout() {
    localStorage.removeItem('apexToken')
    localStorage.removeItem('apexUser')
    onLogout()
  }

  function navigateTo(page) {
    setActivePage(page)
    setMenuOpen(false)
    setSelectedInvestment(null)
  }

  const completedTransactions = transactions.filter(
    (transaction) =>
      String(transaction.status || '').toLowerCase() === 'completed'
  )

  const pendingTransactions = transactions.filter(
    (transaction) =>
      String(transaction.status || '').toLowerCase() === 'pending'
  )

  const filteredTransactions = transactions.filter((transaction) => {
    const searchTerm = transactionSearch.trim().toLowerCase()

    const searchableText = [
      transaction.reference,
      transaction.description,
      transaction.transaction_type,
      transaction.portfolio_name,
      transaction.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch =
      !searchTerm || searchableText.includes(searchTerm)

    const matchesStatus =
      transactionStatus === 'all' ||
      String(transaction.status || '').toLowerCase() === transactionStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <a href="#dashboard" className="dashboard-logo">
          APEX<span>CAPITAL</span>
        </a>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="dashboard-navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              type="button"
              key={label}
              className={
                activePage === label
                  ? 'dashboard-nav-link active'
                  : 'dashboard-nav-link'
              }
              onClick={() => navigateTo(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {activePage === label && (
                <ChevronRight size={16} className="nav-chevron" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-note">
            <ShieldCheck size={21} />
            <div>
              <strong>Account security</strong>
              <span>Keep your credentials private.</span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-logout"
            onClick={logout}
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle dashboard navigation"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <div className="dashboard-breadcrumb">
            Investor portal <span>/</span> {activePage}
          </div>

          <div className="dashboard-topbar-right">
            <button
              type="button"
              className="dashboard-icon-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="dashboard-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="dashboard-user">
              <strong>{displayName}</strong>
              <span>Investor account</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* OVERVIEW */}
          {activePage === 'Overview' && (
            <>
              <section className="dashboard-welcome">
                <div>
                  <p className="dashboard-eyebrow">INVESTOR PORTAL</p>
                  <h1>Welcome back, {displayName.split(' ')[0]}.</h1>
                  <p>
                    Review your account, explore investment plans,
                    and keep track of your financial goals.
                  </p>
                </div>

                <button
                  type="button"
                  className="dashboard-primary-button"
                  onClick={() => navigateTo('Investment plans')}
                >
                  Explore plans <ArrowUpRight size={17} />
                </button>
              </section>

              <section className="dashboard-stat-grid">
                <article className="dashboard-stat-card">
                  <div className="stat-heading">
                    <span>Account status</span>
                    <ShieldCheck size={20} />
                  </div>
                  <h2>Registered</h2>
                  <p className="stat-caption">Your account is available.</p>
                </article>

                <article className="dashboard-stat-card">
                  <div className="stat-heading">
                    <span>Available plans</span>
                    <ChartNoAxesCombined size={20} />
                  </div>
                  <h2>{plans.length}</h2>
                  <p className="stat-caption">
                    {plansError
                      ? 'Unable to retrieve plans.'
                      : 'Plans available on the platform.'}
                  </p>
                </article>

                <article className="dashboard-stat-card">
                  <div className="stat-heading">
                    <span>Portfolio cash balance</span>
                    <Wallet size={20} />
                  </div>
                  <h2>
                    {portfolioLoading
                      ? 'Loading...'
                      : portfolioError
                        ? 'Unavailable'
                        : formatCurrency(totalCashBalance)}
                  </h2>
                  <p className="stat-caption">
                    {portfolioError ||
                      'Cash balance recorded in your database.'}
                  </p>
                </article>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="dashboard-eyebrow">OPPORTUNITIES</p>
                    <h2>Investment plans</h2>
                  </div>
                  <button
                    type="button"
                    className="dashboard-text-button"
                    onClick={() => navigateTo('Investment plans')}
                  >
                    View all <ArrowUpRight size={16} />
                  </button>
                </div>

                {plansError && (
                  <p className="dashboard-error" role="alert">
                    {plansError}
                  </p>
                )}

                {!plansError && plans.length === 0 && (
                  <p className="dashboard-empty">
                    No investment plans are currently available.
                  </p>
                )}

                <div className="dashboard-plan-grid">
                  {plans.slice(0, 3).map((plan) => (
                    <article className="dashboard-plan-card" key={plan.id}>
                      <div className="dashboard-plan-icon">
                        <BriefcaseBusiness size={21} />
                      </div>
                      <span className="plan-category">INVESTMENT PLAN</span>
                      <h3>{plan.name}</h3>
                      <p>{plan.description}</p>
                      <div className="dashboard-plan-meta">
                        <span>Risk classification</span>
                        <strong>{plan.risk_level}</strong>
                      </div>
                      <button
                        type="button"
                        className="dashboard-plan-button"
                        onClick={() => navigateTo('Investment plans')}
                      >
                        View plan details <ChevronRight size={17} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="dashboard-account-card">
                <div className="account-card-icon">
                  <UserRound size={23} />
                </div>
                <div>
                  <h3>Your account</h3>
                  <p>
                    View your profile information and manage your account.
                  </p>
                </div>
                <button
                  type="button"
                  className="dashboard-text-button"
                  onClick={() => navigateTo('My profile')}
                >
                  View profile <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          )}

          {/* MY INVESTMENTS */}
          {activePage === 'My investments' && (
            <section className="dashboard-section portfolio-page">
              <div className="portfolio-page-heading">
                <div>
                  <p className="dashboard-eyebrow">YOUR FINANCIAL OVERVIEW</p>
                  <h1>My investments</h1>
                  <p className="dashboard-page-description">
                    A clear view of your saved portfolios and available cash.
                  </p>
                </div>

                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={() => {
                    loadPortfolio(true)
                    loadInvestments()
                  }}
                  disabled={refreshing || portfolioLoading || investmentLoading}
                >
                  <RefreshCw
                    size={16}
                    className={refreshing ? 'refresh-spinning' : ''}
                  />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {/* CASH OPERATIONS */}
              <section className="cash-operation-card">
                <div className="cash-operation-heading">
                  <div>
                    <p className="dashboard-eyebrow">ACCOUNT FUNDING</p>
                    <h2>Manage your cash</h2>
                    <p>
                      Add a simulated deposit or request a withdrawal
                      from your available portfolio balance.
                    </p>
                  </div>
                  <div className="cash-operation-heading-icon">
                    <CircleDollarSign size={25} />
                  </div>
                </div>

                <div className="cash-operation-tabs">
                  <button
                    type="button"
                    className={
                      cashOperationType === 'deposit'
                        ? 'cash-operation-tab active'
                        : 'cash-operation-tab'
                    }
                    onClick={() => {
                      setCashOperationType('deposit')
                      setCashOperationError('')
                      setCashOperationSuccess('')
                    }}
                    disabled={cashOperationLoading}
                  >
                    <ArrowDownLeft size={18} /> Deposit
                  </button>

                  <button
                    type="button"
                    className={
                      cashOperationType === 'withdraw'
                        ? 'cash-operation-tab active'
                        : 'cash-operation-tab'
                    }
                    onClick={() => {
                      setCashOperationType('withdraw')
                      setCashOperationError('')
                      setCashOperationSuccess('')
                    }}
                    disabled={cashOperationLoading}
                  >
                    <ArrowUpRight size={18} /> Withdraw
                  </button>
                </div>

                <form
                  className="cash-operation-form"
                  onSubmit={handleCashOperation}
                >
                  <label htmlFor="cash-amount">
                    {cashOperationType === 'deposit'
                      ? 'Amount to deposit'
                      : 'Amount to withdraw'}
                  </label>

                  <div className="cash-operation-input-wrapper">
                    <span>₦</span>
                    <input
                      id="cash-amount"
                      type="number"
                      name="amount"
                      min="0.01"
                      max="100000000000"
                      step="0.01"
                      placeholder="Enter amount"
                      value={cashAmount}
                      onChange={(event) => {
                        setCashAmount(event.target.value)
                        setCashOperationError('')
                        setCashOperationSuccess('')
                      }}
                      disabled={cashOperationLoading}
                      required
                    />
                  </div>

                  <p className="cash-operation-hint">
                    Available cash balance:{' '}
                    <strong>{formatCurrency(totalCashBalance)}</strong>
                  </p>

                  {cashOperationError && (
                    <div
                      className="cash-operation-message error"
                      role="alert"
                    >
                      {cashOperationError}
                    </div>
                  )}

                  {cashOperationSuccess && (
                    <div
                      className="cash-operation-message success"
                      role="status"
                    >
                      {cashOperationSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="dashboard-primary-button cash-operation-submit"
                    disabled={cashOperationLoading || portfolioLoading}
                  >
                    {cashOperationLoading ? (
                      <>
                        <RefreshCw
                          size={17}
                          className="refresh-spinning"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        {cashOperationType === 'deposit'
                          ? 'Confirm deposit'
                          : 'Confirm withdrawal'}
                        {cashOperationType === 'deposit'
                          ? <ArrowDownLeft size={17} />
                          : <ArrowUpRight size={17} />}
                      </>
                    )}
                  </button>
                </form>

                <p className="cash-operation-disclaimer">
                  Demo mode: transactions update your development database only.
                  No real money is transferred.
                </p>
              </section>

              {/* INVESTMENT PERFORMANCE */}
              <section className="investment-performance-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="dashboard-eyebrow">PORTFOLIO ANALYTICS</p>
                    <h2>Investment performance</h2>
                    <p className="dashboard-page-description">
                      A summary of the investment principal recorded in your account.
                    </p>
                  </div>
                </div>

                {investmentError && (
                  <p className="dashboard-error" role="alert">
                    Performance data is unavailable until your investments load.
                  </p>
                )}

                <div className="investment-performance-grid">
                  <article className="investment-metric-card">
                    <div className="investment-metric-top">
                      <span>Total principal invested</span>
                      <div className="investment-metric-icon">
                        <CircleDollarSign size={20} />
                      </div>
                    </div>
                    <h3>{formatCurrency(investmentPerformance.totalInvested)}</h3>
                    <p>Sum of recorded investment principal</p>
                  </article>

                  <article className="investment-metric-card">
                    <div className="investment-metric-top">
                      <span>Investment records</span>
                      <div className="investment-metric-icon">
                        <BriefcaseBusiness size={20} />
                      </div>
                    </div>
                    <h3>{investments.length}</h3>
                    <p>Investments saved in your account</p>
                  </article>

                  <article className="investment-metric-card">
                    <div className="investment-metric-top">
                      <span>Active investments</span>
                      <div className="investment-metric-icon">
                        <ChartNoAxesCombined size={20} />
                      </div>
                    </div>
                    <h3>{investmentPerformance.activeInvestments}</h3>
                    <p>Records marked active by the database</p>
                  </article>

                  <article className="investment-metric-card">
                    <div className="investment-metric-top">
                      <span>Active principal</span>
                      <div className="investment-metric-icon">
                        <Wallet size={20} />
                      </div>
                    </div>
                    <h3>
                      {formatCurrency(investmentPerformance.activePrincipal)}
                    </h3>
                    <p>Principal attached to active investments</p>
                  </article>
                </div>

                <div className="investment-breakdown-card">
                  <div className="investment-breakdown-heading">
                    <div>
                      <h3>Allocation by investment plan</h3>
                      <p>
                        Compare the principal recorded against each plan.
                      </p>
                    </div>
                    <span className="investment-breakdown-count">
                      {investmentBreakdown.length}{' '}
                      {investmentBreakdown.length === 1 ? 'plan' : 'plans'}
                    </span>
                  </div>

                  {investmentLoading ? (
                    <div className="investment-breakdown-empty">
                      <RefreshCw
                        size={22}
                        className="refresh-spinning"
                      />
                      <p>Loading your investment allocation...</p>
                    </div>
                  ) : investmentBreakdown.length === 0 ? (
                    <div className="investment-breakdown-empty">
                      <BriefcaseBusiness size={25} />
                      <h4>No investment data yet</h4>
                      <p>
                        When you invest in a plan, its principal allocation
                        will appear here.
                      </p>
                      <button
                        type="button"
                        className="dashboard-secondary-button"
                        onClick={() => navigateTo('Investment plans')}
                      >
                        Explore plans <ArrowUpRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="investment-breakdown-list">
                      {investmentBreakdown.map((item) => {
                        const allocation =
                          investmentPerformance.totalInvested > 0
                            ? (item.totalInvested /
                                investmentPerformance.totalInvested) *
                              100
                            : 0

                        return (
                          <article
                            className="investment-breakdown-item"
                            key={item.planId}
                          >
                            <div className="investment-breakdown-top">
                              <div>
                                <h4>{item.planName}</h4>
                                <p>
                                  {item.riskLevel} risk · {item.investmentCount}{' '}
                                  {item.investmentCount === 1
                                    ? 'investment'
                                    : 'investments'}
                                </p>
                              </div>
                              <strong>
                                {formatCurrency(item.totalInvested)}
                              </strong>
                            </div>

                            <div
                              className="investment-progress-track"
                              role="progressbar"
                              aria-label={`${item.planName} allocation`}
                              aria-valuenow={Math.round(allocation)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="investment-progress-fill"
                                style={{
                                  width: `${Math.min(100, Math.max(0, allocation))}%`,
                                }}
                              />
                            </div>

                            <div className="investment-breakdown-bottom">
                              <span>
                                {allocation.toFixed(1)}% of total principal
                              </span>
                              <span>
                                Active principal:{' '}
                                {formatCurrency(item.activePrincipal)}
                              </span>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>

                <p className="portfolio-disclaimer">
                  These metrics describe saved principal and investment statuses.
                  They do not represent profit, guaranteed returns, or live market value.
                </p>
              </section>

              {/* SAVED INVESTMENTS */}
              <section className="dashboard-section saved-investments-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="dashboard-eyebrow">YOUR HOLDINGS</p>
                    <h2>Your investments</h2>
                    <p className="dashboard-page-description">
                      Your saved investment records.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="dashboard-secondary-button"
                    onClick={loadInvestments}
                    disabled={investmentLoading}
                  >
                    <RefreshCw
                      size={16}
                      className={investmentLoading ? 'refresh-spinning' : ''}
                    />
                    Refresh
                  </button>
                </div>

                {investmentError && (
                  <p className="dashboard-error" role="alert">
                    {investmentError}
                  </p>
                )}

                {investmentLoading ? (
                  <div className="dashboard-page-card portfolio-state">
                    <RefreshCw
                      size={25}
                      className="refresh-spinning"
                    />
                    <h2>Loading your investments</h2>
                    <p>Please wait while your records load.</p>
                  </div>
                ) : !investmentError && investments.length === 0 ? (
                  <div className="dashboard-page-card portfolio-state">
                    <div className="portfolio-state-icon">
                      <BriefcaseBusiness size={27} />
                    </div>
                    <h2>No investments yet</h2>
                    <p>
                      Your saved investments will appear here after you invest in a plan.
                    </p>
                    <button
                      type="button"
                      className="dashboard-primary-button"
                      onClick={() => navigateTo('Investment plans')}
                    >
                      Explore plans <ArrowUpRight size={17} />
                    </button>
                  </div>
                ) : !investmentError ? (
                  <div className="portfolio-list">
                    {investments.map((investment) => (
                      <article
                        className="portfolio-item"
                        key={investment.id}
                      >
                        <div className="portfolio-item-icon">
                          <BriefcaseBusiness size={22} />
                        </div>

                        <div className="portfolio-item-main">
                          <h3>
                            {investment.plan_name || 'Investment plan'}
                          </h3>
                          <p>Investment ID: #{investment.id}</p>
                          <span className="portfolio-date">
                            <CalendarDays size={14} />
                            Started {formatDate(investment.invested_at)}
                          </span>
                        </div>

                        <div className="portfolio-item-balance">
                          <span>Principal amount</span>
                          <strong>
                            {formatCurrency(investment.principal_amount)}
                          </strong>
                          <span
                            className={`transaction-status status-${String(
                              investment.status || 'pending'
                            ).toLowerCase()}`}
                          >
                            {investment.status || 'pending'}
                          </span>

                          {/* NEW: OPEN INVESTMENT DETAILS */}
                          <button
                            type="button"
                            className="investment-details-button"
                            onClick={() => setSelectedInvestment(investment)}
                            aria-label={`View details for ${investment.plan_name || 'investment'} #${investment.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              marginTop: '12px',
                              padding: '10px 14px',
                              border: '1px solid #dce3ed',
                              borderRadius: '9px',
                              background: '#ffffff',
                              color: '#163b70',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <ReceiptText size={15} />
                            View details
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                <p className="portfolio-disclaimer">
                  These records show the principal invested. They do not represent
                  calculated returns or live market value.
                </p>
              </section>

              {portfolioError && (
                <div
                  className="portfolio-message portfolio-message-error"
                  role="alert"
                >
                  <p>{portfolioError}</p>
                  <button
                    type="button"
                    className="dashboard-secondary-button"
                    onClick={() => loadPortfolio(true)}
                    disabled={refreshing}
                  >
                    Try again
                  </button>
                </div>
              )}

              {portfolioLoading ? (
                <div className="dashboard-page-card portfolio-state">
                  <RefreshCw size={25} className="refresh-spinning" />
                  <h2>Loading your portfolio</h2>
                  <p>
                    Please wait while we retrieve your saved portfolio records.
                  </p>
                </div>
              ) : !portfolioError && portfolios.length === 0 ? (
                <div className="dashboard-page-card portfolio-state">
                  <div className="portfolio-state-icon">
                    <Wallet size={27} />
                  </div>
                  <h2>Your portfolio is ready to begin</h2>
                  <p>
                    No portfolio records were found for this account yet.
                    When a portfolio is created, it will appear here.
                  </p>
                  <button
                    type="button"
                    className="dashboard-primary-button"
                    onClick={() => navigateTo('Investment plans')}
                  >
                    Explore investment plans <ArrowUpRight size={17} />
                  </button>
                </div>
              ) : (
                !portfolioError && (
                  <>
                    <div className="portfolio-balance-card">
                      <div className="portfolio-balance-top">
                        <div className="portfolio-balance-icon">
                          <CircleDollarSign size={23} />
                        </div>
                        <span>COMBINED CASH BALANCE</span>
                      </div>
                      <h2>{formatCurrency(totalCashBalance)}</h2>
                      <p>
                        Total cash across {portfolios.length}{' '}
                        {portfolios.length === 1 ? 'portfolio' : 'portfolios'}
                      </p>
                      <div className="portfolio-balance-footer">
                        <ShieldCheck size={17} />
                        <span>Based on saved account records</span>
                      </div>
                    </div>

                    <div className="portfolio-summary-grid">
                      <article className="portfolio-summary-card">
                        <div className="portfolio-summary-icon">
                          <BriefcaseBusiness size={20} />
                        </div>
                        <span>Total portfolios</span>
                        <strong>{portfolios.length}</strong>
                        <p>Saved under your account</p>
                      </article>

                      <article className="portfolio-summary-card">
                        <div className="portfolio-summary-icon">
                          <Wallet size={20} />
                        </div>
                        <span>Available cash</span>
                        <strong>{formatCurrency(totalCashBalance)}</strong>
                        <p>Current recorded balance</p>
                      </article>
                    </div>

                    <div className="portfolio-list-heading">
                      <div>
                        <h2>Your portfolios</h2>
                        <p>Portfolio records linked to your account.</p>
                      </div>
                      <span className="portfolio-count">
                        {portfolios.length}{' '}
                        {portfolios.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>

                    <div className="portfolio-list">
                      {portfolios.map((portfolio) => (
                        <article
                          className="portfolio-item"
                          key={portfolio.id}
                        >
                          <div className="portfolio-item-icon">
                            <Wallet size={22} />
                          </div>
                          <div className="portfolio-item-main">
                            <h3>
                              {portfolio.portfolio_name || 'My Portfolio'}
                            </h3>
                            <p>Portfolio ID: #{portfolio.id}</p>
                            <span className="portfolio-date">
                              <CalendarDays size={14} />
                              Created {formatDate(portfolio.created_at)}
                            </span>
                          </div>
                          <div className="portfolio-item-balance">
                            <span>Cash balance</span>
                            <strong>
                              {formatCurrency(portfolio.cash_balance)}
                            </strong>
                          </div>
                        </article>
                      ))}
                    </div>

                    <p className="portfolio-disclaimer">
                      This dashboard displays cash balances stored in the database.
                      It does not yet calculate investment returns or market value.
                    </p>
                  </>
                )
              )}
            </section>
          )}

          {/* INVESTMENT PLANS */}
          {activePage === 'Investment plans' && (
            <section className="dashboard-section">
              <p className="dashboard-eyebrow">OPPORTUNITIES</p>
              <h1>Investment plans</h1>
              <p className="dashboard-page-description">
                Explore the available plans and allocate funds from your
                simulated portfolio balance.
              </p>

              <div className="cash-operation-hint">
                Available cash balance:{' '}
                <strong>{formatCurrency(totalCashBalance)}</strong>
              </div>

              {plansError && (
                <p className="dashboard-error" role="alert">
                  {plansError}
                </p>
              )}

              {!plansError && plans.length === 0 && (
                <p className="dashboard-empty">
                  No investment plans are currently available.
                </p>
              )}

              <div className="dashboard-plan-grid">
                {plans.map((plan) => (
                  <article className="dashboard-plan-card" key={plan.id}>
                    <div className="dashboard-plan-icon">
                      <ChartNoAxesCombined size={21} />
                    </div>
                    <span className="plan-category">INVESTMENT PLAN</span>
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>

                    <div className="dashboard-plan-meta">
                      <span>Risk classification</span>
                      <strong>{plan.risk_level}</strong>
                    </div>

                    <button
                      type="button"
                      className="dashboard-plan-button"
                      onClick={() => {
                        setSelectedPlan(plan)
                        setInvestmentAmount('')
                        setInvestmentError('')
                        setInvestmentSuccess('')
                      }}
                      disabled={investmentSubmitting}
                    >
                      Invest in this plan <ChevronRight size={17} />
                    </button>

                    {selectedPlan?.id === plan.id && (
                      <form
                        className="cash-operation-form investment-form"
                        onSubmit={handleInvestment}
                      >
                        <h4>Invest in {plan.name}</h4>
                        <label htmlFor={`investment-amount-${plan.id}`}>
                          Amount to invest (₦)
                        </label>

                        <div className="cash-operation-input-wrapper">
                          <span>₦</span>
                          <input
                            id={`investment-amount-${plan.id}`}
                            type="number"
                            min="0.01"
                            max="100000000000"
                            step="0.01"
                            placeholder="Enter amount"
                            value={investmentAmount}
                            onChange={(event) => {
                              setInvestmentAmount(event.target.value)
                              setInvestmentError('')
                              setInvestmentSuccess('')
                            }}
                            disabled={investmentSubmitting}
                            required
                          />
                        </div>

                        {investmentError && (
                          <div
                            className="cash-operation-message error"
                            role="alert"
                          >
                            {investmentError}
                          </div>
                        )}

                        {investmentSuccess && (
                          <div
                            className="cash-operation-message success"
                            role="status"
                          >
                            {investmentSuccess}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="dashboard-primary-button"
                          disabled={investmentSubmitting}
                        >
                          {investmentSubmitting
                            ? 'Processing...'
                            : 'Confirm investment'}
                        </button>

                        <button
                          type="button"
                          className="dashboard-secondary-button"
                          onClick={() => {
                            setSelectedPlan(null)
                            setInvestmentAmount('')
                            setInvestmentError('')
                            setInvestmentSuccess('')
                          }}
                          disabled={investmentSubmitting}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </div>

              <p className="portfolio-disclaimer">
                This is a development demonstration. Displayed balances and
                investment records are not proof of real financial transactions
                or investment returns.
              </p>
            </section>
          )}

          {/* TRANSACTION HISTORY */}
          {activePage === 'Transactions' && (
            <section className="transactions-page">
              <div className="transactions-page-heading">
                <div>
                  <p className="dashboard-eyebrow">ACCOUNT ACTIVITY</p>
                  <h1>Transaction history</h1>
                  <p className="dashboard-page-description">
                    Review and search the transaction records associated with your account.
                  </p>
                </div>

                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={() => loadTransactions(true)}
                  disabled={transactionRefreshing || transactionLoading}
                >
                  <RefreshCw
                    size={16}
                    className={transactionRefreshing ? 'refresh-spinning' : ''}
                  />
                  {transactionRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="transaction-summary-grid">
                <article className="transaction-summary-card">
                  <div className="transaction-summary-icon">
                    <ReceiptText size={21} />
                  </div>
                  <span>Total transactions</span>
                  <strong>{transactions.length}</strong>
                  <p>Records associated with your account</p>
                </article>

                <article className="transaction-summary-card">
                  <div className="transaction-summary-icon completed-icon">
                    <CircleCheck size={21} />
                  </div>
                  <span>Completed transactions</span>
                  <strong>{completedTransactions.length}</strong>
                  <p>Records marked as completed</p>
                </article>

                <article className="transaction-summary-card">
                  <div className="transaction-summary-icon pending-icon">
                    <Clock3 size={21} />
                  </div>
                  <span>Pending transactions</span>
                  <strong>{pendingTransactions.length}</strong>
                  <p>Records awaiting an outcome</p>
                </article>
              </div>

              <div className="transaction-history-card">
                <div className="transaction-history-heading">
                  <div>
                    <h2>All transactions</h2>
                    <p>Search and filter your transaction records.</p>
                  </div>
                  <span className="transaction-record-count">
                    {filteredTransactions.length}{' '}
                    {filteredTransactions.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                <div className="transaction-toolbar">
                  <label className="transaction-search">
                    <Search size={18} />
                    <input
                      type="search"
                      placeholder="Search transactions..."
                      value={transactionSearch}
                      onChange={(event) =>
                        setTransactionSearch(event.target.value)
                      }
                      aria-label="Search transactions"
                    />
                  </label>

                  <select
                    className="transaction-status-filter"
                    value={transactionStatus}
                    onChange={(event) =>
                      setTransactionStatus(event.target.value)
                    }
                    aria-label="Filter by transaction status"
                  >
                    <option value="all">All statuses</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {transactionError && (
                  <div
                    className="transaction-feedback transaction-feedback-error"
                    role="alert"
                  >
                    <p>{transactionError}</p>
                    <button
                      type="button"
                      className="dashboard-secondary-button"
                      onClick={() => loadTransactions(true)}
                      disabled={transactionRefreshing}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {transactionLoading ? (
                  <div className="transaction-empty-state">
                    <RefreshCw
                      size={26}
                      className="refresh-spinning"
                    />
                    <h3>Loading transaction history</h3>
                    <p>
                      Please wait while we retrieve your transaction records.
                    </p>
                  </div>
                ) : !transactionError && transactions.length === 0 ? (
                  <div className="transaction-empty-state">
                    <div className="transaction-empty-icon">
                      <ReceiptText size={27} />
                    </div>
                    <h3>No transactions yet</h3>
                    <p>
                      There are no transaction records linked to your account yet.
                      When records are saved in the database, they will appear here.
                    </p>
                  </div>
                ) : !transactionError && filteredTransactions.length === 0 ? (
                  <div className="transaction-empty-state">
                    <div className="transaction-empty-icon">
                      <Search size={27} />
                    </div>
                    <h3>No matching transactions</h3>
                    <p>
                      Try another search term or change the status filter to see more records.
                    </p>
                    <button
                      type="button"
                      className="dashboard-secondary-button"
                      onClick={() => {
                        setTransactionSearch('')
                        setTransactionStatus('all')
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : !transactionError ? (
                  <div className="transaction-table-wrapper">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Transaction</th>
                          <th>Reference</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => {
                          const Icon = getTransactionIcon(
                            transaction.transaction_type
                          )
                          const type = String(
                            transaction.transaction_type || ''
                          ).toLowerCase()
                          const status = String(
                            transaction.status || 'pending'
                          ).toLowerCase()

                          return (
                            <tr key={transaction.id}>
                              <td>
                                <div className="transaction-type-cell">
                                  <div
                                    className={`transaction-type-icon type-${type}`}
                                  >
                                    <Icon size={19} />
                                  </div>
                                  <div>
                                    <strong>{getTransactionLabel(type)}</strong>
                                    <span>
                                      {transaction.description ||
                                        transaction.portfolio_name ||
                                        'Account transaction'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="transaction-reference">
                                  {transaction.reference || '—'}
                                </span>
                              </td>
                              <td className="transaction-date">
                                {formatDateTime(transaction.created_at)}
                              </td>
                              <td className="transaction-amount">
                                {getTransactionAmount(transaction)}
                              </td>
                              <td>
                                <span
                                  className={`transaction-status status-${status}`}
                                >
                                  {status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>

              <p className="transaction-disclaimer">
                These entries reflect transaction records returned by the application
                database. They do not independently verify that a payment or money
                transfer occurred or was settled.
              </p>
            </section>
          )}

          {/* MY PROFILE */}
          {activePage === 'My profile' && (
            <section className="dashboard-page-card">
              <p className="dashboard-eyebrow">PERSONAL INFORMATION</p>
              <h1>My profile</h1>

              <div className="profile-detail">
                <span>Full name</span>
                <strong>{displayName}</strong>
              </div>

              <div className="profile-detail">
                <span>Email address</span>
                <strong>{user?.email || 'Not available'}</strong>
              </div>

              <div className="profile-detail">
                <span>Account type</span>
                <strong>Investor</strong>
              </div>
            </section>
          )}

          {/* SETTINGS */}
          {activePage === 'Settings' && (
            <section className="dashboard-page-card">
              <p className="dashboard-eyebrow">PREFERENCES</p>
              <h1>Account settings</h1>
              <p>
                Account preferences and additional security controls can be added here.
              </p>
              <button
                type="button"
                className="dashboard-primary-button"
                onClick={logout}
              >
                Sign out <LogOut size={17} />
              </button>
            </section>
          )}

          {/* NEW: INVESTMENT DETAILS MODAL */}
          {selectedInvestment && (
            <div
              role="presentation"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedInvestment(null)
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSelectedInvestment(null)
                }
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: 'rgba(8, 20, 40, 0.68)',
                backdropFilter: 'blur(5px)',
                overflowY: 'auto',
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="investment-modal-title"
                style={{
                  width: '100%',
                  maxWidth: '650px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  background: '#ffffff',
                  color: '#172b4d',
                  borderRadius: '18px',
                  padding: '28px',
                  boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    marginBottom: '24px',
                  }}
                >
                  <div>
                    <p className="dashboard-eyebrow">YOUR HOLDINGS</p>
                    <h2
                      id="investment-modal-title"
                      style={{
                        margin: '0 0 8px',
                        fontSize: '25px',
                        color: '#102b50',
                      }}
                    >
                      Investment details
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6 }}>
                      Review the information recorded for this investment.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedInvestment(null)}
                    aria-label="Close investment details"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      width: '40px',
                      height: '40px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px',
                    borderRadius: '14px',
                    background: '#f4f7fb',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '52px',
                      height: '52px',
                      flexShrink: 0,
                      borderRadius: '14px',
                      background: '#e0eaff',
                      color: '#2458a6',
                    }}
                  >
                    <BriefcaseBusiness size={25} />
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        color: '#64748b',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                      }}
                    >
                      INVESTMENT PLAN
                    </span>
                    <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>
                      {selectedInvestment.plan_name || 'Investment plan'}
                    </h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                      {selectedInvestment.plan_description ||
                        'Details recorded for your selected investment.'}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '22px',
                    borderRadius: '14px',
                    background: '#102b50',
                    color: '#ffffff',
                    marginBottom: '22px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    Principal amount invested
                  </span>
                  <h2 style={{ margin: '9px 0', fontSize: '28px' }}>
                    {formatCurrency(selectedInvestment.principal_amount)}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: '#cbd5e1',
                    }}
                  >
                    This is the recorded principal amount, not a calculation
                    of profit or investment returns.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {[
                    {
                      label: 'Investment ID',
                      value: `#${selectedInvestment.id}`,
                    },
                    {
                      label: 'Investment status',
                      value: selectedInvestment.status || 'Pending',
                    },
                    {
                      label: 'Risk classification',
                      value: selectedInvestment.risk_level || 'Not available',
                    },
                    {
                      label: 'Portfolio',
                      value: selectedInvestment.portfolio_name || 'Not available',
                    },
                    {
                      label: 'Date invested',
                      value: formatDateTime(selectedInvestment.invested_at),
                    },
                    {
                      label: 'Last updated',
                      value: formatDateTime(
                        selectedInvestment.updated_at ||
                          selectedInvestment.invested_at
                      ),
                    },
                  ].map((detail) => (
                    <div
                      key={detail.label}
                      style={{
                        padding: '15px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          color: '#64748b',
                          fontSize: '12px',
                        }}
                      >
                        {detail.label}
                      </span>
                      <strong
                        style={{
                          display: 'block',
                          overflowWrap: 'anywhere',
                          color: '#172b4d',
                          fontSize: '14px',
                          textTransform:
                            detail.label === 'Investment status'
                              ? 'capitalize'
                              : 'none',
                        }}
                      >
                        {detail.value}
                      </strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginTop: '22px',
                    padding: '15px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    color: '#1e40af',
                  }}
                >
                  <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.7 }}>
                    These details come from your application records. They do
                    not verify a real-world investment, guarantee returns, or
                    represent live market value.
                  </p>
                </div>

                <button
                  type="button"
                  className="dashboard-primary-button"
                  onClick={() => setSelectedInvestment(null)}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '22px',
                  }}
                >
                  Close details
                </button>
              </section>
            </div>
          )}

          <footer className="dashboard-footer">
            <span>APEX CAPITAL</span>
            <span>Investor portal</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
