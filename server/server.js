
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

import authRoutes from './auth.js';
import portfolioRoutes from './portfolio.js';
import transactionRoutes from './transactions.js';
import investmentRoutes from './investments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/investments', investmentRoutes);

// Backend and database health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        return res.json({
            success: true,
            message: 'Apex Capital backend and database are connected!',
        });
    } catch (error) {
        console.error('Health check failed:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Database connection failed.',
        });
    }
});

// Investment plans
app.get('/api/plans', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, risk_level
             FROM investment_plans
             ORDER BY id`
        );

        return res.json({
            success: true,
            plans: result.rows,
        });
    } catch (error) {
        console.error(
            'Error retrieving investment plans:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve investment plans.',
        });
    }
});

// Handle unknown API routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found.',
    });
});

app.listen(PORT, () => {
    console.log(
        `Apex Capital backend running at http://localhost:${PORT}`
    );
});
