# Inkless Game

[Play Now](https://aiven-labs.github.io/inkless-game/)

This guide explains how to deploy both the game frontend and score server for the Inkless Space Invaders game using Aiven.

## Project Structure

```
inkless-game/
├── Dockerfile                 # Score server dockerfile for Aiven
├── docs/                      # Built game files
│   ├── index.html
│   └── game.js
├── score_server/              # Python FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── src/                       # TypeScript game source
└── package.json
```

## Game Frontend Deployment

The game frontend is a static web application built with TypeScript and Phaser.

### Prerequisites

- Node.js 18+
- npm

### Build Process

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the game:
   ```bash
   npm run build
   ```

3. The built files will be in the `docs/` directory

### Aiven Static Site Deployment

1. **Create Application**:
   - Source URL: Your GitHub repository URL
   - Branch: `main`
   - Application name: `inkless-game-frontend`

2. **Configure Port**:
   - Name: `http`
   - Port: `80`
   - Protocol: `HTTP`

3. **Deploy**: The Dockerfile will automatically serve the static files from the `docs/` directory

### Configuration

Update the score server URL in your game configuration file to point to your deployed Aiven score server.

## Score Server Deployment

The score server is a Python FastAPI application that handles high scores and leaderboards.

### Prerequisites

- PostgreSQL database

### Environment Variables

The score server requires these environment variables:

#### Required (Secrets)
- `DATABASE_URL`: PostgreSQL connection string
  ```
  postgresql://username:password@host:5432/database_name
  ```
- `ADMIN_KEY`: Secret key for admin endpoints

#### Optional (Variables)
- `CORS_ORIGINS`: Allowed domains for CORS (default: `*`)
- `LOG_LEVEL`: Logging level (default: `INFO`)
- `PORT`: Server port (default: `8000`)

### Aiven Deployment

1. **Create Application**:
   - Source URL: Your GitHub repository URL
   - Branch: `main`
   - Application name: `inkless-game-score-server`

2. **Configure Port**:
   - Name: `http`
   - Port: `8000`
   - Protocol: `HTTP`

3. **Add Environment Variables**:
   
   **Secrets**:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `ADMIN_KEY`: Your secret admin key
   
   **Variables**:
   - `CORS_ORIGINS`: Your game domain or `*` for testing
   - `LOG_LEVEL`: `INFO`

4. **Deploy**: Click deploy and wait for build completion

### Local Development

1. **Install dependencies**:
   ```bash
   cd score_server
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
   export ADMIN_KEY="local_test_key"
   export CORS_ORIGINS="*"
   ```

3. **Run server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. **Access**:
   - API: `http://localhost:8000`
   - Documentation: `http://localhost:8000/docs`

## API Endpoints

### Public Endpoints
- `GET /` - Health check
- `POST /api/scores` - Submit game score
- `GET /api/leaderboard` - Get public leaderboard
- `GET /claim/{session_id}` - Score claim page
- `POST /api/claim/{session_id}` - Claim score with email

### Admin Endpoints

#### GET /api/admin/emails

**Purpose**: Get all collected emails from players who claimed scores

**Authentication**: Requires `admin_key` parameter

**Usage**:
```
GET https://your-score-server.aiven.app/api/admin/emails?admin_key=YOUR_ADMIN_KEY
```

**Example with curl**:
```bash
curl "https://your-score-server.aiven.app/api/admin/emails?admin_key=your_secret_admin_key"
```

**Example with browser**:
```
https://your-score-server.aiven.app/api/admin/emails?admin_key=your_secret_admin_key
```

**Response Format**:
```json
{
  "total_emails": 25,
  "emails": [
    {
      "email": "player@example.com",
      "nickname": "TopPlayer",
      "total_savings": 15000,
      "final_bill": 2000,
      "claimed_at": "2024-01-15T10:30:00",
      "game_played": "2024-01-15T10:25:00"
    }
  ]
}
```

**Security Notes**:
- Never share your admin key publicly
- Use HTTPS only for admin requests
- The admin key is set in your Aiven environment variables
- 403 error means wrong/missing admin key

## Configuration

### Game Configuration

Update your game's score server URL to point to the deployed Aiven backend:

```javascript
const SCORE_SERVER_URL = 'https://your-score-server.aiven.app';
```

### CORS Configuration

For production, set `CORS_ORIGINS` to your game's domain in Aiven environment variables:

```
CORS_ORIGINS=https://yourgame.aiven.app,https://www.yourgame.com
```

For testing, you can use:
```
CORS_ORIGINS=*
```

## Monitoring

### Health Checks

Both services include health check endpoints:
- Game: Any static file request
- Score Server: `GET /` returns status

### Logs

Check application logs in your hosting service dashboard for debugging.

### Database Monitoring

Monitor your PostgreSQL database for:
- Connection count
- Query performance
- Storage usage

## Security

### Environment Variables
- Never commit secrets to version control
- Use your hosting service's secret management
- Rotate admin keys regularly

### CORS
- Set specific domains in production
- Avoid using `*` for CORS_ORIGINS in production

### Database
- Use SSL connections for database
- Regular backups
- Monitor for unusual activity

## Troubleshooting

### Common Issues

1. **CORS errors**: Check `CORS_ORIGINS` configuration
2. **Database connection**: Verify `DATABASE_URL` format
3. **Build failures**: Check Docker logs
4. **Health check failures**: Ensure port 8000 is exposed

### Debug Steps

1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Validate Docker image builds locally

## This project is a fork of Space Invaders built with Phaser 3 and TypeScript

### Author: Trung Vo ✍️

- A young and passionate front-end engineer. Working with Angular and TypeScript. Like photography, running, cooking, and reading books.
- Author of [Angular Jira clone][jira-clone] and [Angular Tetris][tetris]
- Personal blog: https://trungk18.com/
- Say hello: trungk18 [et] gmail [dot] com

### Credits and references

The below table listed all of the awesome resources that I have referenced to

| Command                                                                 | Description                                                                                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@photonstorm/phaser3-typescript-project-template][typescript-template] | A quick-start project template combines Phaser 3 with [TypeScript](https://www.typescriptlang.org/) and uses [Rollup](https://rollupjs.org) for bundling |
| [Making Your First Phaser 3 Game][first-phaser-3-game]                  | Official guide to creating a small game involving a player running and jumping around platforms, collecting stars and avoiding baddies                   |
| [Invaders Game - Phaser 2][phaser2-invaders]                            | Official tutorial to build Invaders game with Phaser 2. I reused its static resources but converting the code to Phaser 3                                |
| [Phaser 3 API References][phaser-api]                                   | All of the API that you can refer to while working with Phaser 3                                                                                         |
| [Phaser 3 and TypeScript Tutorial][freecodecamp]                        | How to build a simple game in the browser with Phaser 3 and TypeScript                                                                                   |
| [Space Invaders Sounds Effects][sounds]                                 | Sound effects from the classic arcade game Space Invaders released in 1978 by Taito.                                                                     |  |

### License

Feel free to use my code on your project. It would be great if you put a reference to this repository.

[MIT](https://opensource.org/licenses/MIT)