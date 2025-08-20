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
    this.line1Text.setText("GAME OVER");
    this.line2Text.setText(`Final Bill: $${this.formatMoney(this.currentBill)}`);
    this.line3Text.setText(`You Saved: $${this.formatMoney(this.totalSavings)}`);
    this.line4Text.setText("Submitting score...");
    this.line5Text.setText("");

    try {
      const result = await this.highScoreManager.submitScore(
        this.currentBill,
        this.totalSavings
      );

      if (result.success) {
        if (result.isHighScore) {
          this.line4Text.setText(`HIGH SCORE! Rank #${result.rank}!`);
          this.line4Text.setFill("#FFD700");
        } else {
          this.line4Text.setText("Scan QR code to claim your score!");
        }
        this.line5Text.setText(result.claimUrl);
        
        this._loadQRCode(result.qrCodeUrl);
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

  private _loadQRCode(qrUrl: string) {
    console.log('Loading QR code:', qrUrl);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 120;
        canvas.height = 120;
        
        ctx.drawImage(img, 0, 0, 120, 120);
        
        const texture = this._scene.textures.createCanvas('qr-code', canvas.width, canvas.height);
        const canvasTexture = texture.getCanvas();
        const canvasCtx = canvasTexture.getContext('2d');
        canvasCtx.drawImage(canvas, 0, 0);
        texture.refresh();
        
        if (this._scene.children.getByName('qr-display')) {
          this._scene.children.getByName('qr-display').destroy();
        }
        
        const qrDisplay = this._scene.add.image(400, 400, 'qr-code');
        qrDisplay.setName('qr-display');
        qrDisplay.setDisplaySize(120, 120);
        
        console.log('QR code displayed successfully');
      } catch (error) {
        console.error('Error creating QR texture:', error);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load QR code image');
      this.line5Text.setText("QR code failed to load");
    };
    
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
  
  // Also clear QR code when hiding text
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
clearQRCode() {
  const qrDisplay = this._scene.children.getByName('qr-display');
  if (qrDisplay) {
    qrDisplay.destroy();
  }
}

}