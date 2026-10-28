# Apex Capital — Investment Management Platform

Apex Capital is a modern digital investment management platform designed to simplify portfolio management through an intuitive interface, secure user authentication, investment plan management, and seamless transaction tracking. Built with modern web technologies, the platform combines elegant design with practical full-stack functionality to deliver a streamlined financial management experience.

## Features

- **User Authentication:** Registration and login with password hashing and JWT-based authentication.
- **Portfolio Dashboard:** View portfolio balances and account information.
- **Investment Plans:** Explore investment options with different risk levels.
- **Investment Management:** Create investments and track investment records.
- **Deposits and Withdrawals:** Simulate portfolio funding and withdrawals.
- **Transaction History:** View and filter account transactions.
- **Persistent Data:** Store users, portfolios, investments, plans, and transactions in PostgreSQL.
- **Responsive Interface:** A dashboard designed for a modern financial platform.

## Technology Stack

**Frontend**
- React
- Vite
- CSS
- Lucide React

**Backend**
- Node.js
- Express.js
- REST API

**Database and Security**
- PostgreSQL
- `pg` (node-postgres)
- bcryptjs
- JSON Web Tokens (JWT)
- dotenv

## Project Structure

```text
Apex Capital/
├── public/
├── src/
│   ├── App.jsx
│   ├── Dashboard.jsx
│   ├── Dashboard.css
│   └── ...
├── server/
│   ├── server.js
│   ├── db.js
│   ├── auth.js
│   ├── portfolio.js
│   ├── investments.js
│   └── transactions.js
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/apex-capital.git
cd apex-capital
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/apex_capital
DATABASE_SSL=false
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
```

Replace the example database password and JWT secret with your own local values. Never commit your real `.env` file.

### 4. Set up the database

Create a PostgreSQL database named `apex_capital`, then create the required tables and seed the investment plans. The database schema must match the application's backend queries.

### 5. Start the backend

```bash
node server/server.js
```

The backend should be available at:

`http://localhost:5000`

### 6. Start the frontend

Open a second terminal in the project directory and run:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
```

The `server` script can also be used if configured in `package.json`.

## Security Notes

- Environment files and credentials must remain private.
- Passwords are hashed before storage.
- Protected API routes use JWT authentication.
- This project is a demonstration application and is not a licensed brokerage or a live-money investment service.

## Future Improvements

- Automated testing
- Investment performance analytics
- Email verification and password recovery
- Enhanced audit logging
- Production deployment and monitoring

## Author

**Promise Ezeibe**

GitHub: GitHub: https://github.com/PEC-TECH01

Portfolio: https://PEC-TECH01.github.io/

---

Built to bring clarity, confidence, and simplicity to digital investment management
