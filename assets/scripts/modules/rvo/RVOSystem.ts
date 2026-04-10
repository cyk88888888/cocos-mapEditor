import { Component, Node, _decorator, director } from "cc";
import Simulator from "./Simulator";
const { ccclass, property } = _decorator;
@ccclass('RVOSystem')
export class RVOSystem extends Component {
    private static _instance: RVOSystem;
    public static get instance(): RVOSystem {
        if (this._instance == null) {
            let node = new Node('RVOSystem');
            director.addPersistRootNode(node);
            this._instance = node.addComponent(RVOSystem);
            this._instance.init();
        }
        return this._instance;
    }

    public rvoTag: number = 0;
    public runing: boolean = false;
    public init() { }
    public startup() {
        console.log("RVOSystem 启动RVO系统");
        this.runing = true;
    }

    public stop() {
        console.log("RVOSystem 停止RVO系统");
        this.runing = false;
    }

    public refresh() {
        this.rvoTag++;
        Simulator.instance.clear();
    }

    public start() { }

    public update(dtTime: number) {
        this.runing && Simulator.instance.run(dtTime);
    }
}