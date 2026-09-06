# EBANX Take-Home Banking API

This project is a small banking API built as a take-home technical assessment for EBANX.

The application models a minimal banking system where accounts can receive deposits, make withdraws, transfer funds, and expose their current balance through HTTP endpoints.

## Tech Stack

- TypeScript
- Node.js
- NestJS
- TypeORM
- SQLite with `better-sqlite3`
- Vitest
- Swagger/OpenAPI

## Supported Operations

The API handles these financial operations:

- `deposit`: credits an amount to a destination account. If the destination account does not exist, it is created.
- `withdraw`: debits an amount from an existing origin account.
- `transfer`: moves an amount from an existing origin account to a destination account. If the destination account does not exist, it is created.
- `balance`: returns the current balance for an account.
- `reset`: clears the application state, returning it to the initial empty state.

Main routes:

```txt
GET  /balance?account_id=<account-id>
POST /event
POST /reset
GET  /docs
```

## Code Practices

Some practices adopted in this project:

- Domain code is organized by NestJS modules.
- Controllers are responsible for HTTP concerns.
- Services hold business rules.
- Repositories wrap persistence access.
- Financial mutations run inside database transactions.
- Debit operations use atomic conditional updates to prevent negative balances.
- Transaction records are created only after successful balance changes.
- Request validation is centralized with NestJS `ValidationPipe`.
- API documentation is exposed through Swagger at `/docs`.
- Automated tests focus on real application flows and persisted state instead of mock-only assertions.

## Requirements

- Node.js
- Yarn

## Running The Project

Clone the repository:

```bash
git clone git@github.com:gabrielDeio/tec-challenge.git
```

Enter the project directory:

```bash
cd tec-challenge
```

Install dependencies:

```bash
yarn install
```

Start the application in development mode:

```bash
yarn start:dev
```

By default, the API runs at:

```txt
http://localhost:3000
```

Swagger documentation is available at:

```txt
http://localhost:3000/docs
```

The default SQLite database file is:

```txt
db.sqlite
```

To use another database file, set `DATABASE_PATH` before starting the app:

```bash
DATABASE_PATH=/tmp/tec-challenge.sqlite yarn start:dev
```

## Available Scripts

Build the project:

```bash
yarn build
```

Run lint:

```bash
yarn lint
```

Format source files:

```bash
yarn format
```

Run tests:

```bash
yarn test
```

Run tests in watch mode:

```bash
yarn test:watch
```

Run tests with coverage:

```bash
yarn test:cov
```

## SQLite Disclaimer

SQLite was chosen intentionally for simplicity in a take-home assessment. It keeps the project easy to run locally with minimal setup while still allowing the application to use an ORM, model relationships, and execute atomic database transactions.

Using TypeORM also keeps the persistence layer less tied to SQLite specifically. If the application needed to evolve toward a more robust database in the future, such as PostgreSQL or MySQL, the existing entity and repository structure would make that migration more straightforward.
