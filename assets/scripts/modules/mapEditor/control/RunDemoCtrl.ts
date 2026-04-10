import { Node, Size, _decorator } from 'cc';
import { EntityCtrl } from './EntityCtrl';
import { CameraCtrl } from './CameraCtrl';
import { TickMgr } from '../../../../../extensions/cocos-framework/src/mgr/TickMgr';
import PathFindingAgent from '../../road/PathFindingAgent';
import { G } from '../../base/Interface';
import ObstacleEdgeUtils from '../../rvo/ObstacleEdgeUtils';
import { RVOSystem } from '../../rvo/RVOSystem';
import { Vector2 } from '../../rvo/Common';
import Simulator from '../../rvo/Simulator';
import { MapMgr } from '../../base/MapMgr';
import { BaseUT } from '../../../../../extensions/cocos-framework/src/base/BaseUtil';
import { CameraController } from '../../rvo/CameraController';
import { emmiter } from '../../../../../extensions/cocos-framework/src/base/Emmiter';
import { CONST } from '../../base/CONST';
const { ccclass, property } = _decorator;

/**
 * @descripttion 运行模式控制器
 * @author cyk
 * @date 2023-05-30 23:00:00
 */
@ccclass('RunDemoCtrl')
export class RunDemoCtrl {
    private static _inst: RunDemoCtrl;
    public static get inst() {
        if (!this._inst) {
            this._inst = new RunDemoCtrl();
        }
        return this._inst;
    }
    public entity: EntityCtrl;
    public camera: CameraCtrl;
    public cameraController: CameraController;
    public init(mapData: G.MapJsonInfo, grp_scrollMap: Node, grp_entity: Node, mapViewSize: Size) {
        let self = this;
        BaseUT.changeMouseCursor("url('/assets/resources/native/34/341c4534-3c0a-4dd7-adc1-1c235faf3c20.png'),auto");//使用自定义鼠标样式
        MapMgr.inst.isRunningDemoMode = true;
        PathFindingAgent.inst.init(mapData);

        //设置障碍物导航数据
        ObstacleEdgeUtils.instance.clear();
        RVOSystem.instance.refresh();
        let obstacles = ObstacleEdgeUtils.instance.getObstacleEdge().edgeLines;
        for (let len = obstacles.length, i = 0; i < len; i++) {
            let e = obstacles[i], lineVectors = [];
            lineVectors.push(new Vector2(e.startX, e.startY));
            lineVectors.push(new Vector2(e.endX, e.endY));
            Simulator.instance.addObstacle(lineVectors);
        }
        Simulator.instance.processObstacles();
        RVOSystem.instance.startup();

        if (!self.entity) self.entity = new EntityCtrl(grp_entity);
        if (!self.camera) self.camera = new CameraCtrl(grp_scrollMap, mapViewSize);
        self.camera.focusTarget(self.entity.myPlayer.node);
        emmiter.emit(CONST.GEVT.StartRunDemo);
        // if(!self.cameraController) self.cameraController = new CameraController(mapViewSize);
        // self.cameraController.setTarget(self.entity.myPlayer.node);
        // self.cameraController.setViewToPoint(self.entity.myPlayer.node.position.x, self.entity.myPlayer.node.position.y);
        TickMgr.inst.addTick(self.update, self);
    }

    public update(deltaTime: number) {
        let self = this;
        if(self.entity) self.entity.update(deltaTime);
        if(self.camera) self.camera.update(deltaTime);
        if(self.cameraController) self.cameraController.update(deltaTime);
    }

    public clear() {
        let self = this;
        BaseUT.changeMouseCursor("auto");
        MapMgr.inst.isRunningDemoMode = false;
        TickMgr.inst.rmTick(self.update);
        if(self.camera){
            self.camera.clear();
            self.camera = null;
        }
        if(self.entity){
            self.entity.clear();
            self.entity = null;
        }
        RVOSystem.instance.stop();
        PathFindingAgent.inst.clear();
        ObstacleEdgeUtils.instance.clear();
        Simulator.instance.clear();
        emmiter.emit(CONST.GEVT.StopRunDemo);
    }
}