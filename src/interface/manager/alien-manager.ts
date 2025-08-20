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
  SINE_WAVE = "sine_wave",
  DIAGONAL_SWEEP = "diagonal_sweep",
  CIRCULAR = "circular",
  ZIGZAG = "zigzag"
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
  private waveAmplitude: number = 50;
  private waveFrequency: number = 0.02;
  
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
    if (level <= 2) return MovementPattern.HORIZONTAL;
    if (level <= 4) return MovementPattern.SINE_WAVE;
    if (level <= 6) return MovementPattern.ZIGZAG;
    if (level <= 8) return MovementPattern.DIAGONAL_SWEEP;
    return MovementPattern.CIRCULAR;
  }

  // Formation patterns
  private createClassicGrid(level: number): void {
    const cols = Math.min(10, 6 + level);
    const rows = Math.min(6, 3 + Math.floor(level / 2));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 150 + (col * 50);
        const y = 100 + (row * 40);
        const alienType = this.getAlienTypeForRow(row);
        this.createAlien(x, y, alienType);
      }
    }
  }

  private createVFormation(level: number): void {
    const size = Math.min(8, 4 + level);
    
    for (let i = 0; i < size; i++) {
      // Left wing
      const leftX = 300 - (i * 30);
      const leftY = 150 + (i * 25);
      this.createAlien(leftX, leftY, AssetType.AlienBlue);
      
      // Right wing
      const rightX = 500 + (i * 30);
      const rightY = 150 + (i * 25);
      this.createAlien(rightX, rightY, AssetType.AlienBlue);
      
      // Center line (every other)
      if (i % 2 === 0) {
        this.createAlien(400, 120 + (i * 20), AssetType.AlienYellow);
      }
    }
  }

  private createDiamond(level: number): void {
    const size = Math.min(6, 3 + Math.floor(level / 2));
    const centerX = 400;
    const centerY = 200;
    
    for (let layer = 0; layer < size; layer++) {
      const radius = 30 + (layer * 25);
      const alienCount = Math.max(4, layer * 2 + 4);
      
      for (let i = 0; i < alienCount; i++) {
        const angle = (i / alienCount) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius * 0.6; // Flatten diamond
        
        const alienType = layer < 2 ? AssetType.AlienYellow : 
                         layer < 4 ? AssetType.AlienBlue : AssetType.AlienPurple;
        this.createAlien(x, y, alienType);
      }
    }
  }

  private createWaves(level: number): void {
    const waves = Math.min(4, 2 + Math.floor(level / 2));
    const aliensPerWave = 8 + level;
    
    for (let wave = 0; wave < waves; wave++) {
      for (let i = 0; i < aliensPerWave; i++) {
        const x = 100 + (i * 60);
        const baseY = 120 + (wave * 60);
        const waveOffset = Math.sin((i / aliensPerWave) * Math.PI * 2) * 30;
        const y = baseY + waveOffset;
        
        const alienType = this.getAlienTypeForRow(wave);
        this.createAlien(x, y, alienType);
      }
    }
  }

  private createSpiral(level: number): void {
    const totalAliens = Math.min(50, 20 + level * 3);
    const centerX = 400;
    const centerY = 200;
    
    for (let i = 0; i < totalAliens; i++) {
      const angle = (i / totalAliens) * Math.PI * 6; // 3 full rotations
      const radius = 30 + (i / totalAliens) * 150;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.5;
      
      const alienType = i < totalAliens / 3 ? AssetType.AlienYellow :
                       i < totalAliens * 2 / 3 ? AssetType.AlienBlue : AssetType.AlienPurple;
      this.createAlien(x, y, alienType);
    }
  }

  private createFortress(level: number): void {
    // Outer walls
    for (let i = 0; i < 12; i++) {
      // Top wall
      this.createAlien(150 + (i * 50), 100, AssetType.AlienPurple);
      // Bottom wall  
      this.createAlien(150 + (i * 50), 280, AssetType.AlienPurple);
      
      if (i < 6) {
        // Left wall
        this.createAlien(150, 120 + (i * 30), AssetType.AlienPurple);
        // Right wall
        this.createAlien(700, 120 + (i * 30), AssetType.AlienPurple);
      }
    }
    
    // Inner formation
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        const x = 250 + (col * 40);
        const y = 150 + (row * 35);
        const alienType = row === 1 ? AssetType.AlienYellow : AssetType.AlienBlue;
        this.createAlien(x, y, alienType);
      }
    }
  }

  private createChaos(level: number): void {
    const totalAliens = Math.min(60, 30 + level * 2);
    
    // Create random clusters
    const clusters = 5 + Math.floor(level / 3);
    for (let cluster = 0; cluster < clusters; cluster++) {
      const clusterX = 150 + Math.random() * 500;
      const clusterY = 100 + Math.random() * 200;
      const clusterSize = 5 + Math.random() * 8;
      
      for (let i = 0; i < clusterSize; i++) {
        const x = clusterX + (Math.random() - 0.5) * 100;
        const y = clusterY + (Math.random() - 0.5) * 80;
        
        if (x > 50 && x < 750 && y > 80 && y < 350) {
          const alienType = Math.random() < 0.3 ? AssetType.AlienYellow :
                           Math.random() < 0.6 ? AssetType.AlienBlue : AssetType.AlienPurple;
          this.createAlien(x, y, alienType);
        }
      }
    }
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
  
  console.log(`Alien created: visible=${alien.visible}, active=${alien.active}, texture=${alien.texture.key}`);
  
  this.aliens.add(alien);
  
  // Add custom properties for advanced movement
  alien.setData('startX', x);
  alien.setData('startY', y);
  alien.setData('moveTimer', Math.random() * 1000);
}

  private getAlienTypeForRow(row: number): AssetType {
    if (row < 2) return AssetType.AlienYellow;
    if (row < 4) return AssetType.AlienBlue;
    return AssetType.AlienPurple;
  }

  // Enhanced movement system
  update(time: number, delta: number): void {
    this.movementTimer += delta;
    
    switch (this.movementPattern) {
      case MovementPattern.HORIZONTAL:
        this.updateHorizontalMovement();
        break;
      case MovementPattern.SINE_WAVE:
        this.updateSineWaveMovement(time);
        break;
      case MovementPattern.ZIGZAG:
        this.updateZigzagMovement(time);
        break;
      case MovementPattern.DIAGONAL_SWEEP:
        this.updateDiagonalMovement(time);
        break;
      case MovementPattern.CIRCULAR:
        this.updateCircularMovement(time);
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

  private updateSineWaveMovement(time: number): void {
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      const startX = alien.getData('startX');
      const startY = alien.getData('startY');
      const moveTimer = alien.getData('moveTimer') + time * 0.001;
      
      alien.x = startX + Math.sin(moveTimer * this.waveFrequency) * this.waveAmplitude;
      alien.y = startY + Math.sin(moveTimer * this.waveFrequency * 0.5) * 20;
      
      alien.setData('moveTimer', moveTimer);
    });
  }

  private updateZigzagMovement(time: number): void {
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      const moveTimer = alien.getData('moveTimer') + time * 0.001;
      const zigzag = Math.sin(moveTimer * 0.05) * 2;
      
      alien.x += (this.moveSpeed * this.direction + zigzag) * (1/60);
      alien.y += Math.abs(zigzag) * 0.5;
      
      alien.setData('moveTimer', moveTimer);
    });
    
    // Check boundaries and reverse direction
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

  private updateDiagonalMovement(time: number): void {
    const sweepDirection = Math.sin(time * 0.001) > 0 ? 1 : -1;
    
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      alien.x += this.moveSpeed * sweepDirection * 0.5 * (1/60);
      alien.y += this.moveSpeed * 0.3 * (1/60);
      
      // Wrap around screen
      if (alien.x < 0) alien.x = 800;
      if (alien.x > 800) alien.x = 0;
      if (alien.y > 600) alien.y = 100;
    });
  }

  private updateCircularMovement(time: number): void {
    this.aliens.children.entries.forEach((alien: any) => {
      if (!alien.active) return;
      
      const startX = alien.getData('startX');
      const startY = alien.getData('startY');
      const moveTimer = alien.getData('moveTimer') + time * 0.001;
      
      const radius = 60 + Math.sin(moveTimer * 0.02) * 20;
      const angle = moveTimer * 0.03;
      
      alien.x = startX + Math.cos(angle) * radius;
      alien.y = startY + Math.sin(angle) * radius * 0.6;
      
      alien.setData('moveTimer', moveTimer);
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

  getRandomAliveEnemy(): any {
    const activeAliens = this.aliens.children.entries.filter((alien: any) => alien.active);
    if (activeAliens.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * activeAliens.length);
    return activeAliens[randomIndex];
  }

  // Also ADD this method for compatibility with your existing code:
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
  }

}