import { Component, _decorator } from "cc";
import { NavAgent } from "./NavAgent";
import PathFindingAgent from "../road/PathFindingAgent";
import { ControlMode } from "./ControlMode";
import { RVOSystem } from "./RVOSystem";

const { ccclass, property } = _decorator;
@ccclass("NavPath")
export class NavPath extends Component {
    naving = !1;
    _moveAngle = 0;
    _roadNodeArr = [];
    _nodeIndex = 0;
    _navAgent = null;

    start() { }

    init() { }

    update(t) {
        if (null != this.navAgent && this.navAgent.controlMode == ControlMode.touch && this.naving) {
            if (RVOSystem.instance.runing && this.navAgent.navRVO.isUse && this.navAgent.navRVO.isObstacle)
                return void this.stop();
            if (0 == this.navAgent.moveSpeed)
                return void this.stop();
            var n = this._roadNodeArr[this._nodeIndex]
                , e = n.px - this.navAgent.getX()
                , i = n.py - this.navAgent.getY()
                , a = this.navAgent.moveSpeed * t;
            if (e * e + i * i > a * a) {
                if (0 == this._moveAngle) {
                    this._moveAngle = Math.atan2(i, e);
                    var s = Math.round((-this._moveAngle + Math.PI) / (Math.PI / 4));
                    this.navAgent.direction = s > 5 ? s - 6 : s + 2
                }
                var h = Math.cos(this._moveAngle) * a
                    , g = Math.sin(this._moveAngle) * a;
                RVOSystem.instance.runing && this.navAgent.navRVO.isUse ? (this.navAgent.navRVO.moveSpeed = this.navAgent.moveSpeed,
                    this.navAgent.navRVO.targetPos.x = n.px,
                    this.navAgent.navRVO.targetPos.y = n.py) : (this.navAgent.setX(this.navAgent.getX() + h),
                        this.navAgent.setY(this.navAgent.getY() + g))
            } else
                this.navAgent.walkCompleteOneRoadNode(n),
                    this._moveAngle = 0,
                    this._nodeIndex == this._roadNodeArr.length - 1 ? (this.navAgent.setPos(n.px, n.py),
                        this.stop(),
                        this.navAgent.walkCompleteThePath(n)) : this.walk()
        }
    }

    navTo(t, n) {
        if (null != this.navAgent) {
            var e = PathFindingAgent.inst.seekPath2(this.navAgent.getX(), this.navAgent.getY(), t, n, this.navAgent.radius);
            e.length > 0 && this.walkByRoad(e)
        }
    }

    walkByRoad(t) {
        this._roadNodeArr = t,
            this._nodeIndex = 0,
            this._moveAngle = 0,
            this.walk(),
            this.move()
    }

    walk() {
        this._nodeIndex < this._roadNodeArr.length - 1 && this._nodeIndex++
    }

    move() {
        0 != this._roadNodeArr.length ? (this.naving = !0,
            this._moveAngle = 0,
            null != this.navAgent && this.navAgent.onMove()) : this.stop()
    }

    stop() {
        this.naving = !1,
            null != this.navAgent && (this.navAgent.navRVO.stop(),
                this.navAgent.onStop())
    }

    public get navAgent() {
        return this._navAgent || (this._navAgent = this.node.getComponent(NavAgent)),
            this._navAgent
    }
}