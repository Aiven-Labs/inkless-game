// game.config.js - Configuration for the game
// This file can be customized for different environments

(function() {
    // Load configuration from environment variables or defaults
    const gameConfig = {
        // API URL for the high score backend
        apiUrl: process.env.GAME_API_URL || 'http://localhost:8000',
        
        // Fallback URL when API is unavailable
        fallbackUrl: process.env.GAME_FALLBACK_URL || 'https://your-website.com',
        
        // Development mode flag
        development: process.env.NODE_ENV !== 'production'
    };

    // Make config available globally
    if (typeof window !== 'undefined') {
        window.gameConfig = gameConfig;
    }

    console.log('Game configuration loaded:', gameConfig);
})();