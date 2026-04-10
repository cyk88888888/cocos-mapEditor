import { Component, Vec3, _decorator } from "cc";
import { NavAgent } from "./NavAgent";
import PathFindingAgent from "../road/PathFindingAgent";
import { ControlMode } from "./ControlMode";
import { RVOSystem } from "./RVOSystem";

const { ccclass } = _decorator;
@ccclass("NavJoystick")
export class NavJoystick extends Component {
    private _navAgent: NavAgent = null
    public targetPos = new Vec3(0, 0, 0);

    public init() { }

    public update(dt: number) {
        if (this.navAgent && this.navAgent.controlMode == ControlMode.joystick) {
            if (RVOSystem.instance.runing && this.navAgent.navRVO.isUse && !this.navAgent.navRVO.isObstacle) {
                this.onJoyStickControll_RVO(dt);
            } else {
                this.onJoyStickControll_Normal(dt);
            }
        }
    }

    private onJoyStickControll_Normal(dt: number) {
        if (this.navAgent.moveDir.x != 0 || this.navAgent.moveDir.y != 0) {
            this.navAgent.setFaceDir(this.navAgent.moveDir);
            let distance = this.navAgent.moveSpeed * dt;
            let toPos = this.navAgent.getPos().clone().add(this.navAgent.moveDir.clone().multiplyScalar(distance));
            let toRoadNode = PathFindingAgent.inst.getRoadNodeByPixel(toPos.x, toPos.y);
            if (toRoadNode) {
                if (toRoadNode.value != 0) {
                    this.targetPos = toPos;
                } else {
                    let roundRoads = PathFindingAgent.inst.getRoundRoadNodes(this.navAgent.roadNode);
                    let tempNode = null;
                    for (let g = 0; g < roundRoads.length; g++) {
                        let roadNode = roundRoads[g];
                        if (roadNode && roadNode.value != 0 && roadNode != toRoadNode) {
                            roadNode.h = 10 * (Math.abs(toRoadNode.cx - roadNode.cx) + Math.abs(toRoadNode.cy - roadNode.cy));
                            if (tempNode) {
                                if (roadNode.h < tempNode.h) {
                                    tempNode = roadNode;
                                } else if (roadNode.h == tempNode.h) {
                                    let curDir = new Vec3(roadNode.px, roadNode.py).subtract(this.navAgent.getPos()).normalize();
                                    let tempDir = new Vec3(tempNode.px, tempNode.py).subtract(this.navAgent.getPos()).normalize();
                                    if(curDir.add(this.navAgent.moveDir).length() > tempDir.add(this.navAgent.moveDir).length()) tempNode = roadNode;
                                }
                            } else {
                                tempNode = roadNode;
                            }
                        }
                    }
                    if (tempNode) {
                        let curDir = new Vec3(toRoadNode.px, toRoadNode.py).subtract(this.navAgent.getPos()).normalize();
                        let tempDir = new Vec3(tempNode.px, tempNode.py).subtract(this.navAgent.getPos()).normalize();
                        curDir.add(this.navAgent.moveDir).length() / 2 > tempDir.add(this.navAgent.moveDir).length() ? this.targetPos = this.navAgent.getPos() : this.targetPos = new Vec3(tempNode.px, tempNode.py);
                    }
                }
            }
            else {
                this.targetPos = this.navAgent.getPos();
            }
            let l = this.targetPos.clone().subtract(this.navAgent.getPos());
            let len = l.length();
            l = l.normalize();
            if (len >= distance) this.targetPos = this.navAgent.getPos().clone().add(l.multiplyScalar(distance));
            this.navAgent.setPosition(this.targetPos);
            this.navAgent.onMove();
        } else {
            this.navAgent.onStop();
        }
    }

    private onJoyStickControll_RVO(dt: number) {
        let self = this;
        let navAgent = self.navAgent;
        let moveDir = navAgent.moveDir;
        let moveSpeed = navAgent.moveSpeed;
        let curPos = navAgent.getPos();
        if (moveDir.x != 0 || moveDir.y != 0) {
            navAgent.setFaceDir(moveDir);
            self.targetPos = curPos.clone().add(moveDir.clone().multiplyScalar(moveSpeed));
            navAgent.onMove();
        } else {
            self.targetPos = curPos;
            navAgent.onStop();
        }
        navAgent.navRVO.moveSpeed = moveSpeed;
        navAgent.navRVO.targetPos.x = self.targetPos.x;
        navAgent.navRVO.targetPos.y = self.targetPos.y;
    }

    public get navAgent() {
        if (!this._navAgent) this._navAgent = this.node.getComponent(NavAgent);
        return this._navAgent;
    }
}