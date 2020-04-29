import { Asset } from './asset';
import { Component } from './component';

export class Aura {
    id: string;
    enabled: boolean;
    name: string;
    color: string;
    opacity: number;
    radius: number;
    asset: Asset;
    components: Array<Component> = [];
}