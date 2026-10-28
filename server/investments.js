
import express from 'express'
import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'

const router = express.Router()

// Authenticate the logged-in user.
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in.',
    })
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: 'Authentication is not configured on the server.',
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.userId ?? decoded.id ?? decoded.sub

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      })
    }

    req.userId = userId
    next()
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Your session is invalid or expired. Please sign in again.',
    })
  }
}

// GET /api/investments
// Retrieve the user's investments, summary, and plan breakdown.
router.get('/', authenticateToken, async (req, res) => {
  try {
    const investmentsResult = await pool.query(
      `SELECT
          i.id,
          i.portfolio_id,
          i.plan_id,
          i.principal_amount,
          i.status,
          i.invested_at,
          i.updated_at,
          ip.name AS plan_name,
          ip.description AS plan_description,
          ip.risk_level,
          p.portfolio_name
       FROM investments AS i
       INNER JOIN portfolios AS p
         ON p.id = i.portfolio_id
       INNER JOIN investment_plans AS ip
         ON ip.id = i.plan_id
       WHERE p.user_id = $1
       ORDER BY i.invested_at DESC, i.id DESC`,
      [req.userId]
    )

    const summaryResult = await pool.query(
      `SELECT
          COUNT(*)::int AS total_investments,
          COUNT(*) FILTER (
            WHERE LOWER(i.status) = 'active'
          )::int AS active_investments,
          COALESCE(
            SUM(i.principal_amount),
            0
          )::numeric(20, 2) AS total_invested,
          COALESCE(
            SUM(i.principal_amount) FILTER (
              WHERE LOWER(i.status) = 'active'
            ),
            0
          )::numeric(20, 2) AS active_principal
       FROM investments AS i
       INNER JOIN portfolios AS p
         ON p.id = i.portfolio_id
       WHERE p.user_id = $1`,
      [req.userId]
    )

    const breakdownResult = await pool.query(
      `SELECT
          ip.id AS plan_id,
          ip.name AS plan_name,
          ip.risk_level,
          COUNT(i.id)::int AS investment_count,
          COALESCE(
            SUM(i.principal_amount),
            0
          )::numeric(20, 2) AS total_invested,
          COALESCE(
            SUM(i.principal_amount) FILTER (
              WHERE LOWER(i.status) = 'active'
            ),
            0
          )::numeric(20, 2) AS active_principal
       FROM investments AS i
       INNER JOIN portfolios AS p
         ON p.id = i.portfolio_id
       INNER JOIN investment_plans AS ip
         ON ip.id = i.plan_id
       WHERE p.user_id = $1
       GROUP BY ip.id, ip.name, ip.risk_level
       ORDER BY SUM(i.principal_amount) DESC`,
      [req.userId]
    )

    const summary = summaryResult.rows[0]

    return res.status(200).json({
      success: true,
      investments: investmentsResult.rows,
      performance: {
        totalInvestments: summary.total_investments,
        activeInvestments: summary.active_investments,
        totalInvested: Number(summary.total_invested),
        activePrincipal: Number(summary.active_principal),
        estimatedReturns: null,
        projectedValue: null,
      },
      breakdown: breakdownResult.rows.map((item) => ({
        planId: item.plan_id,
        planName: item.plan_name,
        riskLevel: item.risk_level,
        investmentCount: item.investment_count,
        totalInvested: Number(item.total_invested),
        activePrincipal: Number(item.active_principal),
      })),
    })
  } catch (error) {
    console.error('Error retrieving investments:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve your investments.',
    })
  }
})

// POST /api/investments
// Deduct cash, create an investment, and record the transaction atomically.
router.post('/', authenticateToken, async (req, res) => {
  const { planId, amount } = req.body ?? {}
  const parsedPlanId = Number(planId)

  if (!Number.isSafeInteger(parsedPlanId) || parsedPlanId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please select a valid investment plan.',
    })
  }

  const amountText =
    typeof amount === 'string' || typeof amount === 'number'
      ? String(amount).trim()
      : ''

  const investmentAmount = Number(amountText)

  if (
    !/^\d+(\.\d{1,2})?$/.test(amountText) ||
    !Number.isFinite(investmentAmount) ||
    investmentAmount <= 0 ||
    investmentAmount > 100000000000
  ) {
    return res.status(400).json({
      success: false,
      message:
        'Enter a valid investment amount with no more than two decimal places.',
    })
  }

  let client
  let transactionStarted = false

  try {
    client = await pool.connect()

    await client.query('BEGIN')
    transactionStarted = true

    // Verify that the investment plan exists.
    const planResult = await client.query(
      `SELECT id, name
       FROM investment_plans
       WHERE id = $1`,
      [parsedPlanId]
    )

    if (planResult.rows.length === 0) {
      await client.query('ROLLBACK')
      transactionStarted = false

      return res.status(404).json({
        success: false,
        message: 'The selected investment plan was not found.',
      })
    }

    const plan = planResult.rows[0]

    // Lock the user's portfolio before checking or deducting cash.
    const portfolioResult = await client.query(
      `SELECT id, cash_balance
       FROM portfolios
       WHERE user_id = $1
       ORDER BY id
       LIMIT 1
       FOR UPDATE`,
      [req.userId]
    )

    if (portfolioResult.rows.length === 0) {
      await client.query('ROLLBACK')
      transactionStarted = false

      return res.status(404).json({
        success: false,
        message: 'No portfolio was found for your account.',
      })
    }

    const portfolio = portfolioResult.rows[0]

    if (Number(portfolio.cash_balance) < investmentAmount) {
      await client.query('ROLLBACK')
      transactionStarted = false

      return res.status(400).json({
        success: false,
        message: 'Insufficient cash balance for this investment.',
        availableBalance: Number(portfolio.cash_balance),
      })
    }

    // Update the portfolio cash balance.
    const balanceResult = await client.query(
      `UPDATE portfolios
       SET cash_balance = cash_balance - $1::numeric,
           updated_at = NOW()
       WHERE id = $2
       RETURNING cash_balance`,
      [amountText, portfolio.id]
    )

    // Create the investment record.
    const investmentResult = await client.query(
      `INSERT INTO investments (
          portfolio_id,
          plan_id,
          principal_amount,
          status
       )
       VALUES ($1, $2, $3::numeric, 'active')
       RETURNING
          id,
          portfolio_id,
          plan_id,
          principal_amount,
          status,
          invested_at,
          updated_at`,
      [portfolio.id, parsedPlanId, amountText]
    )

    // Record the investment in transaction history.
    const reference = `APEX-${randomUUID()}`

    await client.query(
      `INSERT INTO transactions (
          portfolio_id,
          reference,
          transaction_type,
          amount,
          status,
          description
       )
       VALUES ($1, $2, 'investment', $3::numeric, 'completed', $4)`,
      [
        portfolio.id,
        reference,
        amountText,
        `Investment in ${plan.name}`,
      ]
    )

    await client.query('COMMIT')
    transactionStarted = false

    return res.status(201).json({
      success: true,
      message: `Your investment in ${plan.name} was completed successfully.`,
      investment: {
        ...investmentResult.rows[0],
        plan_name: plan.name,
      },
      reference,
      cashBalance: Number(balanceResult.rows[0].cash_balance),
    })
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error(
          'Investment rollback failed:',
          rollbackError.message
        )
      }
    }

    console.error('Error processing investment:', error.message)

    return res.status(500).json({
      success: false,
      message:
        'Unable to process your investment. Please check your account before trying again.',
    })
  } finally {
    client?.release()
  }
})

export default router
