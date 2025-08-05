import { AssetType } from "./assets";
import { AnimationType } from "./factory/animation-factory";

export class Ship {
    static create(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite {
        let ship = scene.physics.add.sprite(400, 500, AssetType.Ship);
        ship.setCollideWorldBounds(true);
        
        // Start with idle animation
        ship.play(AnimationType.ShipIdle);
        
        return ship;
    }
}