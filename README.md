
# Digital Wallet System with Cash Management and Fraud Detection

A comprehensive digital wallet backend system with advanced features including transaction processing, cash management, and fraud detection.(for assignment)

## 🚀 Features

- **User Authentication & Session Management**
  - Secure registration and login with JWT tokens
  - Email/password authentication with secure password hashing
  - Protected API endpoints with authentication middleware

- **Wallet Operations**
  - Deposit and withdraw virtual cash
  - Transfer funds between users
  - Complete transaction history
  - Multi-currency support

- **Transaction Processing & Validation**
  - Atomic transactions with database functions
  - Validations to prevent overdrafts, negative deposits, and invalid transfers
  - Transaction history tracking

- **Fraud Detection Logic**
  - Detection of suspicious patterns (multiple transfers in short period)
  - Flagging of large deposits and withdrawals
  - Monitoring of quick deposit-withdrawal patterns
  - Daily automated fraud scanning

- **Admin & Reporting APIs**
  - View flagged transactions
  - Aggregate total balances by currency
  - Identify top users by balance or transaction volume
  - Generate transaction volume reports

- **Bonus Implementations**
  - Scheduled daily fraud scan job
  - Soft delete for transactions
  - Comprehensive API documentation with Swagger UI

## 🛠️ Technology Stack

- **Backend**: [Supabase Edge Functions](https://supabase.com/edge-functions) (Serverless Deno runtime)
- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth (JWT tokens)
- **API Documentation**: Swagger UI
- **Security**: Row Level Security (RLS) policies, JWT verification

## 🏗️ Architecture

The application follows a RESTful API architecture with the following components:

1. **Authentication Layer**: Handles user registration, login, and session management
2. **Transaction Layer**: Processes all wallet operations with atomicity guarantees
3. **Fraud Detection System**: Monitors transactions for suspicious patterns
4. **Admin Interface**: Provides reporting and management capabilities
5. **Scheduled Jobs**: Runs periodic tasks for maintenance and reporting

## 📋 API Documentation

Complete API documentation is available at the `/docs` endpoint:
`https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/docs`

## 🔧 Setup Instructions

### Prerequisites

- Supabase account
- Git

### Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/digital-wallet-system.git
cd digital-wallet-system
```

2. Set up your Supabase project:
   - Create a new project on [Supabase](https://supabase.com)
   - Run the SQL setup scripts in the `supabase/sql` directory
   - Deploy the Edge Functions

3. Configure environment variables:
   - Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your Supabase project

### Usage

The API can be accessed through the Supabase Edge Functions, with the base URL:
`https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/`

## 📱 API Endpoints

### Authentication Endpoints

- **Register**: `POST /auth/register`
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "username": "username",
    "full_name": "User Name"
  }
  ```

- **Login**: `POST /auth/login`
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- **Logout**: `POST /auth/logout`

- **Get User**: `GET /auth/user`

### Wallet Operations

- **Get Wallet**: `GET /wallet/get?currency=USD`

- **Deposit**: `POST /wallet/deposit`
  ```json
  {
    "wallet_id": "uuid-here",
    "amount": 100.00,
    "description": "Salary deposit"
  }
  ```

- **Withdraw**: `POST /wallet/withdraw`
  ```json
  {
    "wallet_id": "uuid-here",
    "amount": 50.00,
    "description": "ATM withdrawal"
  }
  ```

- **Transfer**: `POST /wallet/transfer`
  ```json
  {
    "sender_wallet_id": "uuid-here",
    "recipient_username": "recipient_username",
    "amount": 25.00,
    "description": "Payment for services"
  }
  ```

- **Transactions**: `GET /wallet/transactions?limit=10&offset=0`

### Admin Endpoints

- **Flagged Transactions**: `GET /admin/flagged-transactions`
- **Total Balances**: `GET /admin/total-balances`
- **Top Users**: `GET /admin/top-users?limit=10`
- **Transaction Volume**: `GET /admin/transaction-volume?days=30`

## 🧪 Testing

A Postman collection is available in the `docs` directory for testing all API endpoints.

## ⚙️ Database Schema

The system uses the following database tables:

- `profiles`: User profile information
- `wallets`: User wallets with balance and currency
- `transactions`: Record of all financial transactions
- `fraud_flags`: Detected suspicious activities

## 🔒 Security Features

1. **Row Level Security (RLS)**
   - Users can only access their own data
   - Admins have special access policies

2. **JWT Authentication**
   - All endpoints (except public ones) require valid JWT tokens

3. **Atomic Transactions**
   - Database functions ensure data integrity

4. **Input Validation**
   - All API inputs are validated before processing

## 📊 Bonus Features

### Scheduled Jobs

A daily fraud scan runs automatically at 1:00 AM UTC to detect suspicious patterns across all transactions from the previous day.

### Soft Delete

Transactions are never physically deleted from the database. Instead, they are marked with the `is_deleted` flag, maintaining a complete audit trail.

## 📚 Additional Documentation

For more detailed documentation, please refer to the `docs` directory in this repository.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Please review the demo video uploaded as demo.mov
