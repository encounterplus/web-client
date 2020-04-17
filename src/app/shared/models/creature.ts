import { Vision } from './vision';

export class Creature {
    id: string;
    uid: string;
    type: string;
    name: string;
    rank: number;
    initiative: number;
    health: number;
    hitpoints: number;
    bloodied: boolean;
    dead: boolean;
    image: string;
    token: string;
    mapId: string;
    scale: number;
    x: number;
    y: number;
    cachedToken: string;
    vision: Vision;
}
