import { Component, Vec3, _decorator } from "cc";
import { NavAgent } from "./NavAgent";
import Simulator from "./Simulator";
import { RVOMath, Vector2 } from "./Common";
import { RVOSystem } from "./RVOSystem";
import { ControlMode } from "./ControlMode";

const { ccclass } = _decorator;
@ccclass("NavRVO")
export class NavRVO extends Component {
    private _navAgent: NavAgent = null;
    public rvoTag = 0;
    public rvoAgentId = -1;
    public targetPos = new Vector2(0, 0);
    public moveSpeed = 200;
    public isUse = false;
    private _isObstacle = false;
    public isDestroy = false;

    private _simulator: Simulator;
    init() {
        this._simulator = Simulator.instance;
    }

    initRVO() {
        let self = this;
        if (self.rvoAgentId != -1) self._simulator.removeAgent(this.rvoAgentId);
        this.rvoTag = RVOSystem.instance.rvoTag;
        self._simulator.setAgentDefaults(80, 10, 100, .01, this.navAgent.radius, this.navAgent.moveSpeed, new Vector2(0, 0));
        let pos = new Vector2(this.node.position.x, this.node.position.y), agentId = self._simulator.addAgent(pos);
        this.rvoAgentId = agentId;
        this.targetPos = pos;
        this.isUse = true;
        this.isObstacle = this.isObstacle;
    }

    removeRVO() {
        let self = this;
        if (this.rvoAgentId != -1) self._simulator.removeAgent(this.rvoAgentId);
        this.rvoAgentId = -1;
        this.targetPos = new Vector2(0, 0);
        this.isUse = false;
    }

    update(dt: number) {
        let self = this;
        let navAgent = self.navAgent;
        // let moveDir = navAgent.moveDir;
        // if (moveDir.x != 0 || moveDir.y != 0) {
        //     if (self._simulator.hasAgent(this.rvoAgentId)) {
        //         this.targetPos && this.setPreferredVelocities(dt);
        //         let pos = self._simulator.getAgentPosition(this.rvoAgentId);
        //         navAgent.setX(pos.x);
        //         navAgent.setY(pos.y);
        //     }
        // } else {
        //     let curPos = navAgent.getPos();
        //     navAgent.setX(curPos.x);
        //     navAgent.setY(curPos.y);
        // }

        if (self._simulator.hasAgent(this.rvoAgentId)) {
            this.targetPos && this.setPreferredVelocities(dt);
            let pos = self._simulator.getAgentPosition(this.rvoAgentId);
            navAgent.setX(pos.x);
            navAgent.setY(pos.y);
        }
    }

    private setPreferredVelocities(dt: number) {
        let self = this;
        if (!this.isObstacle) {
            let e = this.targetPos.minus(self._simulator.getAgentPosition(this.rvoAgentId));
            let sqrt = RVOMath.absSq(e);
            let dist = this.navAgent.moveSpeed * dt;
            let moveSpeed = this.moveSpeed;
            if (sqrt < dist * dist) moveSpeed = this.lerp(0, Math.sqrt(sqrt), .5);
            if (RVOMath.absSq(e) > 1) e = RVOMath.normalize(e).scale(moveSpeed);
            self._simulator.setAgentPrefVelocity(this.rvoAgentId, e);
            let radian = 2 * Math.random() * Math.PI, scale = 1 * Math.random();
            self._simulator.setAgentPrefVelocity(this.rvoAgentId, self._simulator.getAgentPrefVelocity(this.rvoAgentId).plus(new Vector2(Math.cos(radian), Math.sin(radian)).scale(scale)));
        }
    }

    private lerp(t: number, e: number, n: number) {
        n > 1 ? n = 1 : n < 0 && (n = 0);
        return t * (1 - n) + e * n;
    }

    stop() {
        if (this.targetPos) {
            this.targetPos.x = this.navAgent.getX();
            this.targetPos.y = this.navAgent.getY();
        }
    }

    isReachedTargetPos() {
        let self = this;
        return !(RVOMath.absSq(self._simulator.getAgentPosition(this.rvoAgentId).minus(this.targetPos)) > self._simulator.getAgentRadius(this.rvoAgentId) * self._simulator.getAgentRadius(this.rvoAgentId));
    }

    destroySelf() {
        this.isDestroy = true;
        if (this.rvoTag == RVOSystem.instance.rvoTag) this._simulator.removeAgent(this.rvoAgentId);
    }

    onDestroy() {
        if (!this.isDestroy) {
            this.isDestroy = true;
            if (this.rvoTag == RVOSystem.instance.rvoTag) this._simulator.removeAgent(this.rvoAgentId);
        }
    }

    public get navAgent() {
        if (!this._navAgent) this._navAgent = this.node.getComponent(NavAgent);
        return this._navAgent;
    }

    public get isObstacle() {
        return this._isObstacle;
    }
    public set isObstacle(value: boolean) {
        this._isObstacle = value;
        if (this.rvoAgentId != -1) {
            if (this._isObstacle) {
                this._simulator.setAgentMass(this.rvoAgentId, 10);
            } else {
                this._simulator.setAgentMass(this.rvoAgentId, 1);
            }
        }
    }

}
