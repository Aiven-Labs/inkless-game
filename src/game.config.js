// game.config.js - Configuration for the game
// This file can be customized for different environments

(function() {
    // Load configuration from environment variables or defaults
    const gameConfig = {
        // API URL for the high score backend
        apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8000'
            : 'https://your-production-api-domain.com',
        
        // Fallback URL when API is unavailable
        fallbackUrl: 'https://your-website.com',
        
        // Environment mode
        development: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        
        // Game settings
        initialBill: 2500,
        baseAlienSpeed: 50,
        baseBulletFrequency: 2500,
        
        // Difficulty scaling per level
        speedIncrease: 0.25,
        bulletFrequencyDecrease: 200,
        bulletSpeedIncrease: 15
    };

    // Make config globally available
    window.gameConfig = gameConfig;
    
    console.log('Game starting with config:', gameConfig);
})();