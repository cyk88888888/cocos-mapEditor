import { Enum, _decorator, CCInteger } from "cc";
import { Actor } from "./base/Actor";
import { UnitState } from "./base/Unit";
import MovieClip from "../utils/MovieClip";
const { ccclass, property } = _decorator;
export enum PlayerType {
    none = 0,
    my = 1,
    other = 2
}

export enum PlayerControlType {
    none = 0,
    user = 1,
    ai = 2,
    net = 3
}

@ccclass("Player")
export class Player extends Actor {
    @property({ type: Enum(PlayerControlType), tooltip: "玩家控制类型:\nnone  无控制 \nuser 用户操作 \nai ai操作 \nnet 网络玩家操作" })
    public controlType: PlayerControlType;

    public roleId: number = 0;
    public playerType = PlayerType.none;
    protected _state: UnitState = UnitState.none;
    start() {
        super.start();
        this.state = UnitState.idle;
    }

    public set direction(value: number) {
        this._direction = value;
        switch (value) {
            case 0:
                this.movieClip.rowIndex = 0;
                break;
            case 1:
                this.movieClip.rowIndex = 4;
                break;
            case 2:
                this.movieClip.rowIndex = 1;
                break;
            case 3:
                this.movieClip.rowIndex = 6;
                break;
            case 4:
                this.movieClip.rowIndex = 3;
                break;
            case 5:
                this.movieClip.rowIndex = 7;
                break;
            case 6:
                this.movieClip.rowIndex = 2;
                break;
            case 7:
                this.movieClip.rowIndex = 5
        }

    }

    public set state(value: UnitState) {
        if (this._state != value) {
            this._state = value;
            if (this._movieClip) this._movieClip.node.active = false;
            switch (value) {
                case UnitState.idle:
                    this._movieClip = this.idleMovieClip;
                    break;
                case UnitState.walk:
                    this._movieClip = this.walkMovieClip;
                    break;
                case UnitState.attack:
                    this._movieClip = this.attackMovieClip;
                    break;
            }
            this.direction = this._direction;
            this._movieClip.node.active = true;
            this._movieClip.playIndex = 0;
            this._movieClip.playAction();
        }
    }

    public get idleMovieClip() {
        return this.node.getChildByName("Body").getChildByName("Skin_Idle").getComponent(MovieClip);
    }

    public get walkMovieClip() {
        return this.node.getChildByName("Body").getChildByName("Skin_Walk").getComponent(MovieClip);
    }

    public get attackMovieClip() {
        return this.node.getChildByName("Body").getChildByName("Skin_Attack").getComponent(MovieClip);
    }
}

