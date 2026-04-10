import {Enum, Node, Vec3, _decorator} from "cc";
import {Unit, UnitState} from "./Unit";
import {ControlMode} from "../../ControlMode";
import MapRoadUtils from "../../../road/MapRoadUtils";
import {NavAgent} from "../../NavAgent";

const {ccclass, property} = _decorator;

@ccclass("NavUnit")
export class NavUnit extends Unit {
    @property({type: Enum(ControlMode), tooltip: "控制模式:\ntouch  点击行走 \njoystick 摇杆操作"})
    public ctrMode: ControlMode = ControlMode.joystick;

    public _navAgent: NavAgent = null;
    public trackLogic = new TrackLogic();
    public moveDir = new Vec3(0, 0, 0);
    public radius = 10;
    public walkRoadNodeCallback = null;
    public walkCompletePathCallback = null;

    public onLoad() {
        super.onLoad();
        this.navAgent.init();
    }

    public update(dt: number) {
        super.update(dt);
        this.trackLogic.update(dt);
    }

    public initRVO() {
        this.setDefaultRadius();
        this.navAgent.navRVO.initRVO();
    }

    public setDefaultRadius() {
        var radius = Math.min(MapRoadUtils.instance.halfNodeWidth, MapRoadUtils.instance.halfNodeHeight);
        this.radius = radius;//Math.floor(.8 * t);
    }

    public navTo(x: number, y: number) {
        this.trackLogic.target && this.trackLogic.stopTrack();
        this.navAgent.navTo(x, y);
    }

    public trackTarget(target: Node, arriveTargetCallback: Function, stopTrackCallback: Function, notTrackDist: number = 3, notSeakDist: number = 3) {
        this.trackLogic.target && this.trackLogic.target != target && this.trackLogic.stopTrack();
        this.trackLogic.trackTarget(this, target, arriveTargetCallback, stopTrackCallback, notTrackDist, notSeakDist);
    }

    public stopTrack() {
        this.trackLogic.stopTrack();
    }

    public onMove() {
        this.state = UnitState.walk;
    }

    public onStop() {
        this.state = UnitState.idle;
    }

    public walkCompleteOneRoadNode() {
        this.walkRoadNodeCallback && this.walkRoadNodeCallback();
    }

    public walkCompleteThePath() {
        this.walkCompletePathCallback && this.walkCompletePathCallback();
    }

    public destroySelf() {
        this.navAgent.navRVO.destroySelf();
        super.destroySelf();
    }

    public get controlMode() {
        return this.ctrMode;
    }

    public set controlMode(value: ControlMode) {
        this.ctrMode = value;
    }

    public get navAgent() {
        if (!this._navAgent) this._navAgent = this.node.getComponent(NavAgent) || this.node.addComponent(NavAgent);
        return this._navAgent;
    }
}

export class TrackLogic {
    public navUnit: NavUnit;
    public target: Node;
    public arriveTargetCallback: Function;
    public stopTrackCallback: Function;
    public lockedArrive: boolean = false;
    public lastTrackPos: Vec3 = new Vec3(0, 0, 0);
    public notTrackDist: number = 3;
    public notSeakDist: number = 3;

    public trackTarget(navUnit: NavUnit, target: Node, arriveTargetCallback: Function, stopTrackCallback: Function, notTrackDist: number = 3, notSeakDist: number = 3) {
        if (navUnit && target) {
            this.target != target && (this.lastTrackPos = new Vec3(0, 0, 0));
            this.navUnit = navUnit;
            this.target = target;
            this.arriveTargetCallback = arriveTargetCallback;
            this.stopTrackCallback = stopTrackCallback;
            this.notTrackDist = notTrackDist;
            this.notSeakDist = notSeakDist;
            this.lockedArrive = false;
        }
    }

    public stopTrack() {
        this.arriveTargetCallback = null;
        if (this.stopTrackCallback) {
            this.stopTrackCallback(this.target);
            this.stopTrackCallback = null;
        }
        this.target = null;
    }

    public isNeedTrack() {
        let mRoadNode = MapRoadUtils.instance.getWorldPointByPixel(this.navUnit.node.position.x, this.navUnit.node.position.y)
        let tRoadNode = MapRoadUtils.instance.getWorldPointByPixel(this.target.position.x, this.target.position.y);
        return !(Math.abs(mRoadNode.x - tRoadNode.x) + Math.abs(mRoadNode.y - tRoadNode.y) < this.notTrackDist);
    }

    public isNeedSeekRoad() {
        if (!this.target) return false;
        let tRoadNode = MapRoadUtils.instance.getWorldPointByPixel(this.target.position.x, this.target.position.y)
        let lRoadNode = MapRoadUtils.instance.getWorldPointByPixel(this.lastTrackPos.x, this.lastTrackPos.y);
        return !(Math.abs(tRoadNode.x - lRoadNode.x) + Math.abs(tRoadNode.y - lRoadNode.y) < this.notSeakDist);
    }

    public trackTo(x: number, y: number) {
        if (this.navUnit) {
            this.lastTrackPos.x = x;
            this.lastTrackPos.y = y;
            this.navUnit.navAgent.navTo(x, y);
        }
    }

    public update(dt: number) {
        if (this.navUnit && this.target) {
            if (!this.isNeedTrack()) {
                this.navUnit.navAgent.navPath.stop();
                this.navUnit.lookAtTarget(this.target);
                if (!this.lockedArrive) {
                    this.lockedArrive = true;
                    if (this.arriveTargetCallback) this.arriveTargetCallback(this.target);
                }
                return;
            }
            this.lockedArrive = false;
            this.navUnit.navAgent.navPath.naving ? this.isNeedSeekRoad() && this.trackTo(this.target.position.x, this.target.position.y) : this.trackTo(this.target.position.x, this.target.position.y);
        }
    }
}