import { Screen } from './screen'
import { Grid } from 'src/app/core/map/models/grid'
import { Game } from './game'
import { Map} from './map'
import { Creature, CreatureType } from './creature'
import { Message } from './message'
import { SquareGrid } from 'src/app/core/map/models/square-grid'
import { TrackedObject } from './tracked-object'

export class AppState {
    map?: Map
    game: Game = new Game()
    screen: Screen = new Screen()
    messages: Array<Message> = []
    trackedObjects: Array<TrackedObject> = []
    grid: Grid = new SquareGrid()
    isDirty: boolean = false
    version: string
    build: number
    readCount: number

    get activeCreatures(): Array<Creature> {
        return this.game.creatures.filter( creature => { return creature.initiative != -10 } ).sort((a, b) => (a.rank > b.rank) ? 1 : -1)
    }
    
    get turned(): Creature {
        return (this.game.creatures.length > 0 && this.game.creatures.length >= this.game.turn ) ? this.activeCreatures[this.game.turn - 1] : null
    }
    
    get turnedId(): string {
        return this.turned != null && this.turned.id != null ? this.turned.id : "";
    }
}
