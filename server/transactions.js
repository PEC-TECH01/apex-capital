
import express from 'express';
import jwt from 'jsonwebtoken';
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
            message: 'Please sign in to view your transactions.',
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

// GET /api/transactions
// Return transactions belonging only to the signed-in user.
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                t.id,
                t.reference,
                t.transaction_type,
                t.amount,
                t.status,
                t.description,
                t.created_at,
                p.portfolio_name
             FROM transactions AS t
             INNER JOIN portfolios AS p
                ON p.id = t.portfolio_id
             WHERE p.user_id = $1
             ORDER BY t.created_at DESC, t.id DESC
             LIMIT 100`,
            [req.userId]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            transactions: result.rows,
        });
    } catch (error) {
        console.error(
            'Transaction retrieval failed:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve your transactions.',
        });
    }
});

export default router;
