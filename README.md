# Warehouse Management System (WMS) - Server

A comprehensive Node.js/Express backend server for managing warehouse operations including inventory tracking, picklists, putaway, quality control, audits, and more.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security Features](#security-features)
- [Logging](#logging)
- [Author](#author)

## ✨ Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **Inventory Management**: Complete material and inventory tracking system
- **Warehouse Operations**:
  - Inward processing
  - Putaway operations
  - Quality Control (QC)
  - Picklist management
  - FIFO violation tracking
  - Audit operations
- **Location Management**: Sites, Zones, Racks, and Shelves
- **Customer Management**: Customer data and relationship tracking
- **Barcode Integration**: Barcode scanning support for picklist items and audits
- **Audit Trail**: Comprehensive audit logging for all operations
- **Transaction Management**: Database transaction handling per request
- **Rate Limiting**: API and login rate limiting for security
- **Error Handling**: Centralized error handling middleware
- **Logging**: Winston-based logging with separate log files

## 🛠 Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.1.0
- **Database**: MySQL (via Sequelize ORM)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: Argon2
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Process Manager**: PM2 (via ecosystem.config.cjs)
- **Code Quality**: ESLint, Prettier, Husky

## 📦 Prerequisites

- Node.js (v18 or higher recommended)
- MySQL database server
- npm or yarn package manager

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create `.env.development` for development
   - Create `.env.testing` for testing
   - Create `.env.production` for production
   - See [Environment Variables](#environment-variables) section for required variables

4. **Set up the database**
   - Create a MySQL database
   - Update database credentials in your `.env` file
   - The application will automatically sync database models on startup

## 🔐 Environment Variables

Create environment files (`.env.development`, `.env.testing`, or `.env.production`) with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
HTTPS=false

# SSL Configuration (if HTTPS=true)
SSL_KEY_PATH=/path/to/key.pem
SSL_CERT_PATH=/path/to/cert.pem
SSL_CA_PATH=/path/to/ca.pem  # Optional

# Database Configuration
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
DB_HOST=localhost
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key
JWT_EXPIRES_IN=3600

# JWT Refresh Token Configuration
JWT_REFRESH_SECRET_KEY=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=86400
```

## 🏃 Running the Project

### Development Mode

```bash
npm run dev
```

This will start the server with nodemon for auto-reloading on file changes.

### Production Mode

```bash
npm start
```

### Using PM2 (Recommended for Production)

```bash
# Development
pm2 start ecosystem.config.cjs --only server-dev

# Testing
pm2 start ecosystem.config.cjs --only server-test

# Production
pm2 start ecosystem.config.cjs --only server-prod
```

The server will be available at `http://localhost:3000` (or the port specified in your environment variables).

## 📁 Project Structure

```
server/
├── apis/                    # HTTP test files for API endpoints
├── logs/                    # Application logs (app.log, auth.log, error.log)
├── node_modules/           # Dependencies
├── src/
│   ├── app/
│   │   ├── configs/        # Configuration files (db, env, logger, seedAdmin)
│   │   ├── database/       # Database setup (configs, hooks, index, models)
│   │   ├── helpers/        # Helper utilities
│   │   └── middlewares/    # Custom middleware (auth, audit, error, etc.)
│   ├── auth/               # Authentication routes and controllers
│   ├── controllers/        # Business logic controllers
│   ├── models/             # Sequelize database models
│   ├── routes/             # API route definitions
│   ├── utils/              # Utility functions
│   ├── app.js              # Express app configuration
│   ├── index.js            # Model exports
│   └── server.js           # Server entry point
├── ecosystem.config.cjs    # PM2 configuration
├── eslint.config.js       # ESLint configuration
├── package.json           # Project dependencies and scripts
└── README.md              # This file
```

## 🌐 API Endpoints

The API includes the following main modules:

- **Authentication**: `/sign_in` (public)
- **Audit**: Audit operations and item tracking
- **Customer**: Customer management
- **Inward**: Incoming inventory processing
- **Material**: Material/product management
- **Picklist**: Order picking operations
- **PicklistItem**: Individual picklist items
- **PicklistItemBarcode**: Barcode scanning for picklist items
- **PicklistPicker**: Picker assignment
- **Putaway**: Stock putaway operations
- **QC**: Quality control operations
- **Rack**: Rack management
- **ReturnBarcode**: Return barcode processing
- **Role**: User role management
- **RoleAccess**: Role-based access control
- **Shelf**: Shelf management
- **Site**: Site/warehouse management
- **UOM**: Unit of measurement management
- **User**: User management
- **Zone**: Zone management
- **FifoViolation**: FIFO violation tracking

All endpoints (except `/sign_in`) require authentication via JWT token.

## 🗄 Database Models

The application includes the following Sequelize models:

- `Access` - Access permissions
- `Role` - User roles
- `RoleAccess` - Role-permission mappings
- `Site` - Warehouse sites
- `User` - System users
- `Zone` - Warehouse zones
- `Rack` - Storage racks
- `Shelf` - Storage shelves
- `Uom` - Units of measurement
- `Material` - Products/materials
- `Customer` - Customers
- `Inward` - Incoming inventory
- `QC` - Quality control records
- `Putaway` - Putaway operations
- `Picklist` - Picking lists
- `PicklistItem` - Picklist line items
- `PicklistItemBarcode` - Barcode associations
- `PicklistPicker` - Picker assignments
- `FifoViolation` - FIFO violations
- `ReturnBarcode` - Return barcodes
- `Audit` - Audit operations
- `AuditItem` - Audit line items
- `AuditItemBarcode` - Audit barcode associations

Models are automatically loaded and relationships are established on server startup.

## 📜 Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint and auto-fix issues
- `npm run format` - Format code using Prettier
- `npm run format:check` - Check code formatting without making changes

## 🚢 Deployment

### Using PM2

The project includes PM2 configuration for different environments:

1. **Development**: Single instance with file watching
2. **Testing**: Single instance with file watching
3. **Production**: Cluster mode for load balancing

```bash
# Start production server
pm2 start ecosystem.config.cjs --only server-prod

# Monitor
pm2 monit

# View logs
pm2 logs server-prod

# Stop
pm2 stop server-prod
```

### SSL/HTTPS Support

To enable HTTPS:

1. Set `HTTPS=true` in your environment file
2. Provide paths to SSL certificate files:
   - `SSL_KEY_PATH`
   - `SSL_CERT_PATH`
   - `SSL_CA_PATH` (optional)

## 🔒 Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable Cross-Origin Resource Sharing
- **Rate Limiting**:
  - API rate limiting for general endpoints
  - Stricter rate limiting for login endpoints
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Argon2 for secure password storage
- **Input Validation**: Request validation middleware
- **SQL Injection Protection**: Sequelize ORM with parameterized queries
- **Audit Logging**: Comprehensive audit trail for all operations

## 📝 Logging

The application uses Winston for logging with separate log files:

- `logs/app.log` - General application logs
- `logs/auth.log` - Authentication-related logs
- `logs/error.log` - Error logs

Logs are automatically rotated and include timestamps, log levels, and contextual information.

## 👤 Author

**Omnath Shinde**

---

## 📄 License

ISC

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue in the repository or contact the author.
