import { CCFloat, CCInteger, Label, Node, Vec2, Vec3, _decorator } from "cc";
import { Behaviour } from "./Behaviour";
import MovieClip from "../../utils/MovieClip";
import PathFindingAgent from "../../../road/PathFindingAgent";
import { FogOfWar } from "../../utils/FogOfWar";
const { ccclass, property } = _decorator;

export enum UnitState {
    none = 0,
    idle = 1,
    walk = 2,
    attack = 3,
    death = 4
}
@ccclass("Unit")
export class Unit extends Behaviour {
    @property({ type: Label })
    public nameTxt: Label;
    @property({ type: CCInteger })
    public id: number = 0;
    @property({ type: CCInteger })
    public type: number = 0;
    @property({ type: CCFloat })
    public moveSpeed: number = 200;
    @property({ type: CCFloat })
    public hp: number = 100;
    @property({ type: CCFloat })
    public mp: number = 100; 

    protected _movieClip: MovieClip = null;
    protected _direction: number;
    protected _state = UnitState.none;
    private _objName = ""
    private _lastPos: Vec3 = null;
    private _mapPos: Vec3 = null;

    start() {
        this.state = UnitState.idle;
    }

    update(dt: number) {
        let self = this;
        let mapPos = self.mapPos;
        if (!self._lastPos || Math.abs(mapPos.x - self._lastPos.x) > 1 || Math.abs(mapPos.y - self._lastPos.y) > 1) {
            if (!this._lastPos) this._lastPos = new Vec3();
            this._lastPos.x = mapPos.x;
            this._lastPos.y = mapPos.y;
            this.onPosChange();
        }
    }

    /** 位置变更时*/
    onPosChange() {
        if(FogOfWar.instance){//更新战争迷雾
            // FogOfWar.instance.drawOval(this.x, this.y + 35, 80, 120);
            FogOfWar.instance.drawCircle(this.x, this.y + 35, 120);
        }
    }

    rotateToPos(x: number, y: number) {
        let offX = x - this.node.position.x;
        let offY = y - this.node.position.y;
        let radian = Math.atan2(offY, offX);
        let dir = Math.round((-radian + Math.PI) / (Math.PI / 4));
        this.direction = dir > 5 ? dir - 6 : dir + 2;
    }

    setFaceDir(moveDir: Vec3) {
        let radian = Math.atan2(moveDir.y, moveDir.x), dir = Math.round((-radian + Math.PI) / (Math.PI / 4));
        this.direction = dir > 5 ? dir - 6 : dir + 2;
    }

    lookAtTarget(target: Node) {
        let moveDir = target.position.clone().subtract(this.node.position);
        this.setFaceDir(moveDir);
    }

    getRoundRoadNodes() {
        return PathFindingAgent.inst.getRoundRoadNodes(this.roadNode)
    }

    destroySelf() {
        this.node.destroy();
    }

    public get movieClip() {
        if (!this._movieClip) this._movieClip = this.node.getComponentInChildren(MovieClip);
        return this._movieClip;
    }

    public get direction() {
        return this._direction;
    }
    public set direction(value: number) {
        this._direction = value;
    }

    public get state() {
        return this._state;
    }
    public set state(value: UnitState) {
        this._state = value;
    }

    public get objName() {
        return this._objName;
    }

    public set objName(name: string) {
        let self = this;
        self._objName = name;
        if (!self.nameTxt) self.nameTxt = self.node.getChildByName("NameTxt")?.getComponent(Label) ?? null;
        if (self.nameTxt) self.nameTxt.string = self._objName;
    }

    public get roadNode() {
        return PathFindingAgent.inst.getRoadNodeByPixel(this.node.position.x, this.node.position.y);
    }

    public get mapPos() {
        if(!this._mapPos) this._mapPos = this.node.position.clone();
        this._mapPos.x = Math.floor(this.node.position.x);
        this._mapPos.y = Math.floor(this.node.position.y);
        return this._mapPos;
    }
}