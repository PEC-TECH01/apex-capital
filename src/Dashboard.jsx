
import { useCallback, useEffect, useState } from 'react'
import './Dashboard.css'
import { supabase } from './supabase'
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
  Camera,
} from 'lucide-react'

function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState('Overview')
  const [menuOpen, setMenuOpen] = useState(false)

  const [plans, setPlans] = useState([])
  const [plansError, setPlansError] = useState('')

  const [wallet, setWallet] = useState(null)
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

  const [avatarUrl, setAvatarUrl] = useState('')
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoMessage, setPhotoMessage] = useState('')
  const [photoError, setPhotoError] = useState('')

  const displayName =
    user?.user_metadata?.full_name ||
    user?.full_name ||
    user?.fullName ||
    'Investor'

  const userId = user?.id
  const totalCashBalance = Number(wallet?.balance || 0)

  const navigation = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'My investments', icon: BriefcaseBusiness },
    { label: 'Investment plans', icon: ChartNoAxesCombined },
    { label: 'Transactions', icon: Wallet },
    { label: 'My profile', icon: UserRound },
    { label: 'Settings', icon: Settings },
  ]

  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    })

  function formatDate(date) {
    if (!date) return 'Date unavailable'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable'

    return parsed.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatDateTime(date) {
    if (!date) return 'Date unavailable'
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable'

    return parsed.toLocaleString('en-GB', {
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
      withdraw: 'Withdrawal',
      withdrawal: 'Withdrawal',
      investment: 'Investment',
      return: 'Investment return',
    }

    return labels[String(type || '').toLowerCase()] || type || 'Transaction'
  }

  function getTransactionIcon(type) {
    switch (String(type || '').toLowerCase()) {
      case 'deposit':
        return ArrowDownLeft
      case 'withdraw':
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
    const type = String(transaction.type || '').toLowerCase()
    const amount = formatCurrency(transaction.amount)

    if (type === 'deposit' || type === 'return') return `+${amount}`
    if (type === 'withdraw' || type === 'withdrawal' || type === 'investment') {
      return `−${amount}`
    }

    return amount
  }

  const loadPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('investment_plans')
        .select('id, name, risk_level, description, minimum_investment')
        .order('id')

      if (error) throw error

      setPlans(data || [])
      setPlansError('')
    } catch (error) {
      setPlansError(error.message || 'Unable to load investment plans.')
    }
  }, [])

  const loadPortfolio = useCallback(async (showRefresh = false) => {
    if (!userId) {
      setPortfolioError('Please sign in again.')
      setPortfolioLoading(false)
      return
    }

    if (showRefresh) setRefreshing(true)
    else setPortfolioLoading(true)

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, user_id, balance, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      let walletData = data

      if (!walletData) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single()

        if (createError) {
          // Another request may have created the wallet at the same time.
          const { data: existingWallet, error: reloadError } = await supabase
            .from('wallets')
            .select('id, user_id, balance, created_at, updated_at')
            .eq('user_id', userId)
            .maybeSingle()

          if (reloadError || !existingWallet) throw createError
          walletData = existingWallet
        } else {
          walletData = newWallet
        }
      }

      setWallet(walletData)
      setPortfolioError('')
    } catch (error) {
      setPortfolioError(error.message || 'Unable to load your wallet.')
    } finally {
      setPortfolioLoading(false)
      setRefreshing(false)
    }
  }, [userId])

  const loadTransactions = useCallback(async (showRefresh = false) => {
    if (!userId) return

    if (showRefresh) setTransactionRefreshing(true)
    else setTransactionLoading(true)

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, user_id, type, amount, status, reference, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
      setTransactionError('')
    } catch (error) {
      setTransactionError(error.message || 'Unable to load transactions.')
    } finally {
      setTransactionLoading(false)
      setTransactionRefreshing(false)
    }
  }, [userId])

  const loadInvestments = useCallback(async () => {
    if (!userId) return

    setInvestmentLoading(true)
    setInvestmentError('')

    try {
      const { data, error } = await supabase
        .from('investments')
        .select('id, user_id, plan_id, amount, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const planMap = new Map(plans.map((plan) => [String(plan.id), plan]))

      const mappedInvestments = (data || []).map((investment) => {
        const plan = planMap.get(String(investment.plan_id))

        return {
          ...investment,
          principal_amount: investment.amount,
          invested_at: investment.created_at,
          plan_name: plan?.name || 'Investment plan',
          plan_description: plan?.description || '',
          risk_level: plan?.risk_level || 'Not specified',
          plan_minimum: plan?.minimum_investment,
        }
      })

      setInvestments(mappedInvestments)
    } catch (error) {
      setInvestmentError(error.message || 'Unable to load your investments.')
    } finally {
      setInvestmentLoading(false)
    }
  }, [userId, plans])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  useEffect(() => {
    if (activePage === 'My investments') loadInvestments()
  }, [activePage, loadInvestments])

  useEffect(() => {
    if (activePage === 'Transactions') loadTransactions()
  }, [activePage, loadTransactions])

  useEffect(() => {
    let cancelled = false

    async function loadAvatar() {
      const path = user?.user_metadata?.avatar_path

      if (!path) {
        setAvatarUrl('')
        return
      }

      const { data, error } = await supabase.storage
        .from('profile-photos')
        .createSignedUrl(path, 3600)

      if (!cancelled && !error) setAvatarUrl(data.signedUrl)
    }

    loadAvatar()

    return () => {
      cancelled = true
    }
  }, [user?.user_metadata?.avatar_path])

  const investmentPerformance = investments.reduce(
    (summary, investment) => {
      const principal = Number(investment.amount || 0)
      summary.totalInvested += principal

      if (String(investment.status || '').toLowerCase() === 'active') {
        summary.activeInvestments += 1
        summary.activePrincipal += principal
      }

      return summary
    },
    { totalInvested: 0, activeInvestments: 0, activePrincipal: 0 }
  )

  const investmentBreakdown = Object.values(
    investments.reduce((groups, investment) => {
      const key = String(investment.plan_id)

      if (!groups[key]) {
        groups[key] = {
          planId: key,
          planName: investment.plan_name,
          riskLevel: investment.risk_level,
          investmentCount: 0,
          totalInvested: 0,
          activePrincipal: 0,
        }
      }

      groups[key].investmentCount += 1
      groups[key].totalInvested += Number(investment.amount || 0)

      if (String(investment.status).toLowerCase() === 'active') {
        groups[key].activePrincipal += Number(investment.amount || 0)
      }

      return groups
    }, {})
  ).sort((a, b) => b.totalInvested - a.totalInvested)

  async function handleCashOperation(event) {
    event.preventDefault()
    setCashOperationError('')
    setCashOperationSuccess('')

    const amountText = cashAmount.trim()
    const amount = Number(amountText)

    if (
      !amountText ||
      !/^\d+(\.\d{1,2})?$/.test(amountText) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000000000
    ) {
      setCashOperationError('Enter a valid amount with no more than two decimal places.')
      return
    }

    if (cashOperationType === 'withdraw' && amount > totalCashBalance) {
      setCashOperationError('Your withdrawal exceeds your available cash balance.')
      return
    }

    setCashOperationLoading(true)

    try {
      const { data, error } = await supabase.rpc('apex_account_operation', {
        p_type: cashOperationType,
        p_amount: amount,
        p_plan_id: null,
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'The transaction could not be completed.')

      setCashOperationSuccess(
        `${cashOperationType === 'deposit' ? 'Simulated deposit' : 'Withdrawal'} recorded successfully. Reference: ${data.reference}`
      )
      setCashAmount('')

      await Promise.all([
        loadPortfolio(true),
        loadTransactions(true),
      ])
    } catch (error) {
      setCashOperationError(error.message || 'Unable to process this transaction.')
    } finally {
      setCashOperationLoading(false)
    }
  }

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
      setInvestmentError('Enter a valid amount with no more than two decimal places.')
      return
    }

    if (amount < Number(selectedPlan.minimum_investment || 0)) {
      setInvestmentError(
        `The minimum investment for this plan is ${formatCurrency(selectedPlan.minimum_investment)}.`
      )
      return
    }

    if (amount > totalCashBalance) {
      setInvestmentError('Your investment exceeds your available cash balance.')
      return
    }

    setInvestmentSubmitting(true)

    try {
      const { data, error } = await supabase.rpc('apex_account_operation', {
        p_type: 'investment',
        p_amount: amount,
        p_plan_id: String(selectedPlan.id),
      })

      if (error) throw error
      if (!data?.success) throw new Error(data?.message || 'The investment could not be completed.')

      setInvestmentSuccess(
        `Investment recorded successfully. Reference: ${data.reference}`
      )
      setInvestmentAmount('')

      await Promise.all([
        loadPortfolio(true),
        loadInvestments(),
        loadTransactions(true),
      ])
    } catch (error) {
      setInvestmentError(error.message || 'Unable to complete your investment.')
    } finally {
      setInvestmentSubmitting(false)
    }
  }

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setPhotoError('')
    setPhotoMessage('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Choose a JPG, PNG or WebP image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Your image must be 5 MB or smaller.')
      return
    }

    if (!userId) {
      setPhotoError('Please sign in again.')
      return
    }

    setPhotoLoading(true)

    try {
      const extension = file.name.split('.').pop().toLowerCase()
      const path = `${userId}/${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_path: path },
      })

      if (updateError) throw updateError

      const { data, error: urlError } = await supabase.storage
        .from('profile-photos')
        .createSignedUrl(path, 3600)

      if (urlError) throw urlError

      setAvatarUrl(data.signedUrl)
      setPhotoMessage('Profile photo uploaded successfully.')
    } catch (error) {
      setPhotoError(error.message || 'Unable to upload your profile photo.')
    } finally {
      setPhotoLoading(false)
      event.target.value = ''
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setPhotoError(error.message || 'Unable to sign out. Please try again.')
      return
    }

    onLogout?.()
  }

  function navigateTo(page) {
    setActivePage(page)
    setMenuOpen(false)
    setSelectedInvestment(null)
  }

  const completedTransactions = transactions.filter(
    (transaction) => String(transaction.status).toLowerCase() === 'completed'
  )

  const pendingTransactions = transactions.filter(
    (transaction) => String(transaction.status).toLowerCase() === 'pending'
  )

  const filteredTransactions = transactions.filter((transaction) => {
    const searchTerm = transactionSearch.trim().toLowerCase()

    const searchableText = [
      transaction.reference,
      transaction.type,
      transaction.status,
    ].filter(Boolean).join(' ').toLowerCase()

    return (
      (!searchTerm || searchableText.includes(searchTerm)) &&
      (transactionStatus === 'all' ||
        String(transaction.status).toLowerCase() === transactionStatus)
    )
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
              className={activePage === label ? 'dashboard-nav-link active' : 'dashboard-nav-link'}
              onClick={() => navigateTo(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {activePage === label && <ChevronRight size={16} className="nav-chevron" />}
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

          <button type="button" className="dashboard-logout" onClick={logout}>
            <LogOut size={19} /> Sign out
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
            <button type="button" className="dashboard-icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>

            <div className="dashboard-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : displayName.charAt(0).toUpperCase()}
            </div>

            <div className="dashboard-user">
              <strong>{displayName}</strong>
              <span>Investor account</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {activePage === 'Overview' && (
            <>
              <section className="dashboard-welcome">
                <div>
                  <p className="dashboard-eyebrow">INVESTOR PORTAL</p>
                  <h1>Welcome back, {displayName.split(' ')[0]}.</h1>
                  <p>Review your account, explore investment plans, and keep track of your financial goals.</p>
                </div>
                <button type="button" className="dashboard-primary-button" onClick={() => navigateTo('Investment plans')}>
                  Explore plans <ArrowUpRight size={17} />
                </button>
              </section>

              <section className="dashboard-stat-grid">
                <article className="dashboard-stat-card">
                  <div className="stat-heading"><span>Account status</span><ShieldCheck size={20} /></div>
                  <h2>Registered</h2>
                  <p className="stat-caption">Your account is available.</p>
                </article>

                <article className="dashboard-stat-card">
                  <div className="stat-heading"><span>Available plans</span><ChartNoAxesCombined size={20} /></div>
                  <h2>{plans.length}</h2>
                  <p className="stat-caption">{plansError || 'Plans available on the platform.'}</p>
                </article>

                <article className="dashboard-stat-card">
                  <div className="stat-heading"><span>Wallet balance</span><Wallet size={20} /></div>
                  <h2>{portfolioLoading ? 'Loading...' : portfolioError ? 'Unavailable' : formatCurrency(totalCashBalance)}</h2>
                  <p className="stat-caption">{portfolioError || 'Balance recorded in your wallet.'}</p>
                </article>
              </section>

              <section className="dashboard-section">
                <div className="dashboard-section-heading">
                  <div><p className="dashboard-eyebrow">OPPORTUNITIES</p><h2>Investment plans</h2></div>
                  <button type="button" className="dashboard-text-button" onClick={() => navigateTo('Investment plans')}>View all <ArrowUpRight size={16} /></button>
                </div>

                {plansError && <p className="dashboard-error" role="alert">{plansError}</p>}
                {!plansError && plans.length === 0 && <p className="dashboard-empty">No investment plans are currently available.</p>}

                <div className="dashboard-plan-grid">
                  {plans.slice(0, 3).map((plan) => (
                    <article className="dashboard-plan-card" key={plan.id}>
                      <div className="dashboard-plan-icon"><BriefcaseBusiness size={21} /></div>
                      <span className="plan-category">INVESTMENT PLAN</span>
                      <h3>{plan.name}</h3>
                      <p>{plan.description}</p>
                      <div className="dashboard-plan-meta">
                        <span>Risk classification</span><strong>{plan.risk_level}</strong>
                      </div>
                      <button type="button" className="dashboard-plan-button" onClick={() => navigateTo('Investment plans')}>
                        View plan details <ChevronRight size={17} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="dashboard-account-card">
                <div className="account-card-icon"><UserRound size={23} /></div>
                <div><h3>Your account</h3><p>View your profile information and manage your account.</p></div>
                <button type="button" className="dashboard-text-button" onClick={() => navigateTo('My profile')}>
                  View profile <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          )}

          {activePage === 'My investments' && (
            <section className="dashboard-section portfolio-page">
              <div className="portfolio-page-heading">
                <div>
                  <p className="dashboard-eyebrow">YOUR FINANCIAL OVERVIEW</p>
                  <h1>My investments</h1>
                  <p className="dashboard-page-description">A clear view of your wallet and saved investments.</p>
                </div>
                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={() => {
                    loadPortfolio(true)
                    loadInvestments()
                  }}
                  disabled={refreshing || investmentLoading}
                >
                  <RefreshCw size={16} className={refreshing ? 'refresh-spinning' : ''} />
                  Refresh
                </button>
              </div>

              <section className="cash-operation-card">
                <div className="cash-operation-heading">
                  <div>
                    <p className="dashboard-eyebrow">ACCOUNT FUNDING</p>
                    <h2>Manage your cash</h2>
                    <p>Add a simulated deposit or request a withdrawal from your available wallet balance.</p>
                  </div>
                  <div className="cash-operation-heading-icon"><CircleDollarSign size={25} /></div>
                </div>

                <div className="cash-operation-tabs">
                  <button type="button" className={cashOperationType === 'deposit' ? 'cash-operation-tab active' : 'cash-operation-tab'} onClick={() => { setCashOperationType('deposit'); setCashOperationError(''); setCashOperationSuccess('') }} disabled={cashOperationLoading}>
                    <ArrowDownLeft size={18} /> Deposit
                  </button>
                  <button type="button" className={cashOperationType === 'withdraw' ? 'cash-operation-tab active' : 'cash-operation-tab'} onClick={() => { setCashOperationType('withdraw'); setCashOperationError(''); setCashOperationSuccess('') }} disabled={cashOperationLoading}>
                    <ArrowUpRight size={18} /> Withdraw
                  </button>
                </div>

                <form className="cash-operation-form" onSubmit={handleCashOperation}>
                  <label htmlFor="cash-amount">{cashOperationType === 'deposit' ? 'Amount to deposit' : 'Amount to withdraw'}</label>
                  <div className="cash-operation-input-wrapper">
                    <span>₦</span>
                    <input id="cash-amount" type="number" min="0.01" max="100000000000" step="0.01" placeholder="Enter amount" value={cashAmount} onChange={(event) => { setCashAmount(event.target.value); setCashOperationError(''); setCashOperationSuccess('') }} disabled={cashOperationLoading} required />
                  </div>
                  <p className="cash-operation-hint">Available cash balance: <strong>{formatCurrency(totalCashBalance)}</strong></p>
                  {cashOperationError && <div className="cash-operation-message error" role="alert">{cashOperationError}</div>}
                  {cashOperationSuccess && <div className="cash-operation-message success" role="status">{cashOperationSuccess}</div>}
                  <button type="submit" className="dashboard-primary-button cash-operation-submit" disabled={cashOperationLoading || portfolioLoading}>
                    {cashOperationLoading ? <><RefreshCw size={17} className="refresh-spinning" /> Processing...</> : <>{cashOperationType === 'deposit' ? 'Confirm deposit' : 'Confirm withdrawal'} {cashOperationType === 'deposit' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</>}
                  </button>
                </form>
                <p className="cash-operation-disclaimer">Demo transactions only. No real money is transferred.</p>
              </section>

              <section className="investment-performance-section">
                <div className="dashboard-section-heading">
                  <div>
                    <p className="dashboard-eyebrow">PORTFOLIO ANALYTICS</p>
                    <h2>Investment performance</h2>
                    <p className="dashboard-page-description">A summary of the investment principal recorded in your account.</p>
                  </div>
                </div>

                {investmentError && <p className="dashboard-error" role="alert">{investmentError}</p>}

                <div className="investment-performance-grid">
                  <article className="investment-metric-card"><div className="investment-metric-top"><span>Total principal invested</span><div className="investment-metric-icon"><CircleDollarSign size={20} /></div></div><h3>{formatCurrency(investmentPerformance.totalInvested)}</h3><p>Sum of recorded investment principal</p></article>
                  <article className="investment-metric-card"><div className="investment-metric-top"><span>Investment records</span><div className="investment-metric-icon"><BriefcaseBusiness size={20} /></div></div><h3>{investments.length}</h3><p>Investments saved in your account</p></article>
                  <article className="investment-metric-card"><div className="investment-metric-top"><span>Active investments</span><div className="investment-metric-icon"><ChartNoAxesCombined size={20} /></div></div><h3>{investmentPerformance.activeInvestments}</h3><p>Records marked active by the database</p></article>
                  <article className="investment-metric-card"><div className="investment-metric-top"><span>Active principal</span><div className="investment-metric-icon"><Wallet size={20} /></div></div><h3>{formatCurrency(investmentPerformance.activePrincipal)}</h3><p>Principal attached to active investments</p></article>
                </div>

                <div className="investment-breakdown-card">
                  <div className="investment-breakdown-heading">
                    <div><h3>Allocation by investment plan</h3><p>Compare the principal recorded against each plan.</p></div>
                    <span className="investment-breakdown-count">{investmentBreakdown.length} {investmentBreakdown.length === 1 ? 'plan' : 'plans'}</span>
                  </div>

                  {investmentLoading ? (
                    <div className="investment-breakdown-empty"><RefreshCw size={22} className="refresh-spinning" /><p>Loading your investment allocation...</p></div>
                  ) : investmentBreakdown.length === 0 ? (
                    <div className="investment-breakdown-empty"><BriefcaseBusiness size={25} /><h4>No investment data yet</h4><p>When you invest in a plan, its principal allocation will appear here.</p><button type="button" className="dashboard-secondary-button" onClick={() => navigateTo('Investment plans')}>Explore plans <ArrowUpRight size={16} /></button></div>
                  ) : (
                    <div className="investment-breakdown-list">
                      {investmentBreakdown.map((item) => {
                        const allocation = investmentPerformance.totalInvested > 0 ? item.totalInvested / investmentPerformance.totalInvested * 100 : 0
                        return (
                          <article className="investment-breakdown-item" key={item.planId}>
                            <div className="investment-breakdown-top">
                              <div><h4>{item.planName}</h4><p>{item.riskLevel} risk · {item.investmentCount} {item.investmentCount === 1 ? 'investment' : 'investments'}</p></div>
                              <strong>{formatCurrency(item.totalInvested)}</strong>
                            </div>
                            <div className="investment-progress-track" role="progressbar" aria-label={`${item.planName} allocation`} aria-valuenow={Math.round(allocation)} aria-valuemin={0} aria-valuemax={100}>
                              <div className="investment-progress-fill" style={{ width: `${Math.min(100, Math.max(0, allocation))}%` }} />
                            </div>
                            <div className="investment-breakdown-bottom"><span>{allocation.toFixed(1)}% of total principal</span><span>Active principal: {formatCurrency(item.activePrincipal)}</span></div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
                <p className="portfolio-disclaimer">These metrics describe saved principal and investment statuses. They do not represent profit, guaranteed returns, or live market value.</p>
              </section>

              <section className="dashboard-section saved-investments-section">
                <div className="dashboard-section-heading">
                  <div><p className="dashboard-eyebrow">YOUR HOLDINGS</p><h2>Your investments</h2><p className="dashboard-page-description">Your saved investment records.</p></div>
                  <button type="button" className="dashboard-secondary-button" onClick={loadInvestments} disabled={investmentLoading}><RefreshCw size={16} className={investmentLoading ? 'refresh-spinning' : ''} /> Refresh</button>
                </div>

                {investmentLoading ? (
                  <div className="dashboard-page-card portfolio-state"><RefreshCw size={25} className="refresh-spinning" /><h2>Loading your investments</h2><p>Please wait while your records load.</p></div>
                ) : investmentError ? (
                  <p className="dashboard-error" role="alert">{investmentError}</p>
                ) : investments.length === 0 ? (
                  <div className="dashboard-page-card portfolio-state"><div className="portfolio-state-icon"><BriefcaseBusiness size={27} /></div><h2>No investments yet</h2><p>Your saved investments will appear here after you invest in a plan.</p><button type="button" className="dashboard-primary-button" onClick={() => navigateTo('Investment plans')}>Explore plans <ArrowUpRight size={17} /></button></div>
                ) : (
                  <div className="portfolio-list">
                    {investments.map((investment) => (
                      <article className="portfolio-item" key={investment.id}>
                        <div className="portfolio-item-icon"><BriefcaseBusiness size={22} /></div>
                        <div className="portfolio-item-main">
                          <h3>{investment.plan_name}</h3>
                          <p>Investment ID: #{investment.id}</p>
                          <span className="portfolio-date"><CalendarDays size={14} /> Started {formatDate(investment.created_at)}</span>
                        </div>
                        <div className="portfolio-item-balance">
                          <span>Principal amount</span>
                          <strong>{formatCurrency(investment.amount)}</strong>
                          <span className={`transaction-status status-${String(investment.status || 'pending').toLowerCase()}`}>{investment.status || 'pending'}</span>
                          <button type="button" className="investment-details-button" onClick={() => setSelectedInvestment(investment)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 14px', border: '1px solid #dce3ed', borderRadius: '9px', background: '#fff', color: '#163b70', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}><ReceiptText size={15} /> View details</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <p className="portfolio-disclaimer">These records show the principal invested. They do not represent calculated returns or live market value.</p>
              </section>

              {portfolioError && <div className="portfolio-message portfolio-message-error" role="alert"><p>{portfolioError}</p><button type="button" className="dashboard-secondary-button" onClick={() => loadPortfolio(true)}>Try again</button></div>}

              {!portfolioLoading && !portfolioError && (
                <div className="portfolio-balance-card">
                  <div className="portfolio-balance-top"><div className="portfolio-balance-icon"><CircleDollarSign size={23} /></div><span>AVAILABLE WALLET BALANCE</span></div>
                  <h2>{formatCurrency(totalCashBalance)}</h2>
                  <p>Your current recorded wallet balance</p>
                  <div className="portfolio-balance-footer"><ShieldCheck size={17} /><span>Based on your Supabase wallet record</span></div>
                </div>
              )}
            </section>
          )}

          {activePage === 'Investment plans' && (
            <section className="dashboard-section">
              <p className="dashboard-eyebrow">OPPORTUNITIES</p>
              <h1>Investment plans</h1>
              <p className="dashboard-page-description">Explore the available plans and allocate funds from your simulated wallet balance.</p>
              <div className="cash-operation-hint">Available cash balance: <strong>{formatCurrency(totalCashBalance)}</strong></div>
              {plansError && <p className="dashboard-error" role="alert">{plansError}</p>}

              <div className="dashboard-plan-grid">
                {plans.map((plan) => (
                  <article className="dashboard-plan-card" key={plan.id}>
                    <div className="dashboard-plan-icon"><ChartNoAxesCombined size={21} /></div>
                    <span className="plan-category">INVESTMENT PLAN</span>
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                    <div className="dashboard-plan-meta"><span>Risk classification</span><strong>{plan.risk_level}</strong></div>
                    <div className="dashboard-plan-meta"><span>Minimum investment</span><strong>{formatCurrency(plan.minimum_investment)}</strong></div>
                    <button type="button" className="dashboard-plan-button" onClick={() => { setSelectedPlan(plan); setInvestmentAmount(''); setInvestmentError(''); setInvestmentSuccess('') }} disabled={investmentSubmitting}>Invest in this plan <ChevronRight size={17} /></button>

                    {selectedPlan?.id === plan.id && (
                      <form className="cash-operation-form investment-form" onSubmit={handleInvestment}>
                        <h4>Invest in {plan.name}</h4>
                        <label htmlFor={`investment-amount-${plan.id}`}>Amount to invest (₦)</label>
                        <div className="cash-operation-input-wrapper"><span>₦</span><input id={`investment-amount-${plan.id}`} type="number" min={plan.minimum_investment || '0.01'} max="100000000000" step="0.01" placeholder="Enter amount" value={investmentAmount} onChange={(event) => { setInvestmentAmount(event.target.value); setInvestmentError(''); setInvestmentSuccess('') }} disabled={investmentSubmitting} required /></div>
                        {investmentError && <div className="cash-operation-message error" role="alert">{investmentError}</div>}
                        {investmentSuccess && <div className="cash-operation-message success" role="status">{investmentSuccess}</div>}
                        <button type="submit" className="dashboard-primary-button" disabled={investmentSubmitting}>{investmentSubmitting ? 'Processing...' : 'Confirm investment'}</button>
                        <button type="button" className="dashboard-secondary-button" onClick={() => { setSelectedPlan(null); setInvestmentAmount(''); setInvestmentError(''); setInvestmentSuccess('') }} disabled={investmentSubmitting}>Cancel</button>
                      </form>
                    )}
                  </article>
                ))}
              </div>
              <p className="portfolio-disclaimer">represent financial products.</p>
            </section>
          )}

          {activePage === 'Transactions' && (
            <section className="transactions-page">
              <div className="transactions-page-heading">
                <div><p className="dashboard-eyebrow">ACCOUNT ACTIVITY</p><h1>Transaction history</h1><p className="dashboard-page-description">Review and search the transaction records associated with your account.</p></div>
                <button type="button" className="dashboard-secondary-button" onClick={() => loadTransactions(true)} disabled={transactionRefreshing || transactionLoading}><RefreshCw size={16} className={transactionRefreshing ? 'refresh-spinning' : ''} /> Refresh</button>
              </div>

              <div className="transaction-summary-grid">
                <article className="transaction-summary-card"><div className="transaction-summary-icon"><ReceiptText size={21} /></div><span>Total transactions</span><strong>{transactions.length}</strong><p>Records associated with your account</p></article>
                <article className="transaction-summary-card"><div className="transaction-summary-icon completed-icon"><CircleCheck size={21} /></div><span>Completed transactions</span><strong>{completedTransactions.length}</strong><p>Records marked as completed</p></article>
                <article className="transaction-summary-card"><div className="transaction-summary-icon pending-icon"><Clock3 size={21} /></div><span>Pending transactions</span><strong>{pendingTransactions.length}</strong><p>Records awaiting an outcome</p></article>
              </div>

              <div className="transaction-history-card">
                <div className="transaction-history-heading"><div><h2>All transactions</h2><p>Search and filter your transaction records.</p></div><span className="transaction-record-count">{filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'}</span></div>

                <div className="transaction-toolbar">
                  <label className="transaction-search"><Search size={18} /><input type="search" placeholder="Search transactions..." value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} aria-label="Search transactions" /></label>
                  <select className="transaction-status-filter" value={transactionStatus} onChange={(event) => setTransactionStatus(event.target.value)} aria-label="Filter by transaction status">
                    <option value="all">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {transactionError && <div className="transaction-feedback transaction-feedback-error" role="alert"><p>{transactionError}</p><button type="button" className="dashboard-secondary-button" onClick={() => loadTransactions(true)}>Try again</button></div>}

                {transactionLoading ? (
                  <div className="transaction-empty-state"><RefreshCw size={26} className="refresh-spinning" /><h3>Loading transaction history</h3><p>Please wait while we retrieve your transaction records.</p></div>
                ) : !transactionError && transactions.length === 0 ? (
                  <div className="transaction-empty-state"><div className="transaction-empty-icon"><ReceiptText size={27} /></div><h3>No transactions yet</h3><p>Your account transactions will appear here.</p></div>
                ) : !transactionError && filteredTransactions.length === 0 ? (
                  <div className="transaction-empty-state"><div className="transaction-empty-icon"><Search size={27} /></div><h3>No matching transactions</h3><p>Try another search term or change the status filter.</p><button type="button" className="dashboard-secondary-button" onClick={() => { setTransactionSearch(''); setTransactionStatus('all') }}>Clear filters</button></div>
                ) : !transactionError && (
                  <div className="transaction-table-wrapper">
                    <table className="transaction-table">
                      <thead><tr><th>Transaction</th><th>Reference</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => {
                          const Icon = getTransactionIcon(transaction.type)
                          const type = String(transaction.type || '').toLowerCase()
                          const status = String(transaction.status || 'pending').toLowerCase()
                          return (
                            <tr key={transaction.id}>
                              <td><div className="transaction-type-cell"><div className={`transaction-type-icon type-${type}`}><Icon size={19} /></div><div><strong>{getTransactionLabel(type)}</strong><span>Account transaction</span></div></div></td>
                              <td><span className="transaction-reference">{transaction.reference || '—'}</span></td>
                              <td className="transaction-date">{formatDateTime(transaction.created_at)}</td>
                              <td className="transaction-amount">{getTransactionAmount(transaction)}</td>
                              <td><span className={`transaction-status status-${status}`}>{status}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="transaction-disclaimer">These entries reflect transaction records returned by the application.</p>
            </section>
          )}

          {activePage === 'My profile' && (
            <section className="dashboard-page-card">
              <p className="dashboard-eyebrow">PERSONAL INFORMATION</p>
              <h1>My profile</h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap', margin: '24px 0' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#e8eef8', color: '#163b70', fontSize: '32px', fontWeight: 700 }}>
                  {avatarUrl ? <img src={avatarUrl} alt="Your profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px' }}>Profile photo</h3>
                  <p style={{ margin: '0 0 12px', color: '#64748b' }}>Upload a JPG, PNG or WebP image. Maximum size: 5 MB.</p>
                  <label className="dashboard-primary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Camera size={17} /> {photoLoading ? 'Uploading...' : 'Upload photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={photoLoading} style={{ display: 'none' }} />
                  </label>
                  {photoMessage && <p style={{ color: '#15803d', marginTop: '10px' }}>{photoMessage}</p>}
                  {photoError && <p className="dashboard-error" role="alert">{photoError}</p>}
                </div>
              </div>

              <div className="profile-detail"><span>Full name</span><strong>{displayName}</strong></div>
              <div className="profile-detail"><span>Email address</span><strong>{user?.email || 'Not available'}</strong></div>
              <div className="profile-detail"><span>Account type</span><strong>Investor</strong></div>
              <div className="profile-detail"><span>Account created</span><strong>{formatDate(user?.created_at)}</strong></div>
            </section>
          )}

          {activePage === 'Settings' && (
            <section className="dashboard-page-card">
              <p className="dashboard-eyebrow">PREFERENCES</p>
              <h1>Account settings</h1>
              <p>Account preferences and additional security controls can be added here.</p>
              <button type="button" className="dashboard-primary-button" onClick={logout}>Sign out <LogOut size={17} /></button>
            </section>
          )}

          {selectedInvestment && (
            <div
              role="presentation"
              onClick={(event) => { if (event.target === event.currentTarget) setSelectedInvestment(null) }}
              onKeyDown={(event) => { if (event.key === 'Escape') setSelectedInvestment(null) }}
              style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(8,20,40,.68)', backdropFilter: 'blur(5px)', overflowY: 'auto' }}
            >
              <section role="dialog" aria-modal="true" aria-labelledby="investment-modal-title" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', background: '#fff', color: '#172b4d', borderRadius: '18px', padding: '28px', boxShadow: '0 25px 80px rgba(0,0,0,.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                  <div><p className="dashboard-eyebrow">YOUR HOLDINGS</p><h2 id="investment-modal-title" style={{ margin: '0 0 8px', fontSize: '25px', color: '#102b50' }}>Investment details</h2><p style={{ margin: 0, color: '#64748b' }}>Review the information recorded for this investment.</p></div>
                  <button type="button" onClick={() => setSelectedInvestment(null)} aria-label="Close investment details" style={{ width: '40px', height: '40px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '18px', borderRadius: '14px', background: '#f4f7fb', marginBottom: '20px' }}>
                  <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>INVESTMENT PLAN</span>
                  <h3 style={{ margin: '8px 0' }}>{selectedInvestment.plan_name}</h3>
                  <p style={{ margin: 0, color: '#64748b' }}>{selectedInvestment.plan_description || 'Details recorded for your selected investment.'}</p>
                </div>

                <div style={{ padding: '22px', borderRadius: '14px', background: '#102b50', color: '#fff', marginBottom: '22px' }}>
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Principal amount invested</span>
                  <h2 style={{ margin: '9px 0', fontSize: '28px' }}>{formatCurrency(selectedInvestment.amount)}</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1' }}>Recorded investment principal, not a calculated return.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '16px' }}>
                  {[
                    { label: 'Investment ID', value: `#${selectedInvestment.id}` },
                    { label: 'Investment status', value: selectedInvestment.status || 'Pending' },
                    { label: 'Risk classification', value: selectedInvestment.risk_level || 'Not available' },
                    { label: 'Investment plan', value: selectedInvestment.plan_name || 'Not available' },
                    { label: 'Date invested', value: formatDateTime(selectedInvestment.created_at) },
                  ].map((detail) => (
                    <div key={detail.label} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <span style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '12px' }}>{detail.label}</span>
                      <strong style={{ fontSize: '14px', textTransform: detail.label === 'Investment status' ? 'capitalize' : 'none' }}>{detail.value}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '22px', padding: '15px', borderRadius: '12px', background: '#eff6ff', color: '#1e40af' }}>
                  <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.7 }}>This is a demonstration investment record. It does not represent a real financial product or guaranteed return.</p>
                </div>

                <button type="button" className="dashboard-primary-button" onClick={() => setSelectedInvestment(null)} style={{ width: '100%', justifyContent: 'center', marginTop: '22px' }}>Close details</button>
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
