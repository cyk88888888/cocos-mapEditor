import { _decorator } from "cc";
import { NavUnit } from "./NavUnit";
import RoadNode from "../../../road/RoadNode";
const { ccclass } = _decorator;
@ccclass("Actor")
export class Actor extends NavUnit {
    private _lastRoadNode: RoadNode = null;
    update(dt: number) {
        super.update(dt);
        this.updateActorStateByNode()
    }

    public updateActorStateByNode() {
        let roadNode = this.roadNode;
        if (roadNode != this._lastRoadNode) {
            this._lastRoadNode = roadNode;
            switch (roadNode.value) {
                case 2:
                    .4 != this.alpha && (this.alpha = .4);
                    break;
                case 3:
                    this.alpha > 0 && (this.alpha = 0);
                    break;
                default:
                    this.alpha < 1 && (this.alpha = 1)
            }
        }
    }

}