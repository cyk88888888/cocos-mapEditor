import { Component, _decorator } from "cc";
import { Player } from "../Player";
const { ccclass, property } = _decorator;
@ccclass("Body")
export class Body extends Component {
    public player:Player;
    onLoad() {
        this.player = this.node.parent.getComponent(Player);
    }
}