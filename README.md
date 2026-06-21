# 🎓 College Student Management System

> A full-stack MERN application for managing student records, academic marks, fee collection, and certificate generation through a role-based campus dashboard.

![React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite%206-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/API-Express%205-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47a248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-d63aff?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

## Overview

This project simulates a modern college administration platform where admins and teachers can work from a single dashboard to manage the student lifecycle.

It combines secure authentication, academic operations, payment tracking, and document generation into one clean workflow-driven system. The goal was to build a practical product, not just isolated CRUD screens.

## Why This Project Stands Out

- Built as a complete full-stack system with separate frontend and backend applications.
- Implements role-based access for `ADMIN` and `TEACHER` users.
- Uses JWT authentication with protected routes and persistent sessions.
- Tracks real operational data: student records, marks, fees, and generated documents.
- Includes a dashboard powered by MongoDB aggregation for live summaries and activity insights.
- Shows product thinking through connected modules instead of disconnected demo pages.

## Core Features

### Authentication and Access Control
- User registration and login
- JWT-based authentication
- Protected application routes
- Role-aware UI and backend authorization

### Student Management
- Create, update, view, and delete student profiles
- Store core academic identity details such as roll number, department, year, contact information, and address
- Search and browse student records from a centralized dashboard

### Academic Marks Module
- Record subject-wise marks for students
- Organize marks by semester
- Review academic performance data by department

### Fees and Payment Tracking
- Maintain fee profiles per student
- Track paid amount, due amount, and payment history
- Surface total collected and pending fees in dashboard summaries

### Document Hub
- Generate student documents from stored academic data
- Supports:
  - Bonafide Certificate
  - Transfer Certificate
  - Marksheet / Academic Performance Sheet
- View generated documents from a dedicated document panel

### Analytics Dashboard
- Total students count
- Total fees collected
- Total pending fees
- Department-wise academic averages
- Recent system activity feed
- Identification of students with pending mark entries

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, React Hot Toast |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | JWT, bcryptjs |
| Development Tools | Nodemon, ESLint |

## System Architecture

```text
React Frontend
  -> Axios API client
  -> Express REST API
  -> Controllers and middleware
  -> Mongoose models
  -> MongoDB database
```

## Folder Structure

```text
college-student-management-system-main/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## What I Built Here

This project demonstrates my ability to:

- Design a multi-module application with practical business flows
- Build secure authentication and authorization layers
- Structure a REST API with controllers, middleware, and models
- Connect a React client to a backend service cleanly
- Use MongoDB aggregation for dashboard-style reporting
- Deliver a product that feels closer to a real admin system than a tutorial app

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd college-student-management-system-main
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create backend environment variables

Create a `.env` file inside `backend/` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### 4. Start the backend server

```bash
cd backend
npm run dev
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

### 6. Start the frontend app

```bash
cd frontend
npm run dev
```

The frontend is configured to call the backend at:

```text
http://localhost:5000/api
```

## Main API Areas

- `/api/auth` - registration, login, current user profile
- `/api/students` - student management
- `/api/marks` - marks entry and academic performance records
- `/api/fees` - fee profiles and payment tracking
- `/api/documents` - document generation and retrieval
- `/api/dashboard` - dashboard metrics and recent activity

## Product Vision

The idea behind this project is simple: college administration involves multiple disconnected tasks, and those tasks become much more useful when they are unified into one system.

Instead of building only a login page or only a CRUD table, this project connects identity, academic performance, finance, and documentation into one operational workflow.

## Recruiter Snapshot

If you are reviewing this project as part of my portfolio, the strongest signals are:

- Full-stack development across frontend, backend, and database layers
- Real-world admin dashboard structure
- Secure auth flow with route protection
- Role-based product thinking
- Data modeling with Mongoose
- Reporting and aggregation logic beyond basic CRUD

## Future Improvements

- PDF export for generated certificates
- Search, sort, and filter enhancements across modules
- Unit and integration tests
- Dockerized local setup
- Deployment pipeline for cloud hosting
- Audit logs and downloadable reports

## Author

Built by a developer focused on practical full-stack applications, clean architecture, and portfolio projects with real product value.
