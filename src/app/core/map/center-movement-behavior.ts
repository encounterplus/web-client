import { Emitter, EmitterBehavior, InitBehavior, UpdateBehavior, BaseParticleData, IEmitterParticle, BehaviorOrder } from 'pixi-particle-system';

export type CenterMovementConfig = {
    /** Target center point in container-local space. Defaults to {x: 0, y: 0}. */
    center?: { x: number; y: number };
    /**
     * Relative speed at the start of the particle's life. Defaults to 1.
     * Use a high value relative to endSpeed for particles that rush toward
     * center and decelerate. Use a low value for particles that accelerate.
     */
    startSpeed?: number;
    /**
     * Relative speed at the end of the particle's life. Defaults to 1.
     * Together with startSpeed, defines a quadratic speed curve that is
     * integrated to produce smooth eased movement.
     */
    endSpeed?: number;
    /**
     * Fraction of the total distance to center that the particle will travel
     * over its lifetime. 1.0 means it reaches the center, 0.0 means it does
     * not move. Defaults to 1. Use values like 0.1–0.3 to keep particles
     * drifting slowly without reaching the center.
     */
    distance?: number;
    /**
     * Random lateral deviation applied to each particle's direction at spawn,
     * as a fraction of the total displacement (0–1). 0.2 = up to ±20% sideways
     * drift, giving each particle a unique slightly-angled path toward center.
     * Defaults to 0 (straight line).
     */
    directionJitter?: number;
};

/**
 * Custom behavior that moves particles from their spawn location to a target
 * center point over their lifetime. Position is linearly interpolated between
 * the spawn point and the center based on the particle's age percent.
 *
 * Uses `accelerationX/Y` to store the spawn position and `directionVectorX/Y`
 * to store the displacement toward the center, so this behavior should not be
 * combined with MovementBehavior.
 */
export class CenterMovementBehavior<
    DataType extends BaseParticleData = BaseParticleData,
    ParticleType extends IEmitterParticle<DataType> = IEmitterParticle<DataType>
> extends EmitterBehavior<CenterMovementConfig, DataType, ParticleType>
    implements InitBehavior<DataType, ParticleType>, UpdateBehavior<DataType, ParticleType> {

    private _centerX = 0;
    private _centerY = 0;
    private _startSpeed = 1;
    private _endSpeed = 1;
    private _distance = 1;
    private _directionJitter = 0;
    private _active = false;

    constructor(emitter: Emitter<DataType, ParticleType>) {
        super(emitter);
    }

    get updateOrder(): BehaviorOrder {
        return 'late';
    }

    override applyConfig(config: CenterMovementConfig): void {
        this._centerX = config.center?.x ?? 0;
        this._centerY = config.center?.y ?? 0;
        this._startSpeed = config.startSpeed ?? 1;
        this._endSpeed = config.endSpeed ?? 1;
        this._distance = config.distance ?? 1;
        this._directionJitter = config.directionJitter ?? 0;
        this._active = true;
    }

    getConfig(): CenterMovementConfig | undefined {
        if (!this._active) return undefined;
        return { center: { x: this._centerX, y: this._centerY }, startSpeed: this._startSpeed, endSpeed: this._endSpeed, distance: this._distance, directionJitter: this._directionJitter };
    }

    protected reset(): void {
        this._centerX = 0;
        this._centerY = 0;
        this._startSpeed = 1;
        this._endSpeed = 1;
        this._distance = 1;
        this._directionJitter = 0;
        this._active = false;
    }

    /** Called once when the particle is spawned. Stores its initial position. */
    init(particle: ParticleType): void {
        // Repurpose accelerationX/Y as start position storage
        particle.data.accelerationX = particle.x;
        particle.data.accelerationY = particle.y;

        let dx = (this._centerX - particle.x) * this._distance;
        let dy = (this._centerY - particle.y) * this._distance;

        // Rotate displacement by a random angle scaled by directionJitter.
        // maxAngle = asin(jitter) so the lateral deviation is jitter * distance.
        if (this._directionJitter > 0) {
            const maxAngle = Math.asin(Math.min(this._directionJitter, 1));
            const angle = (Math.random() * 2 - 1) * maxAngle;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;
            dx = rotatedX;
            dy = rotatedY;
        }

        // Repurpose directionVectorX/Y as the (possibly rotated) displacement
        particle.data.directionVectorX = dx;
        particle.data.directionVectorY = dy;
    }

    /** Called every tick. Lerps particle position from spawn to center with eased speed. */
    update(particle: ParticleType, _deltaTime: number): void {
        const t = particle.data.agePercent;
        // Integrate a linear speed ramp: speed(t) = startSpeed + (endSpeed - startSpeed) * t
        // Normalized so that the integral over [0,1] equals 1 (full travel to center).
        const denom = (this._startSpeed + this._endSpeed) / 2;
        const easedT = denom === 0 ? 0 : (this._startSpeed * t + (this._endSpeed - this._startSpeed) * t * t / 2) / denom;
        particle.x = particle.data.accelerationX + particle.data.directionVectorX * easedT;
        particle.y = particle.data.accelerationY + particle.data.directionVectorY * easedT;
    }
}
