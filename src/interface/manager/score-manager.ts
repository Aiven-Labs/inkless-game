import { AssetType } from "../assets";

export class ScoreManager {
  billText: Phaser.GameObjects.Text;
  savingsText: Phaser.GameObjects.Text;
  line1Text: Phaser.GameObjects.Text;
  line2Text: Phaser.GameObjects.Text;
  line3Text: Phaser.GameObjects.Text;
  lives: Phaser.Physics.Arcade.Group;
  
  get noMoreLives() {
    return this.lives.countActive(true) === 0;
  }
  
  bestBill = 999999; // Track the lowest final bill (best performance)
  currentBill = 5000; // Starting bill amount ($5k)
  totalSavings = 0;  // Total money saved this game
  
  constructor(private _scene: Phaser.Scene) {
    this._init();
    this.print();
  }
  
  private _init() {
    const { width: SIZE_X, height: SIZE_Y } = this._scene.game.canvas;
    const textConfig = {
      fontFamily: `'Arial', sans-serif`,
      fill: "#ffffff",
    };
    const normalTextConfig = {
      ...textConfig,
      fontSize: "16px",
    };
    const bigTextConfig = {
      ...textConfig,
      fontSize: "36px",
    };
    const mediumTextConfig = {
      ...textConfig,
      fontSize: "24px",
    };
    
    // Bill display (top left)
    this._scene.add.text(16, 16, `YOUR BILL`, normalTextConfig);
    this.billText = this._scene.add.text(22, 32, "", normalTextConfig);
    
    // Savings display (below bill) - hidden during gameplay
    this._scene.add.text(16, 64, `SAVED`, normalTextConfig).setVisible(false);
    this.savingsText = this._scene.add.text(22, 80, "", normalTextConfig).setVisible(false);
    
    // End game text displays (center)
    this.line1Text = this._scene.add
      .text(SIZE_X / 2, 280, "", bigTextConfig)
      .setOrigin(0.5);
    this.line2Text = this._scene.add
      .text(SIZE_X / 2, 340, "", mediumTextConfig)
      .setOrigin(0.5);
    this.line3Text = this._scene.add
      .text(SIZE_X / 2, 380, "", mediumTextConfig)
      .setOrigin(0.5);
      
    this._setLivesText(SIZE_X, normalTextConfig);
  }
  
  private _setLivesText(
    SIZE_X: number,
    textConfig: { fontSize: string; fontFamily: string; fill: string }
  ) {
    this._scene.add.text(SIZE_X - 100, 16, `LIVES`, textConfig);
    this.lives = this._scene.physics.add.group({
      maxSize: 3,
      runChildUpdate: true,
    });
    this.resetLives();
  }
  
  resetLives() {
    let SIZE_X = this._scene.game.canvas.width;
    this.lives.clear(true, true);
    for (let i = 0; i < 3; i++) {
      let ship: Phaser.GameObjects.Sprite = this.lives.create(
        SIZE_X - 100 + 30 * i,
        60,
        AssetType.Lives
      );
      ship.setOrigin(0.5, 0.5);
      ship.setAlpha(0.6);
    }
  }
  
  setWinText() {
    this._setBigText(
      "LEVEL COMPLETE!", 
      `Final Bill: ${this.currentBill}`,
      `You Saved: ${this.totalSavings}!`
    );
    this.updateBestBill();
  }
  
  setGameOverText() {
    this._setBigText(
      "GAME OVER", 
      `Final Bill: ${this.currentBill}`,
      `You Saved: ${this.totalSavings}`
    );
    this.updateBestBill();
  }
  
  hideText() {
    this._setBigText("", "", "");
  }
  
  private _setBigText(line1: string, line2: string, line3: string) {
    this.line1Text.setText(line1);
    this.line2Text.setText(line2);
    this.line3Text.setText(line3);
  }
  
  updateBestBill() {
    if (this.currentBill < this.bestBill) {
      this.bestBill = this.currentBill;
    }
  }
  
  print() {
    this.billText.setText(`${this.currentBill}`);
    this.savingsText.setText(`${this.totalSavings}`);
  }
  
  // Bill increases over time (called from MainScene)
  increaseBill(amount = 1) {
    this.currentBill += amount;
    this.print();
  }
  
  // Save money by shooting aliens (replaces increaseScore)
  saveFromBill(amount = 5) {
    this.currentBill -= amount;
    this.totalSavings += amount;
    if (this.currentBill < 0) {
      this.totalSavings += this.currentBill; // Add the excess to savings
      this.currentBill = 0; // Bill can't go below $0
    }
    this.print();
  }
  
  // Reset for new game
  resetGame() {
    this.currentBill = 5000; // Reset to starting bill ($5k)
    this.totalSavings = 0;   // Reset savings
    this.print();
  }
  
  padding(num: number) {
    return `${num}`.padStart(4, "0");
  }
}