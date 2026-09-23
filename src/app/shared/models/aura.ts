import { Asset } from './asset';

export interface Aura {
    id: string;
    enabled: boolean;
    name?: string;
    color: string;
    opacity: number;
    radius: number;
    asset?: Asset;
}