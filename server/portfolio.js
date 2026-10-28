
import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { pool } from './db.js';

const router = express.Router();

// Verify the user's login token.
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Please sign in to access your portfolio.',
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = decoded.userId ?? decoded.id ?? decoded.sub;

        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token.',
            });
        }

        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: 'Your session is invalid or has expired. Please sign in again.',
        });
    }
}

// Get the signed-in user's portfolios.
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, portfolio_name, cash_balance,
                    created_at, updated_at
             FROM portfolios
             WHERE user_id = $1
             ORDER BY id`,
            [req.userId]
        );

        return res.json({
            success: true,
            portfolios: result.rows,
        });
    } catch (error) {
        console.error('Portfolio retrieval failed:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve your portfolio.',
        });
    }
});

// Validate an amount supplied by the client.
function validateAmount(value) {
    if (
        value === undefined ||
        value === null ||
        (typeof value !== 'number' && typeof value !== 'string') ||
        String(value).trim() === ''
    ) {
        return null;
    }

    const amountString = String(value).trim();
    const amount = Number(amountString);

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > 100000000000 ||
        !/^\d+(\.\d{1,2})?$/.test(amountString)
    ) {
        return null;
    }

    return amount.toFixed(2);
}

// Shared handler for simulated deposits and withdrawals.
async function processTransaction(req, res, transactionType) {
    const amount = validateAmount(req.body?.amount);

    if (amount === null) {
        return res.status(400).json({
            success: false,
            message: 'Enter a valid positive amount with no more than two decimal places.',
        });
    }

    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query('BEGIN');
        transactionStarted = true;

        // Lock the portfolio to prevent concurrent balance changes.
        const portfolioResult = await client.query(
            `SELECT id, portfolio_name, cash_balance
             FROM portfolios
             WHERE user_id = $1
             ORDER BY id
             LIMIT 1
             FOR UPDATE`,
            [req.userId]
        );

        if (portfolioResult.rows.length === 0) {
            await client.query('ROLLBACK');
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: 'No portfolio was found for your account.',
            });
        }

        const portfolio = portfolioResult.rows[0];

        // Prevent withdrawals that exceed the available balance.
        if (transactionType === 'withdrawal') {
            const balanceResult = await client.query(
                `SELECT cash_balance >= $1::numeric AS sufficient
                 FROM portfolios
                 WHERE id = $2`,
                [amount, portfolio.id]
            );

            if (!balanceResult.rows[0].sufficient) {
                await client.query('ROLLBACK');
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: 'Insufficient available balance for this withdrawal.',
                });
            }
        }

        const balanceChange =
            transactionType === 'deposit' ? '+' : '-';

        // Update the balance inside the database transaction.
        const updatedPortfolio = await client.query(
            `UPDATE portfolios
             SET cash_balance = cash_balance ${balanceChange} $1::numeric,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING id, portfolio_name, cash_balance, updated_at`,
            [amount, portfolio.id]
        );

        // Generate a unique transaction reference.
        const reference = `APEX-${randomUUID()}`;

        // Save the matching transaction record.
        const transactionResult = await client.query(
            `INSERT INTO transactions
                (portfolio_id, reference, transaction_type,
                 amount, status, description)
             VALUES ($1, $2, $3, $4, 'completed', $5)
             RETURNING id, reference, transaction_type,
                       amount, status, description, created_at`,
            [
                portfolio.id,
                reference,
                transactionType,
                amount,
                transactionType === 'deposit'
                    ? 'Simulated account deposit'
                    : 'Simulated account withdrawal',
            ]
        );

        await client.query('COMMIT');
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: transactionType === 'deposit'
                ? 'Simulated deposit completed successfully.'
                : 'Simulated withdrawal completed successfully.',
            portfolio: updatedPortfolio.rows[0],
            transaction: transactionResult.rows[0],
        });
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error(
                    'Transaction rollback failed:',
                    rollbackError.message
                );
            }
        }

        console.error(
            `${transactionType} failed:`,
            error.message
        );

        return res.status(500).json({
            success: false,
            message: `Unable to process the ${transactionType}. No changes were committed.`,
        });
    } finally {
        client.release();
    }
}

// POST /api/portfolio/deposit
router.post('/deposit', authenticateToken, (req, res) => {
    return processTransaction(req, res, 'deposit');
});

// POST /api/portfolio/withdraw
router.post('/withdraw', authenticateToken, (req, res) => {
    return processTransaction(req, res, 'withdrawal');
});

export default router;
