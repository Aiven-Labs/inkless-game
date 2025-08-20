export class HighScoreManager {
    private apiUrl: string = 'http://localhost:8000';

    constructor() {
        console.log(`HighScoreManager initialized with API: ${this.apiUrl}`);
    }

    // Generate a random session ID
    private generateSessionId(): string {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    async submitScore(finalBill: number, totalSavings: number): Promise<any> {
    const sessionId = this.generateSessionId();
    const timestamp = new Date().toISOString();

    try {
        console.log('Submitting score:', { sessionId, finalBill, totalSavings });

        const response = await fetch(`${this.apiUrl}/api/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: sessionId,
                final_bill: finalBill,
                total_savings: totalSavings,
                timestamp: timestamp
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Score submission result:', result);

        if (result.success) {
            // Try to get leaderboard, but handle errors gracefully
            let isHighScore = false;
            let playerRank = null;
            
            try {
                const leaderboardResponse = await fetch(`${this.apiUrl}/api/leaderboard`);
                if (leaderboardResponse.ok) {
                    const leaderboard = await leaderboardResponse.json();
                    
                    // Check if leaderboard is an array
                    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
                        const topTenPercent = Math.ceil(leaderboard.length * 0.1);
                        const playerRankIndex = leaderboard.findIndex(entry => 
                            entry.total_savings === totalSavings && 
                            entry.final_bill === finalBill
                        );
                        
                        if (playerRankIndex >= 0) {
                            playerRank = playerRankIndex + 1;
                            isHighScore = playerRank <= topTenPercent;
                        }
                    }
                }
            } catch (leaderboardError) {
                console.warn('Could not fetch leaderboard:', leaderboardError);
                // Continue without high score detection
            }

            return {
                success: true,
                sessionId: sessionId,
                claimUrl: `${this.apiUrl}/claim/${sessionId}`,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${this.apiUrl}/claim/${sessionId}`)}`,
                isHighScore: isHighScore,
                rank: playerRank
            };
        } else {
            return {
                success: false,
                error: result.detail || 'Unknown error'
            };
        }

    } catch (error) {
        console.error('Error submitting score:', error);
        return {
            success: false,
            error: error.message || 'Network error'
        };
    }
}

    // Get current leaderboard
    async getLeaderboard(): Promise<any> {
        try {
            const response = await fetch(`${this.apiUrl}/api/leaderboard`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }
}