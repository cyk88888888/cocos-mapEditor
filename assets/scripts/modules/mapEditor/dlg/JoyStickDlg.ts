import { _decorator, Button, EventMouse, EventTouch, Label, Node, UITransform, Vec2, Vec3 } from 'cc';
import { JoyStickCtrl } from '../control/JoyStickCtrl';
import { UIDlg } from '../../../../../extensions/cocos-framework/src/ui/UIDlg';
import { RunDemoCtrl } from '../control/RunDemoCtrl';
import { CONST } from '../../base/CONST';
const { ccclass, property } = _decorator;

@ccclass('JoyStickDlg')
export class JoyStickDlg extends UIDlg {
    /** 预制体路径 */
    public static prefabUrl: string = 'prefab/mapEditor/dlg/JoyStickDlg';

    @property({ type: Node })
    private grp_joyStick: Node;
    @property({ type: Node })
    private grp_touchArea: Node;
    @property({ type: Node })
    private joyStick: Node;
    @property({ type: Button })
    private btn_chgRole: Button;
    @property({ type: Button })
    private btn_fogOfWar: Button;
    @property({ type: Label })
    private lbl_fogOfWar: Label;
    /**半径 */
    private radius: number;
    private _touchStartPos: Vec2;
    private _initPos: Vec3;
    /** 当前遥感向量*/
    public joyMoveDir: Vec2;
    private _joyStickCtrl: JoyStickCtrl;
    private _isOpenFogOfWar: boolean = false;
    protected ctor(): void {
        let self = this;
        self.outSideClosed = false;
        self.maskEnabled = false;
        self.penetrable = true;
        self.showWithAni = false;
        self.radius = 18;
        self.joyMoveDir = new Vec2(0, 0);
        self._joyStickCtrl = JoyStickCtrl.inst;
        self._isOpenFogOfWar = true;
        self.lbl_fogOfWar.string = "关闭战争迷雾";
    }

    protected onEnter(): void {
        let self = this;
        self.grp_touchArea.on(Node.EventType.TOUCH_START, self.onMouseDown, self);
        self.grp_touchArea.on(Node.EventType.TOUCH_END, self.onMouseUp, self);
        self.grp_touchArea.on(Node.EventType.TOUCH_CANCEL, self.onMouseUp, self);
        self._initPos = new Vec3(self.grp_joyStick.position.x, self.grp_joyStick.position.y);
    }

    protected update(deltaTime: number): void {
        super.update(deltaTime);
        let runDemoCtrl = RunDemoCtrl.inst;
        if (runDemoCtrl.entity.isCanControlPlayer) {
            let myPlayer = runDemoCtrl.entity.myPlayer;
            myPlayer.moveDir.x = this.joyMoveDir.x;
            myPlayer.moveDir.y = this.joyMoveDir.y;
        }
    }

    private onMouseDown(e: EventTouch) {
        let self = this;
        self._touchStartPos = e.getUILocation();
        self.grp_joyStick.setPosition(self._touchStartPos.x, self._touchStartPos.y);
        self.grp_touchArea.on(Node.EventType.TOUCH_MOVE, self.onMouseMove, self);
        self.joyStick.setPosition(new Vec3(0, 0, 0));
    }

    private onMouseMove(e: EventTouch) {
        let self = this;
        let moveUIPos = e.getUILocation();
        let touchStartPos = self._touchStartPos;
        let distance = Vec2.distance(moveUIPos, touchStartPos);
        if (distance == 0) return;
        let radian = Math.atan2(moveUIPos.y - touchStartPos.y, moveUIPos.x - touchStartPos.x);
        if (distance > self.radius) distance = self.radius;
        let toX = distance * Math.cos(radian);
        let toY = distance * Math.sin(radian);
        self.joyStick.setPosition(new Vec3(toX, toY, 0));
        self._joyStickCtrl.isMoving = true;
        self._joyStickCtrl.radian = radian;
        self._joyStickCtrl.joyMoveDir = self.joyMoveDir = moveUIPos.subtract(touchStartPos).normalize();
    }

    private onMouseUp(e: EventTouch) {
        let self = this;
        this.grp_touchArea.off(Node.EventType.TOUCH_MOVE, this.onMouseMove, this);
        self.grp_joyStick.setPosition(self._initPos);
        self.joyStick.setPosition(new Vec3(0, 0, 0));
        self._joyStickCtrl.isMoving = false;
        self._joyStickCtrl.radian = undefined;
        self.joyMoveDir.x = 0;
        self.joyMoveDir.y = 0;
    }

    /** 测试运行 */
    private _tap_btn_chgRole() {
        this.emit(CONST.GEVT.ChgRole);
    }

    /**开启/关闭战争迷雾*/
    private _tap_btn_fogOfWar() {
        this._isOpenFogOfWar = !this._isOpenFogOfWar;
        this.lbl_fogOfWar.string = this._isOpenFogOfWar ? "关闭战争迷雾" : "开启战争迷雾";
        this.emit(CONST.GEVT.FogOfWarActiveStatus, this._isOpenFogOfWar);
    }

    protected onExit(): void {
        let self = this;
        self.grp_touchArea.off(Node.EventType.TOUCH_START, self.onMouseDown, self);
        self.grp_touchArea.off(Node.EventType.TOUCH_END, self.onMouseUp, self);
        self.grp_touchArea.off(Node.EventType.TOUCH_CANCEL, self.onMouseUp, self);
        self._joyStickCtrl.isMoving = false;
        self._joyStickCtrl.radian = undefined;
    }

}


