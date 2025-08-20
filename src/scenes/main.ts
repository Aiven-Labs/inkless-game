import { AssetType, SoundType } from "../interface/assets";
import { Bullet } from "../interface/bullet";
import { AssetManager } from "../interface/manager/asset-manager";
import { AlienManager } from "../interface/manager/alien-manager";
import { Ship } from "../interface/ship";
import {
    AnimationFactory,
    AnimationType,
} from "../interface/factory/animation-factory";
import { Alien } from "../interface/alien";
import { Kaboom } from "../interface/kaboom";
import { EnemyBullet } from "../interface/enemy-bullet";
import { ScoreManager } from "../interface/manager/score-manager";
import { GameState } from "../interface/game-state";

export class MainScene extends Phaser.Scene {
    state: GameState;
    assetManager: AssetManager;
    animationFactory: AnimationFactory;
    scoreManager: ScoreManager;
    bulletTime = 0;
    firingTimer = 0;
    nextBillIncrease = 0; // Timer for bill increases
    starfield: Phaser.GameObjects.TileSprite;
    player: Phaser.Physics.Arcade.Sprite;
    alienManager: AlienManager;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    fireKey: Phaser.Input.Keyboard.Key;
    private currentLevel: number = 1;

    constructor() {
        super({
            key: "MainScene",
        });
    }

    preload() {
        // Remove setBaseURL completely to avoid any path concatenation issues
        this.load.image(AssetType.Starfield, "assets/images/starfield.png");
        this.load.image(AssetType.Bullet, "assets/images/bullet.png");
        this.load.image(AssetType.EnemyBullet, "assets/images/enemy-bullet.png");
        this.load.spritesheet(AssetType.Alien, "assets/images/invader.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        
        // Load additional alien types for patterns
        this.load.image(AssetType.AlienYellow, "assets/images/alien_yellow.png");
        this.load.image(AssetType.AlienBlue, "assets/images/alien_blue.png");
        this.load.image(AssetType.AlienPurple, "assets/images/alien_purple.png");
        
        this.load.spritesheet(AssetType.Ship, "assets/images/player.png", {
            frameWidth: 64,
            frameHeight: 128,
        });
        this.load.spritesheet(AssetType.Kaboom, "assets/images/explode.png", {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.image(AssetType.Lives, "assets/images/lives.png");

        this.sound.volume = 0.5;
        this.load.audio(SoundType.Shoot, "assets/audio/shoot.wav");
        this.load.audio(SoundType.Kaboom, "assets/audio/explosion.wav");
        this.load.audio(SoundType.InvaderKilled, "assets/audio/invaderkilled.wav");
    }

    create() {
        this.state = GameState.Playing;
        this.starfield = this.add
            .tileSprite(0, 0, 800, 600, AssetType.Starfield)
            .setOrigin(0, 0);
        this.assetManager = new AssetManager(this);
        this.animationFactory = new AnimationFactory(this);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
        this.player = Ship.create(this);
        this.player.play(AnimationType.ShipIdle); // Start with idle animation
        this.alienManager = new AlienManager(this, this.assetManager.enemyBullets);
        this.scoreManager = new ScoreManager(this);

        // Initialize bill increase timer
        this.nextBillIncrease = this.time.now + 1000; // First increase after 1 second

        // Listen for next level event from ScoreManager
        this.events.on('nextLevel', this.startNextLevel, this);

        this.fireKey.on("down", () => {
            switch (this.state) {
                case GameState.Win:
                case GameState.GameOver:
                    this.restart();
                    break;
            }
        });

        // Start with level 1
        this.startLevel(1);
    }

    update(time: number, delta: number) {
        this.starfield.tilePositionY -= 1;
        this._shipKeyboardHandler();
        
        // Update alien manager with enhanced movement and bullets
        this.alienManager.update(time, delta);
        
        // Bill increases over time
        if (this.time.now > this.nextBillIncrease && this.state === GameState.Playing) {
            this.scoreManager.increaseBill(10); // Bill goes up by $10 every second
            this.nextBillIncrease = this.time.now + 1000;
        }
        
        if (this.time.now > this.firingTimer) {
            this._enemyFires();
        }

        this.physics.overlap(
            this.assetManager.bullets,
            this.alienManager.aliens,
            this._bulletHitAliens,
            null,
            this
        );
        this.physics.overlap(
            this.assetManager.enemyBullets,
            this.player,
            this._enemyBulletHitPlayer,
            null,
            this
        );
    }

    // Enhanced level start method
    private startLevel(level: number): void {
        console.log(`Starting Level ${level}`);
        this.currentLevel = level;
        
        // Clear screen
        this.clearLevel();
        
        // Create new formation with pattern
        this.alienManager.createFormation(level);
        
        // Set difficulty parameters
        this.setLevelDifficulty(level);
        
        // Reset player
        this.resetPlayer();
        
        // Show level intro
        this.showLevelIntro(level);

        // Handle special level events
        this.handleSpecialLevelEvents(level);
    }

    // Enhanced next level method
    private startNextLevel(level: number): void {
        console.log(`Advancing to Level ${level}`);
        this.currentLevel = level;
        
        // Wait a moment then start the new level
        this.time.delayedCall(1000, () => {
            this.startLevel(level);
            this.state = GameState.Playing;
        });
    }

    private clearLevel(): void {
        // Clear all game objects
        this.alienManager.killAll();
        this.assetManager.reset();
        
        // Clear any temporary UI
        this.scoreManager.hideText();
    }

    private setLevelDifficulty(level: number): void {
        // Base difficulty scaling
        const speedMultiplier = 1 + (level - 1) * 0.25;
        const bulletFrequencyBase = 2500;
        const bulletFrequency = Math.max(500, bulletFrequencyBase - (level - 1) * 200);
        const bulletSpeed = 150 + (level - 1) * 15;
        
        // Set alien movement speed
        this.alienManager.setSpeed(50 * speedMultiplier);
        
        // Set bullet parameters
        this.alienManager.setBulletFrequency(bulletFrequency);
        this.alienManager.setBulletSpeed(bulletSpeed);
        
        // Progressive bullet enhancements
        if (level >= 3) {
            this.alienManager.setMultipleBullets(true);
        }
        
        if (level >= 5) {
            this.alienManager.setMaxBullets(Math.min(8, 2 + Math.floor(level / 2)));
        }
        
        console.log(`Level ${level} Difficulty:
          - Speed: ${(speedMultiplier * 100).toFixed(0)}%
          - Bullet Frequency: ${bulletFrequency}ms
          - Bullet Speed: ${bulletSpeed}
          - Max Bullets: ${Math.min(8, 2 + Math.floor(level / 2))}
          - Multiple Bullets: ${level >= 3}
        `);
    }

private resetPlayer(): void {
  this.player.setPosition(400, 550);
  this.player.setActive(true).setVisible(true);
  this.player.body.enable = true;
  
  // Make sure scale is correct after reset
  this.player.setScale(0.7);
}

    private showLevelIntro(level: number): void {
        // Show level number briefly
        const levelText = this.add.text(400, 300, `LEVEL ${level}`, {
            fontSize: '48px',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Show pattern info
        let patternName = this.getPatternName(level);
        const patternText = this.add.text(400, 350, patternName, {
            fontSize: '24px',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Fade out after 2 seconds
        this.tweens.add({
            targets: [levelText, patternText],
            alpha: 0,
            duration: 1000,
            delay: 1500,
            onComplete: () => {
                levelText.destroy();
                patternText.destroy();
            }
        });
    }

    private getPatternName(level: number): string {
        const patterns = [
            "Classic Formation",     // Level 1
            "V-Wing Attack",         // Level 2  
            "Diamond Storm",         // Level 3
            "Wave Assault",          // Level 4
            "Spiral Madness",        // Level 5
            "Fortress Siege",        // Level 6
            "Chaos Formation"        // Level 7+
        ];
        
        const index = Math.min(level - 1, patterns.length - 1);
        return patterns[index];
    }

    private _shipKeyboardHandler() {
        let playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setVelocity(0, 0);
        
        if (this.cursors.left.isDown) {
            playerBody.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            playerBody.setVelocityX(200);
        }

        if (this.fireKey.isDown) {
            // Show firing/thrust animation when shooting
            this.player.play(AnimationType.ShipThrust, true);
            this._fireBullet();
        } else {
            // Show idle animation when not shooting
            this.player.play(AnimationType.ShipIdle, true);
        }
    }

    private async _bulletHitAliens(bullet: Bullet, alien: Alien) {
        let explosion: Kaboom = this.assetManager.explosions.get();
        bullet.kill();
        alien.kill(explosion);
        
        // Progressive scoring based on level
        const baseScore = 25;
        const levelMultiplier = 1 + (this.currentLevel - 1) * 0.1;
        const points = Math.floor(baseScore * levelMultiplier);
        
        this.scoreManager.saveFromBill(points);
        this.sound.play(SoundType.InvaderKilled);
        
        // Check if all aliens are defeated
        if (!this.alienManager.hasAliveAliens) {
            // Level completion bonus scales with difficulty
            const levelBonus = 200 + (this.currentLevel - 1) * 100;
            this.scoreManager.saveFromBill(levelBonus);
            
            await this.scoreManager.setWinText();
            this.state = GameState.LevelComplete; // New state for level completion
        }
    }

    private async _enemyBulletHitPlayer(ship, enemyBullet: EnemyBullet) {
    let explosion: Kaboom = this.assetManager.explosions.get();
    enemyBullet.kill();
    let live: Phaser.GameObjects.Sprite = this.scoreManager.lives.getFirstAlive();
    if (live) {
        live.setActive(false).setVisible(false);
    }

    explosion.setPosition(this.player.x, this.player.y);
    explosion.play(AnimationType.Kaboom);
    this.sound.play(SoundType.Kaboom);
    
    if (this.scoreManager.noMoreLives) {
        // Clear all aliens on game over
        this.alienManager.killAll();
        
        await this.scoreManager.setGameOverText(); // This uploads the high score
        this.assetManager.gameOver();
        this.state = GameState.GameOver;
        this.player.disableBody(true, true);
    }
}

    private _enemyFires() {
        if (!this.player.active) {
            return;
        }
        let enemyBullet: EnemyBullet = this.assetManager.enemyBullets.get();
        let randomEnemy = this.alienManager.getRandomAliveEnemy();
        if (enemyBullet && randomEnemy) {
            enemyBullet.setPosition(randomEnemy.x, randomEnemy.y);
            this.physics.moveToObject(enemyBullet, this.player, 120);
            this.firingTimer = this.time.now + 2000;
        }
    }

private _fireBullet() {
        if (!this.player.active) {
            return;
        }

        if (this.time.now > this.bulletTime) {
            let bullet: Bullet = this.assetManager.bullets.get();
            if (bullet) {
                bullet.shoot(this.player.x, this.player.y - 18);
                // Increased from 200ms to 400ms (half the fire rate)
                this.bulletTime = this.time.now + 400;
                
                // Brief laser flash effect
                this.player.setTint(0xffffff);
                this.time.delayedCall(50, () => {
                    this.player.clearTint();
                });
            }
        }
    }

    // Add method to handle special level events
    private handleSpecialLevelEvents(level: number): void {
        // Boss levels every 10 levels
        if (level % 10 === 0) {
            this.spawnBossLevel(level);
        }
        
        // Speed boost levels
        if (level % 5 === 0) {
            this.announceSpeedBoost();
        }
        
        // Warning for chaos levels
        if (level >= 7 && level % 3 === 1) {
            this.announceChaosModeWarning();
        }
    }

    private spawnBossLevel(level: number): void {
        const bossText = this.add.text(400, 200, 'BOSS LEVEL', {
            fontSize: '36px',
            fill: '#FF0000',
            stroke: '#FFFFFF',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => bossText.destroy());
    }

    private announceSpeedBoost(): void {
        const speedText = this.add.text(400, 450, 'SPEED BOOST LEVEL', {
            fontSize: '24px',
            fill: '#FFFF00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => speedText.destroy());
    }

    private announceChaosModeWarning(): void {
        const chaosText = this.add.text(400, 400, 'CHAOS MODE ACTIVE', {
            fontSize: '20px',
            fill: '#FF6600',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => chaosText.destroy());
    }

    restart() {
        this.state = GameState.Playing;
        this.currentLevel = 1; // Reset to level 1
        this.player.enableBody(true, this.player.x, this.player.y, true, true);
        this.scoreManager.resetLives();
        this.scoreManager.hideText();
        this.scoreManager.resetGame(); // Reset bill and savings
        this.alienManager.reset();
        this.assetManager.reset();
        
        // Clear QR code display
        const qrDisplay = this.children.getByName('qr-display');
        if (qrDisplay) {
            qrDisplay.destroy();
        }
        
        // Reset bill increase timer
        this.nextBillIncrease = this.time.now + 1000;
        
        // Restart with level 1
        this.startLevel(1);
    }
}