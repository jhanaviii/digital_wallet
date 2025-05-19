
# Digital Wallet System API Documentation

## Overview

This document provides detailed information about the Digital Wallet System API, including authentication, endpoints, request/response formats, and error handling.

## Base URL

All API requests should be made to:
`https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/`

## Authentication

Most endpoints require authentication using a JWT token. After login, include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

1. Register a user with the `/auth/register` endpoint
2. Login with the `/auth/login` endpoint to receive a JWT token
3. Include this token in subsequent requests

## API Endpoints Reference

### Authentication

#### Register User

Creates a new user account.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "username": "johndoe",
    "full_name": "John Doe"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Registration successful",
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "username": "johndoe"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "error": "Email already registered"
    }
    ```

#### User Login

Authenticates a user and returns a JWT token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Login successful",
      "session": {
        "access_token": "jwt-token-here",
        "token_type": "bearer",
        "expires_at": 1634567890,
        "refresh_token": "refresh-token-here"
      },
      "user": {
        "id": "user-uuid",
        "email": "user@example.com"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "error": "Invalid login credentials"
    }
    ```

#### User Logout

Invalidates the current user session.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Logout successful"
    }
    ```

#### Get Current User

Returns information about the currently authenticated user.

- **URL**: `/auth/user`
- **Method**: `GET`
- **Auth Required**: Yes
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "profile": {
          "username": "johndoe",
          "full_name": "John Doe"
        }
      }
    }
    ```
- **Error Response**:
  - **Code**: 401
  - **Content**:
    ```json
    {
      "error": "Unauthorized"
    }
    ```

### Wallet Operations

#### Get Wallet

Retrieves the user's wallet information.

- **URL**: `/wallet/get?currency=USD`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `currency` (optional): Currency code (default: USD)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "wallet": {
        "id": "wallet-uuid",
        "user_id": "user-uuid",
        "balance": 1000.00,
        "currency": "USD",
        "is_active": true,
        "created_at": "2023-01-01T12:00:00Z",
        "updated_at": "2023-01-01T12:00:00Z"
      }
    }
    ```

#### Deposit Funds

Adds funds to a wallet.

- **URL**: `/wallet/deposit`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "wallet_id": "wallet-uuid",
    "amount": 100.00,
    "description": "Salary deposit"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Deposit successful",
      "transaction_id": "transaction-uuid",
      "wallet": {
        "id": "wallet-uuid",
        "balance": 1100.00,
        "updated_at": "2023-01-01T12:05:00Z"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "error": "Deposit amount must be positive"
    }
    ```

#### Withdraw Funds

Withdraws funds from a wallet.

- **URL**: `/wallet/withdraw`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "wallet_id": "wallet-uuid",
    "amount": 50.00,
    "description": "ATM withdrawal"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Withdrawal successful",
      "transaction_id": "transaction-uuid",
      "wallet": {
        "id": "wallet-uuid",
        "balance": 1050.00,
        "updated_at": "2023-01-01T12:10:00Z"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**:
    ```json
    {
      "error": "Insufficient funds"
    }
    ```

#### Transfer Funds

Transfers funds from one user to another.

- **URL**: `/wallet/transfer`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "sender_wallet_id": "wallet-uuid",
    "recipient_username": "janedoe",
    "amount": 25.00,
    "description": "Payment for services"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Transfer successful",
      "transaction_id": "transaction-uuid",
      "wallet": {
        "id": "wallet-uuid",
        "balance": 1025.00,
        "updated_at": "2023-01-01T12:15:00Z"
      }
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**:
    ```json
    {
      "error": "Recipient not found. Please check the username and try again."
    }
    ```

#### Get Transactions

Retrieves transaction history for a wallet.

- **URL**: `/wallet/transactions?limit=10&offset=0`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `limit` (optional): Number of transactions to return (default: 10)
  - `offset` (optional): Pagination offset (default: 0)
  - `wallet_id` (optional): Specific wallet ID to filter by
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "transactions": [
        {
          "id": "transaction-uuid-1",
          "wallet_id": "wallet-uuid",
          "transaction_type": "deposit",
          "amount": 100.00,
          "description": "Salary deposit",
          "created_at": "2023-01-01T12:05:00Z",
          "is_flagged": false
        },
        {
          "id": "transaction-uuid-2",
          "wallet_id": "wallet-uuid",
          "transaction_type": "withdrawal",
          "amount": 50.00,
          "description": "ATM withdrawal",
          "created_at": "2023-01-01T12:10:00Z",
          "is_flagged": false
        }
      ]
    }
    ```

### Admin Operations

#### Get Flagged Transactions

Retrieves transactions flagged for potential fraud.

- **URL**: `/admin/flagged-transactions?limit=50&offset=0`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Query Parameters**:
  - `limit` (optional): Number of transactions to return (default: 50)
  - `offset` (optional): Pagination offset (default: 0)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "flagged_transactions": [
        {
          "id": "transaction-uuid",
          "user": {
            "username": "johndoe",
            "email": "user@example.com"
          },
          "transaction_type": "withdrawal",
          "amount": 2500.00,
          "description": "Large withdrawal",
          "created_at": "2023-01-01T14:30:00Z",
          "flag_reason": "Large withdrawal",
          "flag": {
            "id": "flag-uuid",
            "severity": "high",
            "is_resolved": false
          }
        }
      ]
    }
    ```

#### Get Total Balances

Retrieves aggregate wallet balances grouped by currency.

- **URL**: `/admin/total-balances`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "balances": [
        {
          "currency": "USD",
          "total_balance": 25000.00
        },
        {
          "currency": "EUR",
          "total_balance": 15000.00
        }
      ]
    }
    ```

#### Get Top Users

Retrieves users with highest balances or transaction volumes.

- **URL**: `/admin/top-users?metric=balance&limit=10`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Query Parameters**:
  - `metric`: Either "balance" or "volume" (default: balance)
  - `limit` (optional): Number of users to return (default: 10)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "top_users": [
        {
          "username": "johndoe",
          "metric_value": 5000.00
        },
        {
          "username": "janedoe",
          "metric_value": 3500.00
        }
      ]
    }
    ```

#### Get Transaction Volume

Retrieves transaction volume data for a specified period.

- **URL**: `/admin/transaction-volume?days=30`
- **Method**: `GET`
- **Auth Required**: Yes (Admin only)
- **Query Parameters**:
  - `days` (optional): Number of days to include (default: 30)
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "volume_data": [
        {
          "day": "2023-01-01",
          "total_amount": 12500.00,
          "transaction_count": 45
        },
        {
          "day": "2023-01-02",
          "total_amount": 9800.00,
          "transaction_count": 32
        }
      ]
    }
    ```

#### Resolve Fraud Flag

Marks a fraud flag as resolved.

- **URL**: `/admin/resolve-flag`
- **Method**: `POST`
- **Auth Required**: Yes (Admin only)
- **Request Body**:
  ```json
  {
    "flag_id": "flag-uuid",
    "resolution_note": "False positive, verified with customer"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "message": "Flag resolved successfully",
      "flag": {
        "id": "flag-uuid",
        "is_resolved": true,
        "resolved_at": "2023-01-02T09:30:00Z",
        "resolved_by": "admin-uuid"
      }
    }
    ```

### Report Operations

#### Get Transaction History

Retrieves transaction history with filtering options.

- **URL**: `/report/transaction-history?start_date=2023-01-01&end_date=2023-01-31`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `start_date`: Start date for the report (YYYY-MM-DD)
  - `end_date`: End date for the report (YYYY-MM-DD)
  - `transaction_type` (optional): Filter by transaction type
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "transactions": [
        {
          "id": "transaction-uuid",
          "date": "2023-01-15T10:30:00Z",
          "type": "deposit",
          "amount": 500.00,
          "description": "Monthly salary",
          "balance_after": 2000.00
        }
      ],
      "summary": {
        "total_deposits": 1500.00,
        "total_withdrawals": 500.00,
        "net_change": 1000.00
      }
    }
    ```

#### Get Wallet Summary

Retrieves wallet activity summary.

- **URL**: `/report/wallet-summary?wallet_id=wallet-uuid`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `wallet_id`: Wallet ID
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "wallet": {
        "id": "wallet-uuid",
        "currency": "USD",
        "current_balance": 2500.00,
        "last_updated": "2023-01-31T23:59:59Z"
      },
      "stats": {
        "total_transactions": 45,
        "total_deposits": 3500.00,
        "total_withdrawals": 1000.00,
        "total_transfers_in": 500.00,
        "total_transfers_out": 500.00
      }
    }
    ```

## Errors and Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Something went wrong on the server |

### Error Response Format

All errors follow this format:
```json
{
  "error": "Description of the error"
}
```

## Rate Limiting

- Standard users: 100 requests per minute
- Admin users: 1000 requests per minute

## Security Best Practices

1. Always use HTTPS for API requests
2. Store JWT tokens securely
3. Implement token refresh flows for long-running sessions
4. Log out when sessions are no longer needed
5. Validate input on the client side before sending requests

## Implementation Examples

### Example: Complete User Registration and Transfer

```javascript
// 1. Register a new user
const registerUser = async () => {
  const response = await fetch('https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'securepassword',
      username: 'johndoe',
      full_name: 'John Doe'
    })
  });
  return await response.json();
};

// 2. Login to get JWT token
const loginUser = async () => {
  const response = await fetch('https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'securepassword'
    })
  });
  return await response.json();
};

// 3. Get wallet information
const getWallet = async (token) => {
  const response = await fetch('https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/wallet/get', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// 4. Transfer funds to another user
const transferFunds = async (token, senderWalletId, recipientUsername, amount) => {
  const response = await fetch('https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/wallet/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sender_wallet_id: senderWalletId,
      recipient_username: recipientUsername,
      amount: amount,
      description: 'Payment for services'
    })
  });
  return await response.json();
};

// Example usage
async function main() {
  // Register user (only once)
  const registerResult = await registerUser();
  console.log('Register result:', registerResult);
  
  // Login
  const loginResult = await loginUser();
  console.log('Login result:', loginResult);
  const token = loginResult.session.access_token;
  
  // Get wallet info
  const walletInfo = await getWallet(token);
  console.log('Wallet info:', walletInfo);
  
  // Transfer funds
  const transferResult = await transferFunds(
    token,
    walletInfo.wallet.id,
    'anotheruser',
    25.00
  );
  console.log('Transfer result:', transferResult);
}

main().catch(console.error);
```

## Additional Resources

- Live API Documentation: `https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/docs`
- Postman Collection: Available in the `docs` directory
- GitHub Repository: [Digital Wallet System](https://github.com/yourusername/digital-wallet-system)

## Support

For any questions or issues regarding the API, please open an issue on the GitHub repository.
