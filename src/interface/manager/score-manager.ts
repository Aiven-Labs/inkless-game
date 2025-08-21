import { AssetType } from "../assets";
import { HighScoreManager } from "./highscore-manager";
import { AnimationType } from "../factory/animation-factory";

export class ScoreManager {
  billText: Phaser.GameObjects.Text;
  savingsText: Phaser.GameObjects.Text;
  line1Text: Phaser.GameObjects.Text;
  line2Text: Phaser.GameObjects.Text;
  line3Text: Phaser.GameObjects.Text;
  line4Text: Phaser.GameObjects.Text;
  line5Text: Phaser.GameObjects.Text;
  lives: Phaser.Physics.Arcade.Group;
  currentBill: number;
  totalSavings: number;
  bestBill: number;
  private _scene: Phaser.Scene;
  private highScoreManager: HighScoreManager;
  private currentLevel: number = 1;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
    this.highScoreManager = new HighScoreManager();
    this.currentBill = 2500;
    this.totalSavings = 0;
    this.bestBill = parseInt(localStorage.getItem('bestBill') || '2500');
    
    this._createText();
    this._createLives();
  }

  private _createText() {
  this.billText = this._scene.add.text(20, 20, `Bill: $${this.formatMoney(this.currentBill)}`, {
    fontSize: '18px',
    fill: '#FF6B6B'
  }).setDepth(1000); // High depth so it's always on top

  this.savingsText = this._scene.add.text(20, 45, `Saved: $${this.formatMoney(this.totalSavings)}`, {
    fontSize: '18px',
    fill: '#4ECDC4'
  }).setDepth(1000); // High depth so it's always on top

  this.line1Text = this._scene.add.text(400, 200, "", {
    fontSize: "32px",
    fill: "#ffffff"
  }).setOrigin(0.5).setDepth(1000); // High depth so it's always on top

  this.line2Text = this._scene.add.text(400, 240, "", {
    fontSize: "18px",
    fill: "#ffffff"
  }).setOrigin(0.5).setDepth(1000); // High depth so it's always on top

  this.line3Text = this._scene.add.text(400, 270, "", {
    fontSize: "18px",
    fill: "#ffffff"
  }).setOrigin(0.5).setDepth(1000); // High depth so it's always on top

  this.line4Text = this._scene.add.text(400, 300, "", {
    fontSize: "16px",
    fill: "#ffffff"
  }).setOrigin(0.5).setDepth(1000); // High depth so it's always on top

  this.line5Text = this._scene.add.text(400, 330, "", {
    fontSize: "14px",
    fill: "#ffffff"
  }).setOrigin(0.5).setDepth(1000); // High depth so it's always on top
}

private _createLives() {
  this.lives = this._scene.physics.add.group({
    maxSize: 3,
    runChildUpdate: true
  });

  for (let i = 0; i < 3; i++) {
    // Use Ship sprite and play the same idle animation as the player
    let live: Phaser.Physics.Arcade.Sprite = this.lives.create(750 - (i * 35), 50, AssetType.Ship);
    
    // Make lives smaller (30% of normal size)
    live.setScale(0.3);
    live.setActive(true);
    live.setVisible(true);
    
    // Play the same idle animation as the player ship
    live.play(AnimationType.ShipIdle);
  }
}

  saveFromBill(amount: number) {
    this.currentBill = Math.max(0, this.currentBill - amount);
    this.totalSavings += amount;
    this.updateDisplay();
  }

  addToBill(amount: number) {
    this.currentBill += amount;
    this.updateDisplay();
  }

  // ADDED: Method to increase bill over time
  increaseBill(amount: number) {
    this.currentBill += amount;
    this.updateDisplay();
  }

  updateDisplay() {
    this.billText.setText(`Bill: $${this.formatMoney(this.currentBill)}`);
    this.savingsText.setText(`Saved: $${this.formatMoney(this.totalSavings)}`);
  }

  formatMoney(amount: number): string {
    return amount.toLocaleString();
  }

  get noMoreLives(): boolean {
    return this.lives.getFirstAlive() === null;
  }

  async setWinText() {
    this.currentLevel++;
    
    // Level completion bonus
    const levelBonus = 500 * this.currentLevel;
    this.saveFromBill(levelBonus);
    
    await this._setLevelCompleteText();
  }
  
  async setGameOverText() {
    await this._setGameOverWithScore();
  }
  
  private async _setLevelCompleteText() {
    this.line1Text.setText("LEVEL COMPLETE!");
    this.line2Text.setText(`Level ${this.currentLevel - 1} cleared!`);
    this.line3Text.setText(`Bonus: $${this.formatMoney(500 * this.currentLevel)}`);
    this.line4Text.setText(`Total Saved: $${this.formatMoney(this.totalSavings)}`);
    this.line5Text.setText("Preparing next level...");
    
    // Wait 3 seconds then signal to continue to next level
    setTimeout(() => {
      this.hideText();
      // Signal to MainScene that we're ready for next level
      this._scene.events.emit('nextLevel', this.currentLevel);
    }, 3000);
  }
  
  private async _setGameOverWithScore() {
    // Clear any existing QR codes and text first
    this.clearQRCode();
    
    this.line1Text.setText("GAME OVER");
    this.line2Text.setText(`Final Bill: $${this.formatMoney(this.currentBill)}`);
    this.line3Text.setText(`You Saved: $${this.formatMoney(this.totalSavings)}`);
    this.line4Text.setText("Submitting score...");
    this.line5Text.setText("Please wait...");

    try {
      const result = await this.highScoreManager.submitScore(
        this.currentBill,
        this.totalSavings
      );

      if (result.success) {
        // Store the claim info but don't display URL text until QR is ready
        const claimUrl = result.claimUrl;
        const sessionId = result.sessionId;
        
        if (result.isHighScore) {
          this.line4Text.setText(`HIGH SCORE! Rank #${result.rank}!`);
          this.line4Text.setFill("#FFD700");
          this.line5Text.setText("Scan QR code to claim your score!");
        } else {
          this.line4Text.setText("Scan QR code to claim your score!");
          this.line5Text.setText("Loading QR code...");
        }
        
        // Load QR code with session ID for unique tracking
        this._loadQRCodeWithSession(result.qrCodeUrl, sessionId, claimUrl);
      } else {
        this.line4Text.setText("Score submission failed");
        this.line5Text.setText("Please try again later");
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      this.line4Text.setText("Network error occurred");
      this.line5Text.setText("Check your connection");
    }
    
    this.updateBestBill();
  }

  private _loadQRCodeWithSession(qrUrl: string, sessionId: string, claimUrl: string) {
    console.log('Loading QR code for session:', sessionId);
    
    // Use session ID in texture key for uniqueness
    const textureKey = `qr-code-${sessionId}`;
    
    // Clean up any existing QR code first
    this.clearQRCode();
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        // Create a fresh canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Could not get canvas context');
          this.line5Text.setText("QR code failed to load");
          return;
        }
        
        canvas.width = 120;
        canvas.height = 120;
        
        // Draw image to our canvas
        ctx.drawImage(img, 0, 0, 120, 120);
        
        // Use addCanvas with session-specific key
        this._scene.textures.addCanvas(textureKey, canvas);
        
        // Remove any existing QR display
        const existingQR = this._scene.children.getByName('qr-display');
        if (existingQR) {
          existingQR.destroy();
        }
        
        // Create the QR display
        const qrDisplay = this._scene.add.image(400, 400, textureKey);
        qrDisplay.setName('qr-display');
        qrDisplay.setDisplaySize(120, 120);
        qrDisplay.setDepth(1001);
        
        // Add session ID as data for tracking
        qrDisplay.setData('sessionId', sessionId);
        
        // Now show the claim URL since QR is ready
        this.line5Text.setText(`Claim: ${claimUrl}`);
        
        console.log(`QR code displayed successfully for session: ${sessionId}`);
        
      } catch (error) {
        console.error('Error creating QR texture:', error);
        this.line5Text.setText("QR code display failed");
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load QR code image:', error);
      this.line5Text.setText("QR code failed to load");
    };
    
    // Set loading timeout
    setTimeout(() => {
      if (!img.complete) {
        console.log('QR code loading timeout for session:', sessionId);
        this.line5Text.setText("QR code loading timeout");
      }
    }, 5000);
    
    img.src = qrUrl;
  }

  // Enhanced clearQRCode method with session tracking
  clearQRCode() {
    // Remove QR display and log which session we're clearing
    const qrDisplay = this._scene.children.getByName('qr-display');
    if (qrDisplay) {
      const sessionId = qrDisplay.getData('sessionId');
      if (sessionId) {
        console.log(`Clearing QR code for session: ${sessionId}`);
      }
      qrDisplay.destroy();
    }
    
    // Clean up ALL QR textures
    const textureManager = this._scene.textures;
    const textureKeys = Object.keys(textureManager.list);
    
    textureKeys.forEach(key => {
      if (key.startsWith('qr-code')) {
        try {
          textureManager.remove(key);
          console.log(`Removed QR texture: ${key}`);
        } catch (error) {
          console.warn(`Could not remove texture ${key}:`, error);
        }
      }
    });
  }

private _loadQRCode(qrUrl: string) {
    console.log('Loading QR code:', qrUrl);
    
    // Generate unique texture key using timestamp to avoid conflicts
    const textureKey = `qr-code-${Date.now()}`;
    
    // Clean up any existing QR code first
    this.clearQRCode();
    
    // Remove any existing qr-code textures
    if (this._scene.textures.exists('qr-code')) {
      this._scene.textures.remove('qr-code');
    }
    if (this._scene.textures.exists(textureKey)) {
      this._scene.textures.remove(textureKey);
    }
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        // Create a fresh canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Could not get canvas context');
          this.line5Text.setText("QR code failed to load");
          return;
        }
        
        canvas.width = 120;
        canvas.height = 120;
        
        // Draw image to our canvas
        ctx.drawImage(img, 0, 0, 120, 120);
        
        // Use addCanvas instead of createCanvas to avoid conflicts
        this._scene.textures.addCanvas(textureKey, canvas);
        
        // Remove any existing QR display
        const existingQR = this._scene.children.getByName('qr-display');
        if (existingQR) {
          existingQR.destroy();
        }
        
        // Create the QR display with unique texture key
        const qrDisplay = this._scene.add.image(400, 400, textureKey);
        qrDisplay.setName('qr-display');
        qrDisplay.setDisplaySize(120, 120);
        qrDisplay.setDepth(1001); // Above other UI elements
        
        console.log('QR code displayed successfully with texture:', textureKey);
        
      } catch (error) {
        console.error('Error creating QR texture:', error);
        this.line5Text.setText("QR code display failed");
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load QR code image:', error);
      this.line5Text.setText("QR code failed to load");
    };
    
    // Set loading timeout
    setTimeout(() => {
      if (!img.complete) {
        console.log('QR code loading timeout');
        this.line5Text.setText("QR code loading timeout");
      }
    }, 5000);
    
    img.src = qrUrl;
  }

  updateBestBill() {
    if (this.currentBill < this.bestBill) {
      this.bestBill = this.currentBill;
      localStorage.setItem('bestBill', this.bestBill.toString());
    }
  }

// UPDATE the hideText method to also clear QR code:
  hideText() {
    this.line1Text.setText("");
    this.line2Text.setText("");
    this.line3Text.setText("");
    this.line4Text.setText("");
    this.line5Text.setText("");
    this.line4Text.setFill("#ffffff");
    this.line5Text.setFill("#ffffff");
    
    // Enhanced QR code cleanup
    this.clearQRCode();
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  resetForNewLevel() {
    this.hideText();
  }

  // ADDED: Method to reset game state
  resetGame() {
    this.currentBill = 2500;
    this.totalSavings = 0;
    this.currentLevel = 1;
    this.updateDisplay();
  }

resetLives() {
  // Clear existing lives
  this.lives.children.entries.forEach((live: any) => {
    live.setActive(false);
    live.setVisible(false);
    live.destroy();
  });
  this.lives.clear();
  
  // Recreate lives with animations
  this._createLives();
}

  // Legacy methods for compatibility
  _setBigText(line1: string, line2: string, line3: string) {
    this.line1Text.setText(line1);
    this.line2Text.setText(line2);
    this.line3Text.setText(line3);
  }

}