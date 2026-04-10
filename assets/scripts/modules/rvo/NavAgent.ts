import {Component, Enum, Vec3, _decorator} from "cc";
import {ControlMode} from "./ControlMode";
import {NavUnit} from "./entity/base/NavUnit";
import PathFindingAgent from "../road/PathFindingAgent";
import {NavPath} from "./NavPath";
import {NavRVO} from "./NavRVO";
import {NavJoystick} from "./NavJoystick";

const {ccclass, property} = _decorator;

@ccclass("NavAgent")
export class NavAgent extends Component {
    @property({type: Enum(ControlMode), tooltip: "控制模式:\ntouch  点击行走 \njoystick 摇杆操作"})
    public ctrMode: ControlMode = ControlMode.joystick;
    private _navUnit: NavUnit = null;
    private _joystick: NavJoystick = null;
    private _navPath: NavPath = null;
    private _navRVO: NavRVO = null;
    private _direction = 0;
    private _moveSpeed = 100;
    private _moveDir = new Vec3(0, 0, 0);
    private _radius = 25;
    private isInit = !1;

    onLoad() {
        this.init();
    }

    public init() {
        if (!this.isInit) {
            this.isInit = true;
            if (!this._navUnit) this._navUnit = this.node.getComponent(NavUnit);
            this.joystick.init();
            this.navPath.init();
            this.navRVO.init();
        }
    }

    public setPosition(postion: Vec3) {
        this.navUnit ? this.navUnit.node.position = postion : this.node.position = postion;
    }

    public setPos(x: number, y: number, z: number = 0) {
        this.navUnit ? this.navUnit.node.position = new Vec3(x, y, z) : this.node.position = new Vec3(x, y, z);
    }

    public getPos() {
        return this.navUnit ? this.navUnit.node.position : this.node.position;
    }

    public setX(x: number) {
        let position: Vec3;
        if (this.navUnit) {
            position = this.navUnit.node.position;
            this.navUnit.node.setPosition(x, position.y, position.z);
        } else {
            position = this.node.position;
            this.node.setPosition(x, position.y, position.z);
        }
    }

    public getX() {
        return this.navUnit ? this.navUnit.node.position.x : this.node.position.x;
    }

    public setY(y: number) {
        let position: Vec3;
        if (this.navUnit) {
            position = this.navUnit.node.position;
            this.navUnit.node.setPosition(position.x, y, position.z);
        } else {
            position = this.node.position;
            this.node.setPosition(position.x, y, position.z);
        }
    }

    public getY() {
        return this.navUnit ? this.navUnit.node.position.y : this.node.position.y;
    }

    public setZ(z: number) {
        let position: Vec3;
        if (this.navUnit) {
            position = this.navUnit.node.position;
            this.navUnit.node.setPosition(position.x, position.y, z);
        } else {
            position = this.node.position;
            this.node.setPosition(position.x, position.y, z);
        }
    }

    public getZ() {
        return this.navUnit ? this.navUnit.node.position.z : this.node.position.z;
    }

    public navTo(x: number, y: number) {
        this.navPath.navTo(x, y);
    }

    public setMoveDir(x: number, y: number, z: number = 0) {
        this.moveDir.x = x;
        this.moveDir.y = y;
        this.moveDir.z = z;
    }

    public onMove() {
        if (this.navUnit) this.navUnit.onMove();
    }

    public onStop() {
        if (this.navUnit) this.navUnit.onStop();
    }

    public setFaceDir(moveDir: Vec3) {
        if (this.navUnit) this.navUnit.setFaceDir(moveDir);
    }

    public walkCompleteOneRoadNode(n) {
        if (this.navUnit) this.navUnit.walkCompleteOneRoadNode();
    }

    public walkCompleteThePath(n) {
        if (this.navUnit) this.navUnit.walkCompleteThePath();
    }

    public get navUnit(): NavUnit {
        return this._navUnit;
    }

    public get controlMode() {
        return this.navUnit ? this.navUnit.controlMode : this.ctrMode;
    }

    public set controlMode(value: ControlMode) {
        if (this.navUnit) this.navUnit.controlMode = value;
        this.ctrMode = value;
    }

    public get joystick() {
        if (!this._joystick) this._joystick = this.node.getComponent(NavJoystick) || this.node.addComponent(NavJoystick);
        return this._joystick;
    }

    public get navPath() {
        if (!this._navPath) this._navPath = this.node.getComponent(NavPath) || this.node.addComponent(NavPath);
        return this._navPath;
    }

    public get navRVO() {
        if (!this._navRVO) this._navRVO = this.node.getComponent(NavRVO) || this.node.addComponent(NavRVO);
        return this._navRVO;
    }

    public get roadNode() {
        return PathFindingAgent.inst.getRoadNodeByPixel(this.getX(), this.getY());
    }


    public get direction() {
        return this.navUnit ? this.navUnit.direction : this._direction;
    }

    public set direction(dir: number) {
        if (this.navUnit) this.navUnit.direction = dir;
        this._direction = dir;
    }

    public get moveSpeed() {
        return this.navUnit ? this.navUnit.moveSpeed : this._moveSpeed;
    }

    public set moveSpeed(speed: number) {
        if(this.navUnit) this.navUnit.moveSpeed = speed;
        this._moveSpeed = speed;
    }

    public get moveDir() {
        return this.navUnit ? this.navUnit.moveDir : this._moveDir;
    }

    public set moveDir(dir: Vec3) {
        if(this.navUnit) this.navUnit.moveDir = dir;
        this._moveDir = dir;
    }

    public get radius() {
        return this.navUnit ? this.navUnit.radius : this._radius;
    }

    public set radius(radius: number) {
        if( this.navUnit) this.navUnit.radius = radius;
        this._radius = radius;
    }
}