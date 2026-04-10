import { Vec2, _decorator } from 'cc';
const { ccclass, property } = _decorator;

/**
 * @descripttion 摇杆控制器
 * @author cyk
 * @date 2023-05-30 23:00:00
 */
@ccclass('JoyStickCtrl')
export class JoyStickCtrl {
    /** 当前摇杆弧度*/
    public radian: number;
    /**摇杆是否移动中 */
    public isMoving: boolean;
    /** 当前遥感向量*/
    public joyMoveDir: Vec2;
    private static _inst: JoyStickCtrl;
    public static get inst() {
        if (!this._inst) {
            this._inst = new JoyStickCtrl();
        }
        return this._inst;
    }

    public init() {

    }
}