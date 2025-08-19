// src/interface/manager/highscore-manager.ts
import { Environment } from "../config/environment";

export class HighScoreManager {
    private apiUrl: string;
    private fallbackUrl: string;
    private environment: Environment;

    constructor() {
        this.environment = Environment.getInstance();
        this.apiUrl = this.environment.getApiUrl();
        this.fallbackUrl = this.environment.getFallbackUrl();
        
        console.log(`HighScoreManager initialized with API: ${this.apiUrl}`);
    }

    // Generate a random session ID
    private generateSessionId(): string {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    // Submit score - returns session ID for claiming
    async submitScore(finalBill: number, totalSavings: number): Promise<string | null> {
        try {
            const sessionId = this.generateSessionId();
            
            console.log(`Submitting score to ${this.apiUrl}/api/scores`);
            console.log(`Score data: Bill=${finalBill}, Savings=${totalSavings}`);
            
            const response = await fetch(`${this.apiUrl}/api/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    final_bill: finalBill,
                    total_savings: totalSavings,
                    timestamp: new Date().toISOString()
                })
            });

            console.log(`Response status: ${response.status}`);

            if (response.ok) {
                const result = await response.json();
                console.log('Score submitted successfully:', result);
                return sessionId;
            } else {
                const errorData = await response.json();
                console.error('Failed to submit score:', errorData);
                return null;
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            return null;
        }
    }

    // Generate claim URL
    getClaimUrl(sessionId: string): string {
        return `${this.apiUrl}/claim/${sessionId}`;
    }

    // Generate fallback URL for when API is unavailable
    getFallbackClaimUrl(): string {
        return `${this.fallbackUrl}/manual-score-submit`;
    }

    // Generate QR code data URL using free QR API
    generateQRCode(sessionId: string): string {
        const claimUrl = this.getClaimUrl(sessionId);
        console.log(`Generating QR code for: ${claimUrl}`);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(claimUrl)}`;
    }

    // Generate fallback QR code
    generateFallbackQRCode(): string {
        const fallbackUrl = this.getFallbackClaimUrl();
        console.log(`Generating fallback QR code for: ${fallbackUrl}`);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackUrl)}`;
    }

    // Check if score is a high score (optional - for immediate feedback)
    async checkHighScore(sessionId: string): Promise<{isHighScore: boolean, rank?: number} | null> {
        try {
            console.log(`Checking high score for session: ${sessionId}`);
            const response = await fetch(`${this.apiUrl}/api/check-high-score/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('High score check result:', data);
                return {
                    isHighScore: data.is_high_score,
                    rank: data.rank
                };
            } else {
                console.warn('High score check failed:', response.status);
            }
        } catch (error) {
            console.error('Error checking high score:', error);
        }
        return null;
    }

    // Get current configuration (useful for debugging)
    getConfig() {
        return {
            apiUrl: this.apiUrl,
            fallbackUrl: this.fallbackUrl,
            isDevelopment: this.environment.isDev()
        };
    }
}