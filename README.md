# My-Chat-Brain AI

An AI Chatbot with persistent memory, authentication, and user settings.

## Features

- User authentication (register, login, logout)
- User profile management
- Password change functionality
- Settings management
- SQLite database for data persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gemini-clone-extended-ts.git
cd gemini-clone-extended-ts
```

2. Install dependencies:
```bash
npm install
```

3. Generate database migrations:
```bash
npm run migrate
```

4. Seed the database with an initial admin user:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin Credentials

- Username: admin
- Password: admin123

## Database

This project uses SQLite with Drizzle ORM for data persistence. The database file is stored in the `data` directory.

### Database Schema

- `users`: Stores user information
- `settings`: Stores user settings

### Migrations

To generate migrations:
```bash
npm run migrate
```

To view the database in the Drizzle Studio:
```bash
npm run studio
```

## API Routes

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `POST /api/auth/logout`: Logout a user
- `GET /api/auth/me`: Get current user information
- `POST /api/auth/change-password`: Change user password

### Settings

- `GET /api/getenv`: Get user settings
- `POST /api/setenv`: Update user settings

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
JWT_SECRET=your-secret-key
```

## License

This project is licensed under the MIT License.## 🚨 Tutorial

This repository contains the corresponding tutorial available on our YouTube channel, <a href="https://www.youtube.com/@CodeScrapperOfficial/videos" target="_blank"><b>Code Scrapper</b></a>.

## <a name="introduction">🤖 Introduction</a>

Our Gemini AI clone is a streamlined project management tool designed to enhance productivity and team collaboration. It offers intuitive AI response interfaces for task management, customizable boards for project tracking, and seamless integration capabilities to adapt to various workflows. Ideal for individuals and teams looking for an efficient way to organize tasks and projects.

## <a name="tech-stack">Tech Stack</a>

- Next.js
- Primsa
- Shadcn
- Tailwind Css
- Gemini Ai

## <a name="quick-start">Integration and Installation Process</a>

Follow these steps to set up the project locally on your device.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)

**Clone this Project**

```bash
git clone https://github.com/CodeScrapper1/gemini-clone-nextjs.git
cd gemini-clone-nextjs
```

**Installation**

Install dependencies using yarn:

```bash

next run build
```

**Running the Project using yarn**

```bash
next run dev
```
