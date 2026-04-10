import { Camera, Component, Node, Size, Vec3, _decorator } from "cc";
import { MapMgr } from "../base/MapMgr";
import { SceneMgr } from "../../../../extensions/cocos-framework/src/mgr/SceneMgr";

const { ccclass, property } = _decorator;
@ccclass("CameraController")
export class CameraController {
    public camera: Camera = null;
    private target:Node = null;
    targetPos = new Vec3(0,0,0);
    private _winSize:Size;
    private _mapParams:{mapWidth:number,mapHeight:number};
    constructor(winSize: Size) {
        this._winSize = winSize;
        this._mapParams = {mapWidth:MapMgr.inst.mapWidth, mapHeight: MapMgr.inst.mapHeight};
        this.camera = SceneMgr.inst.getUCamera().getComponent(Camera);
    }
    update(dt:number) {
        this.followTarget(dt);
    }
    
    getCameraPos() {
        return null == this.camera ? new Vec3(0,0,0) : new Vec3(Math.ceil(this.camera.node.position.x),Math.ceil(this.camera.node.position.y),0)
    }
    
    setTarget(t:Node) {
        this.target = t;
    }
    
    followTarget(t) {
        null != this.target && this.target.isValid && null != this.camera && (this.targetPos = this.target.position.clone().subtract(new Vec3(this.winSize.width / 2,this.winSize.height / 2)),
        this._mapParams.mapWidth < this.winSize.width ? this.targetPos.x = (this._mapParams.mapWidth - this.winSize.width) / 2 : this.targetPos.x > this._mapParams.mapWidth - this.winSize.width ? this.targetPos.x = this._mapParams.mapWidth - this.winSize.width : this.targetPos.x < 0 && (this.targetPos.x = 0),
        this._mapParams.mapHeight < this.winSize.height ? this.targetPos.y = (this._mapParams.mapHeight - this.winSize.height) / 2 : this.targetPos.y > this._mapParams.mapHeight - this.winSize.height ? this.targetPos.y = this._mapParams.mapHeight - this.winSize.height : this.targetPos.y < 0 && (this.targetPos.y = 0),
        this.targetPos.z = this.camera.node.position.z,
        this.targetPos = this.camera.node.position.lerp(this.targetPos, 2 * t),
        this.camera.node.position = this.targetPos)
    }
    
    setViewToPoint(x: number, y: number) {
        this.targetPos = new Vec3(x,y).subtract(new Vec3(this.winSize.width / 2,this.winSize.height / 2)),
        this._mapParams.mapWidth < this.winSize.width ? this.targetPos.x = (this._mapParams.mapWidth - this.winSize.width) / 2 : this.targetPos.x > this._mapParams.mapWidth - this.winSize.width ? this.targetPos.x = this._mapParams.mapWidth - this.winSize.width : this.targetPos.x < 0 && (this.targetPos.x = 0),
        this._mapParams.mapHeight < this.winSize.height ? this.targetPos.y = (this._mapParams.mapHeight - this.winSize.height) / 2 : this.targetPos.y > this._mapParams.mapHeight - this.winSize.height ? this.targetPos.y = this._mapParams.mapHeight - this.winSize.height : this.targetPos.y < 0 && (this.targetPos.y = 0),
        this.targetPos.z = this.camera.node.position.z,
        this.camera.node.position = this.targetPos
    }

    private get winSize(){
        return this._winSize;
    }
}