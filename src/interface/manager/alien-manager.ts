import { AssetType } from "../assets";
import { Alien } from "../alien";
import { EnemyBullet } from "../enemy-bullet";

export enum AlienPattern {
  CLASSIC_GRID = "classic_grid",
  V_FORMATION = "v_formation", 
  DIAMOND = "diamond",
  WAVES = "waves",
  SPIRAL = "spiral",
  FORTRESS = "fortress",
  CHAOS = "chaos"
}

export enum MovementPattern {
  HORIZONTAL = "horizontal",
  VERTICAL_SWEEP = "vertical_sweep",
  DIAGONAL_SWEEP = "diagonal_sweep",
  BACK_AND_FORTH = "back_and_forth",
  SLOW_DESCENT = "slow_descent"
}

export class AlienManager {
  private scene: Phaser.Scene;
  public aliens: Phaser.Physics.Arcade.Group;
  private enemyBullets: Phaser.Physics.Arcade.Group;
  
  // Movement properties
  private moveSpeed: number = 50;
  private direction: number = 1;
  private dropDistance: number = 20;
  private movementPattern: MovementPattern = MovementPattern.HORIZONTAL;
  private movementTimer: number = 0;
  private verticalSpeed: number = 10;
  private backForthCounter: number = 0;
  
  // Bullet properties
  private bulletSpeed: number = 150;
  private bulletFrequency: number = 2000;
  private lastBulletTime: number = 0;
  private multipleBullets: boolean = false;
  private bulletSpreadAngle: number = 15; // degrees
  private maxSimultaneousBullets: number = 1;
  
  // Pattern properties
  private currentPattern: AlienPattern = AlienPattern.CLASSIC_GRID;
  
  constructor(scene: Phaser.Scene, enemyBullets: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.enemyBullets = enemyBullets;
    
    this.aliens = this.scene.physics.add.group({
      maxSize: 100,
      runChildUpdate: true
    });
  }

  // Create aliens based on level and pattern
  createFormation(level: number): void {
    this.killAll();
    
    // Select pattern based on level
    this.currentPattern = this.getPatternForLevel(level);
    this.movementPattern = this.getMovementForLevel(level);
    
    console.log(`Creating ${this.currentPattern} formation with ${this.movementPattern} movement`);
    
    switch (this.currentPattern) {
      case AlienPattern.CLASSIC_GRID:
        this.createClassicGrid(level);
        break;
      case AlienPattern.V_FORMATION:
        this.createVFormation(level);
        break;
      case AlienPattern.DIAMOND:
        this.createDiamond(level);
        break;
      case AlienPattern.WAVES:
        this.createWaves(level);
        break;
      case AlienPattern.SPIRAL:
        this.createSpiral(level);
        break;
      case AlienPattern.FORTRESS:
        this.createFortress(level);
        break;
      case AlienPattern.CHAOS:
        this.createChaos(level);
        break;
    }
    
    // Set bullet count based on level
    this.maxSimultaneousBullets = Math.min(5, 1 + Math.floor(level / 2));
    this.multipleBullets = level > 3;
  }

  private getPatternForLevel(level: number): AlienPattern {
    const patterns = [
      AlienPattern.CLASSIC_GRID,    // Level 1
      AlienPattern.V_FORMATION,     // Level 2
      AlienPattern.DIAMOND,         // Level 3
      AlienPattern.WAVES,           // Level 4
      AlienPattern.SPIRAL,          // Level 5
      AlienPattern.FORTRESS,        // Level 6
      AlienPattern.CHAOS            // Level 7+
    ];
    
    const index = Math.min(level - 1, patterns.length - 1);
    return patterns[index];
  }

  private getMovementForLevel(level: number): MovementPattern {
    if (level <= 3) return MovementPattern.HORIZONTAL;
    if (level <= 5) return MovementPattern.VERTICAL_SWEEP;
    if (level <= 7) return MovementPattern.DIAGONAL_SWEEP;
    if (level <= 9) return MovementPattern.BACK_AND_FORTH;
    return MovementPattern.SLOW_DESCENT;
  }

  // Formation patterns - all simplified and starting higher up
  private createClassicGrid(level: number): void {
    const cols = Math.min(8, 5 + level);
    const rows = Math.min(5, 3 + Math.floor(level / 3));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 200 + (col * 50);
        const y = 80 + (row * 40); // Higher up
        const alienType = this.getAlienTypeForRow(row);
        this.createAlien(x, y, alienType);
      }
    }
  }

  private createVFormation(level: number): void {
    const size = Math.min(6, 4 + Math.floor(level / 2));
    
    for (let i = 0; i < size; i++) {
      // Left wing
      const leftX = 320 - (i * 25);
      const leftY = 100 + (i * 20); // Higher up, smaller spacing
      this.createAlien(leftX, leftY, AssetType.AlienBlue);
      
      // Right wing
      const rightX = 480 + (i * 25);
      const rightY = 100 + (i * 20); // Higher up, smaller spacing
      this.createAlien(rightX, rightY, AssetType.AlienBlue);
      
      // Center line (every other)
      if (i % 2 === 0) {
        this.createAlien(400, 80 + (i * 15), AssetType.AlienYellow);
      }
    }
  }

  private createDiamond(level: number): void {
    const centerX = 400;
    const centerY = 120; // Higher up
    
    // Simple diamond - just 3 layers, clean spacing
    const positions = [
      // Inner layer (center)
      { x: 0, y: 0 },
      
      // Middle layer 
      { x: -40, y: -20 }, { x: 40, y: -20 },
      { x: -40, y: 20 }, { x: 40, y: 20 },
      
      // Outer layer
      { x: -80, y: 0 }, { x: 80, y: 0 },
      { x: 0, y: -40 }, { x: 0, y: 40 },
      { x: -60, y: -40 }, { x: 60, y: -40 },
      { x: -60, y: 40 }, { x: 60, y: 40 }
    ];
    
    positions.forEach((pos, index) => {
      const x = centerX + pos.x;
      const y = centerY + pos.y;
      
      if (x > 50 && x < 750 && y > 50 && y < 250) {
        const alienType = index < 1 ? AssetType.AlienYellow :
                         index < 5 ? AssetType.AlienBlue : AssetType.AlienPurple;
        this.createAlien(x, y, alienType);
      }
    });
  }

  private createWaves(level: number): void {
    const waves = 3; // Fixed number of waves
    const aliensPerWave = 6;
    
    for (let wave = 0; wave < waves; wave++) {
      for (let i = 0; i < aliensPerWave; i++) {
        const x = 220 + (i * 60);
        const y = 80 + (wave * 50); // Higher up, more spacing
        
        const alienType = this.getAlienTypeForRow(wave);
        this.createAlien(x, y, alienType);
      }
    }
  }

  private createSpiral(level: number): void {
    // Simple spiral - fewer aliens, better spacing
    const centerX = 400;
    const centerY = 140; // Higher up
    const totalAliens = 15; // Fewer aliens to prevent clustering
    
    for (let i = 0; i < totalAliens; i++) {
      const progress = i / totalAliens;
      const angle = progress * Math.PI * 3; // 1.5 full rotations instead of 4
      const radius = 50 + (progress * 100); // Better spacing progression
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.6; // Flattened
      
      if (x > 50 && x < 750 && y > 50 && y < 250) {
        const alienType = i < 5 ? AssetType.AlienYellow :
                         i < 10 ? AssetType.AlienBlue : AssetType.AlienPurple;
        this.createAlien(x, y, alienType);
      }
    }
  }

  private createFortress(level: number): void {
    // Simple fortress - clean walls
    const wallPositions = [
      // Top wall
      { x: 200, y: 80 }, { x: 250, y: 80 }, { x: 300, y: 80 }, { x: 350, y: 80 },
      { x: 450, y: 80 }, { x: 500, y: 80 }, { x: 550, y: 80 }, { x: 600, y: 80 },
      
      // Side walls
      { x: 200, y: 120 }, { x: 200, y: 160 }, { x: 600, y: 120 }, { x: 600, y: 160 },
      
      // Inner formation
      { x: 320, y: 120 }, { x: 360, y: 120 }, { x: 400, y: 120 }, { x: 440, y: 120 }, { x: 480, y: 120 },
      { x: 340, y: 160 }, { x: 380, y: 160 }, { x: 400, y: 160 }, { x: 420, y: 160 }, { x: 460, y: 160 }
    ];
    
    wallPositions.forEach((pos, index) => {
      const alienType = index < 8 ? AssetType.AlienPurple : // Top wall
                       index < 12 ? AssetType.AlienPurple : // Side walls  
                       AssetType.AlienYellow; // Inner formation
      this.createAlien(pos.x, pos.y, alienType);
    });
  }

  private createChaos(level: number): void {
    // Not really chaos - organized scattered groups
    const groups = [
      // Group 1 - top left
      { x: 250, y: 80 }, { x: 270, y: 100 }, { x: 290, y: 80 },
      
      // Group 2 - top right  
      { x: 510, y: 80 }, { x: 530, y: 100 }, { x: 550, y: 80 },
      
      // Group 3 - center
      { x: 380, y: 120 }, { x: 400, y: 140 }, { x: 420, y: 120 },
      
      // Group 4 - scattered
      { x: 200, y: 140 }, { x: 320, y: 160 }, { x: 480, y: 160 }, { x: 600, y: 140 },
      
      // Group 5 - bottom row
      { x: 260, y: 180 }, { x: 340, y: 200 }, { x: 460, y: 200 }, { x: 540, y: 180 }
    ];
    
    groups.forEach((pos, index) => {
      const alienType = index % 3 === 0 ? AssetType.AlienYellow :
                       index % 3 === 1 ? AssetType.AlienBlue : AssetType.AlienPurple;
      this.createAlien(pos.x, pos.y, alienType);
    });
  }

  private createAlien(x: number, y: number, type: AssetType): void {
    console.log(`Creating alien at ${x}, ${y} with type ${type}`);
    
    const alien = new Alien(this.scene, x, y);
    
    // Make sure the alien is added to the scene and physics world
    this.scene.add.existing(alien);
    this.scene.physics.add.existing(alien);
    
    // Use the existing spritesheet
    alien.setTexture(AssetType.Alien);
    
    // Make sure alien is visible and active
    alien.setActive(true);
    alien.setVisible(true);
    alien.setScale(1);
    
    // Add color tints to differentiate alien types
    switch (type) {
      case AssetType.AlienYellow:
        alien.setTint(0xFFDD00); // Bright yellow
        break;
      case AssetType.AlienBlue:
        alien.setTint(0x4488FF); // Bright blue
        break;
      case AssetType.AlienPurple:
        alien.setTint(0xFF44FF); // Bright purple
        break;
      default:
        alien.setTint(0xFFFFFF); // White (normal)
        break;
    }
    
    // Add alien animation using the spritesheet
    // Create animation if it doesn't exist
    if (!this.scene.anims.exists('alien_idle')) {
      this.scene.anims.create({
        key: 'alien_idle',
        frames: this.scene.anims.generateFrameNumbers(AssetType.Alien, { start: 0, end: 1 }),
        frameRate: 2, // Slow animation
        repeat: -1 // Loop forever
      });
    }
    
    // Play the alien animation
    alien.play('alien_idle');
    
    console.log(`Alien created: visible=${alien.visible}, active=${alien.active}, texture=${alien.texture.key}`);
    
    this.aliens.add(alien);
    
    // Add custom properties for linear movement tracking
    alien.setData('startX', x);
    alien.setData('startY', y);
    alien.setData('individualDirection', Math.random() > 0.5 ? 1 : -1); // For individual alien movement
  }

  private getAlienTypeForRow(row: number): AssetType {
    if (row < 2) return AssetType.AlienYellow;
    if (row < 4) return AssetType.AlienBlue;
    return AssetType.AlienPurple;
  }

  // Linear movement system - all movement patterns use simple linear motion
  update(time: number, delta: number): void {
    this.movementTimer += delta;
    
    switch (this.movementPattern) {
      case MovementPattern.HORIZONTAL:
        this.updateHorizontalMovement();
        break;
      case MovementPattern.VERTICAL_SWEEP:
        this.updateVerticalSweepMovement();
        break;
      case MovementPattern.DIAGONAL_SWEEP:
        this.updateDiagonalMovement();
        break;
      case MovementPattern.BACK_AND_FORTH:
        this.updateBackAndForthMovement();
        break;
      case MovementPattern.SLOW_DESCENT:
        this.updateSlowDescentMovement();
        break;
    }
    
    this.updateBullets(time);
  }

  private updateHorizontalMovement(): void {
    let shouldDrop = false;
    
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      alien.x += this.moveSpeed * this.direction * (1/60);
      
      if ((alien.x <= 50 && this.direction === -1) || 
          (alien.x >= 750 && this.direction === 1)) {
        shouldDrop = true;
      }
    });
    
    if (shouldDrop) {
      this.direction *= -1;
      this.aliens.children.entries.forEach((alien: any) => {
        if (!alien.active) return;
        alien.y += this.dropDistance;
      });
    }
  }

  private updateVerticalSweepMovement(): void {
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      // Move horizontally like normal
      alien.x += this.moveSpeed * this.direction * (1/60);
      
      // Add slow vertical movement
      alien.y += this.verticalSpeed * (1/60);
    });
    
    // Check horizontal boundaries and reverse direction
    let shouldReverse = false;
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      if ((alien.x <= 50 && this.direction === -1) || (alien.x >= 750 && this.direction === 1)) {
        shouldReverse = true;
      }
    });
    
    if (shouldReverse) {
      this.direction *= -1;
    }
  }

  private updateDiagonalMovement(): void {
    // Change direction every 3 seconds
    if (this.movementTimer > 3000) {
      this.direction *= -1;
      this.movementTimer = 0;
    }
    
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      // Move diagonally - horizontal and vertical at same time
      alien.x += this.moveSpeed * this.direction * 0.7 * (1/60); // Slower horizontal
      alien.y += this.moveSpeed * 0.3 * (1/60); // Slower vertical
      
      // Wrap around horizontally if needed
      if (alien.x < 0) alien.x = 800;
      if (alien.x > 800) alien.x = 0;
      
      // Reset position if too far down
      if (alien.y > 500) {
        alien.y = alien.getData('startY');
      }
    });
  }

  private updateBackAndForthMovement(): void {
    // Change direction every 2 seconds
    if (this.movementTimer > 2000) {
      this.direction *= -1;
      this.movementTimer = 0;
      this.backForthCounter++;
      
      // Every few direction changes, move down slightly
      if (this.backForthCounter % 4 === 0) {
        this.aliens.children.entries.forEach((alien: any) => {
          if (!alien.active) return;
          alien.y += this.dropDistance;
        });
      }
    }
    
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      // Simple back and forth movement
      alien.x += this.moveSpeed * this.direction * (1/60);
      
      // Keep aliens on screen
      if (alien.x < 50) alien.x = 50;
      if (alien.x > 750) alien.x = 750;
    });
  }

  private updateSlowDescentMovement(): void {
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      const individualDir = alien.getData('individualDirection');
      
      // Each alien moves independently left/right slowly
      alien.x += this.moveSpeed * individualDir * 0.3 * (1/60);
      
      // All aliens descend slowly
      alien.y += this.verticalSpeed * 0.5 * (1/60);
      
      // Reverse individual direction if hitting boundaries
      if (alien.x <= 50 || alien.x >= 750) {
        alien.setData('individualDirection', individualDir * -1);
      }
      
      // Reset position if too far down
      if (alien.y > 500) {
        alien.y = alien.getData('startY');
        alien.x = alien.getData('startX');
      }
    });
  }

  // Enhanced bullet system
  private updateBullets(time: number): void {
    if (time - this.lastBulletTime > this.bulletFrequency) {
      this.fireBullets();
      this.lastBulletTime = time;
    }
  }

  private fireBullets(): void {
    const activeAliens = this.aliens.children.entries.filter((alien: any) => alien.active);
    if (activeAliens.length === 0) return;
    
    const bulletCount = Math.min(this.maxSimultaneousBullets, activeAliens.length);
    
    for (let i = 0; i < bulletCount; i++) {
      const randomAlien = activeAliens[Math.floor(Math.random() * activeAliens.length)] as any;
      
      if (this.multipleBullets && Math.random() < 0.3) {
        // Spread shot
        this.fireSpreadBullets(randomAlien);
      } else {
        // Single bullet
        this.fireSingleBullet(randomAlien);
      }
    }
  }

  private fireSingleBullet(alien: any): void {
    const bullet = this.enemyBullets.get();
    if (bullet) {
      bullet.setPosition(alien.x, alien.y + 10);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.enable = true;
      bullet.setVelocityY(this.bulletSpeed);
    }
  }

  private fireSpreadBullets(alien: any): void {
    const bulletCount = 3;
    const angleStep = this.bulletSpreadAngle / (bulletCount - 1);
    const startAngle = -this.bulletSpreadAngle / 2;
    
    for (let i = 0; i < bulletCount; i++) {
      const bullet = this.enemyBullets.get();
      if (bullet) {
        bullet.setPosition(alien.x, alien.y + 10);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.enable = true;
        
        const angle = startAngle + (i * angleStep);
        const angleRad = Phaser.Math.DegToRad(90 + angle); // 90 degrees = straight down
        
        const velocityX = Math.cos(angleRad) * this.bulletSpeed;
        const velocityY = Math.sin(angleRad) * this.bulletSpeed;
        
        bullet.setVelocity(velocityX, velocityY);
      }
    }
  }

  // Public methods for difficulty adjustment
  setSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  setBulletFrequency(frequency: number): void {
    this.bulletFrequency = frequency;
  }

  setBulletSpeed(speed: number): void {
    this.bulletSpeed = speed;
  }

  setMultipleBullets(enabled: boolean): void {
    this.multipleBullets = enabled;
  }

  setMaxBullets(count: number): void {
    this.maxSimultaneousBullets = count;
  }

  get hasAliveAliens(): boolean {
    return this.aliens.children.entries.some((alien: any) => alien.active);
  }

  killAll(): void {
    this.aliens.children.entries.forEach((alien: any) => {
      if (alien && alien.active) {
        alien.setActive(false);
        alien.setVisible(false);
        alien.body.enable = false;
      }
    });
    this.aliens.clear(true, true);
  }

  // Compatibility methods for existing code
  getRandomAliveEnemy(): any {
    const activeAliens = this.aliens.children.entries.filter((alien: any) => alien.active);
    if (activeAliens.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * activeAliens.length);
    return activeAliens[randomIndex];
  }

  reset(): void {
    this.killAll();
    this.currentPattern = AlienPattern.CLASSIC_GRID;
    this.movementPattern = MovementPattern.HORIZONTAL;
    this.direction = 1;
    this.moveSpeed = 50;
    this.bulletFrequency = 2000;
    this.bulletSpeed = 150;
    this.multipleBullets = false;
    this.maxSimultaneousBullets = 1;
    this.backForthCounter = 0;
  }
}