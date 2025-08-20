import { AssetType } from "./assets";

export class Ship {
  static create(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite {
    const ship = scene.physics.add.sprite(400, 550, AssetType.Ship);
    
    // Make ship 30% smaller (0.7 scale instead of 1.0)
    ship.setScale(0.7);
    
    ship.setCollideWorldBounds(true);
    ship.body.setSize(ship.width * 0.8, ship.height * 0.8); // Adjust hitbox for new size
    
    return ship;
  }
}