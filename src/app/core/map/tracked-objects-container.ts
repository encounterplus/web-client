import { Layer } from './layers/layer';
import { DataService } from 'src/app/shared/services/data.service';
import { TrackedObject } from 'src/app/shared/models/tracked-object';
import { TrackedObjectView } from './views/tracked-object-view';
import { AppState } from 'src/app/shared/models/app-state';

export class TrackedObjectsContainer extends Layer {

    trackedObjects: Array<TrackedObject> = []
    views: Array<TrackedObjectView> = []

    constructor(private dataService: DataService, private state: AppState) {
        super();
    }

    update() {
        this.trackedObjects = this.state.trackedObjects || []
    }

    async draw() {
        // this.clear();

        // // objects
        // for (let model of this.trackedObjects) {
        //     let view = new TrackedObjectView(model);
        //     this.addChild(view);
        //     view.draw();

        //     this.views.push(view);
        // }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren()
    }

    trackedObjectViewById(id: number): TrackedObjectView {
        for (let view of this.views) {
            if (view.trackedObject.id == id) {
                return view
            }
        }
        return null
    }
}