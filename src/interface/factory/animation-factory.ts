import { AssetType } from "../assets";

export enum AnimationType {
    Fly = "fly",
    Kaboom = "kaboom",
    ShipIdle = "ship-idle",
    ShipThrust = "ship-thrust"
}

export class AnimationFactory {
    constructor(private _scene: Phaser.Scene) {
        this._init();
    }

    private _init() {
        // Existing alien animation
        this._scene.anims.create({
            key: AnimationType.Fly,
            frames: this._scene.anims.generateFrameNumbers(AssetType.Alien, {
                start: 0,
                end: 3
            }),
            frameRate: 20,
            repeat: -1
        });

        // Existing explosion animation
        this._scene.anims.create({
            key: AnimationType.Kaboom,
            frames: this._scene.anims.generateFrameNumbers(AssetType.Kaboom, {
                start: 0,
                end: 15
            }),
            frameRate: 24,
            repeat: 0,
            hideOnComplete: true
        });

        // NEW: Ship idle animation (cycle through frames 0 and 1 - left two frames)
        this._scene.anims.create({
            key: AnimationType.ShipIdle,
            frames: this._scene.anims.generateFrameNumbers(AssetType.Ship, {
                start: 0,
                end: 1
            }),
            frameRate: 8,  // Adjust speed of idle animation
            repeat: -1     // Loop forever
        });

        // NEW: Ship thrust animation (frame 2 - rightmost frame)
        this._scene.anims.create({
            key: AnimationType.ShipThrust,
            frames: [{ key: AssetType.Ship, frame: 2 }],
            frameRate: 1
        });
    }
}