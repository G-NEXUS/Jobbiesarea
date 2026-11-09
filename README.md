# Jobbiesarea

JOBBIESAREA is a web-based learning resource that helps students explore course materials from one place. The site presents a subject directory and links to dedicated subject and unit pages, making it easy to find and review relevant topics.

## Subjects

The current subject collection includes:

- Biology
- Chemistry
- Computer Science
- Communication Skills
- Engineering Drawing
- Mathematics
- Physics

## MongoDB-backed authentication

The existing registration and login forms now use a small Express API backed by MongoDB. The HTML, CSS, page layout, and visible authentication flow remain unchanged.

### Configure the connection

1. Install Node.js 18 or newer.
2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Set `MONGODB_URI` in `.env` to your MongoDB Atlas or self-hosted MongoDB connection string. You can optionally change `MONGODB_DB` and `PORT`.
4. Install dependencies and start the site:

   ```bash
   npm install
   npm start
   ```

5. Open `http://localhost:3000`.

The server creates a unique index on `users.email`, hashes passwords with bcrypt before storage, and never returns password hashes to the browser. A connectivity check is available at `GET /api/health`.

Never commit `.env`; it is excluded by `.gitignore`.
