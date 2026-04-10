import { _decorator, Button, EventMouse, Label, Prefab, profiler, ScrollView, Toggle, Vec2, Vec3 } from 'cc';
import { MapScrollComp } from './comp/MapScrollComp';
import { MapMgr } from '../base/MapMgr';
import { Node } from 'cc';
import { CONST } from '../base/CONST';
import { G } from '../base/Interface';
import { MapThingPropertyComp } from './comp/MapThingPropertyComp';
import { HelpDlg } from './dlg/HelpDlg';
import PathFindingAgent from '../road/PathFindingAgent';
import { JoyStickDlg } from './dlg/JoyStickDlg';
import { RunDemoCtrl } from './control/RunDemoCtrl';
import { TestAstarDlg } from './dlg/TestAstarDlg';
import { UT } from '../base/UT';
import { UILayer } from '../../../../extensions/cocos-framework/src/ui/UILayer';
import { List } from '../../../../extensions/cocos-framework/src/uiComp/List';
import { JuHuaDlg } from '../../../../extensions/cocos-framework/src/ui/JuHuaDlg';
import { ResMgr } from '../../../../extensions/cocos-framework/src/mgr/ResMgr';
import { BaseUT } from '../../../../extensions/cocos-framework/src/base/BaseUtil';
import { MessageTip } from '../../../../extensions/cocos-framework/src/ui/MessageTip';
import MapRoadUtils from '../road/MapRoadUtils';
import { RVOSystem } from '../rvo/RVOSystem';
import ObstacleEdgeUtils from '../rvo/ObstacleEdgeUtils';
import Simulator from '../rvo/Simulator';
import { Vector2 } from '../rvo/Common';
import { FileMgr } from '../../../../extensions/cocos-framework/src/mgr/FileMgr';
const { ccclass, property } = _decorator;

/**
 * @descripttion 编辑器首页
 * @author cyk
 * @date 2023-05-30 23:00:00
 */
@ccclass('MapEditorLayer')
export class MapEditorLayer extends UILayer {
    /** 预制体路径 */
    public static prefabUrl: string = 'prefab/mapEditor/MapEditorLayer';
    @property({ type: Label })
    private lbl_version: Label;
    @property({ type: Label })
    private lbl_pixelPos: Label;
    @property({ type: Label })
    private lbl_gridPos: Label;
    @property({ type: Label })
    private lbl_worldPos: Label;
    @property({ type: Label })
    private lbl_grid: Label;
    @property({ type: Label })
    private lbl_path: Label;
    @property({ type: Label })
    private lbl_ObstacleEdge: Label;
    @property({ type: Label })
    private lbl_mapthing: Label;
    @property({ type: Label })
    private lbl_mapSize: Label;
    @property({ type: Label })
    private lbl_mapScale: Label;
    @property({ type: Label })
    private lbl_runDemo: Label;
    @property({ type: MapScrollComp, tooltip: "编辑器地图滚动组件" })
    private mapScrollComp: MapScrollComp;
    @property({ type: MapThingPropertyComp })
    private mapThingPropertyComp: MapThingPropertyComp;
    @property({ type: Node })
    private grp_editPathSize: Node;
    @property({ type: Node })
    private grp_editPath: Node;
    @property({ type: Node })
    private grp_editMathing: Node;
    @property({ type: List })
    private list_mapThing: List = null;
    @property({ type: List })
    private list_pathSize: List = null;
    @property({ type: List })
    private list_path: List = null;
    @property({ type: Node })
    private grp_dragMapthing: Node = null;
    @property({ type: Prefab })
    private mapThingComp: Prefab = null;

    private mapMgr: MapMgr;
    private _selectIdx: number;
    /**当前拖拽的场景物件 */
    private _mapThingComp: Node;
    private _drawMapThingData: G.DragMapthingInfo;
    /**当前鼠标位置 */
    private _curLocation: Vec2;
    private _listPathDataList: { gridType: CONST.GridType, desc: string }[];
    private _tid: number;
    private mapRoadUtils: MapRoadUtils;
    protected onEnter() {
        let self = this;
        self.mapMgr = MapMgr.inst;
        self.mapRoadUtils = MapRoadUtils.instance;
        self.onEmitter(CONST.GEVT.ImportMapJson, self.onImportMapJson);//导入josn地图数据成功
        self.onEmitter(CONST.GEVT.UpdateMapScale, self.updateMapScale);//地图缩放变更
        self.onEmitter(CONST.GEVT.DragMapThingStart, self.onDragMapThingStart);
        self.lbl_version.string = `version: ${self.mapMgr.version}`;
        self._selectIdx = 1;
        self.list_pathSize.selectedId = 0;
        self.showEditOperate();
    }

    private showEditOperate() {
        let self = this;
        self.grp_editPathSize.active = self._selectIdx == 0;
        self.grp_editPath.active = self._selectIdx == 1;
        self.grp_editMathing.active = self._selectIdx == 2;
        if (self._selectIdx == 1) {
            self.emit(CONST.GEVT.ChangeGridType, { gridType: self.list_path.selectedId != -1 ? self._listPathDataList[self.list_path.selectedId].gridType : CONST.GridType.GridType_none });
        } else if (self._selectIdx == 2) {
            self.emit(CONST.GEVT.ChangeGridType, { gridType: CONST.GridType.GridType_mapThing });
        }
    }

    private async onImportMapJson(data: {mapData: G.MapJsonInfo, thingPram: G.ThingPramInfo}) {
        let self = this;
        let juhuaDlg = await JuHuaDlg.show();
        let scrollView = self.list_mapThing.getComponent(ScrollView);
        scrollView.stopAutoScroll();
        scrollView.scrollToTop();
        self.clearDemo();
        ResMgr.inst.decRefLocalImg();
        self.refreshList("list_mapThing");
        await self.mapScrollComp.onImportMapJson(data);
        self.mapThingPropertyComp.init(data);
        self.mapScrollComp.graphicsObstacleEdge.node.active = false;
        self.lbl_ObstacleEdge.string = "显示路点辅助线";
        juhuaDlg.close();
        self.updateMapInfo();
        self.initEvent();
        //清除上一次导入的地图资源
        await new Promise<void>((resolve, reject) => {
            self.setTimeout(() => {
                ResMgr.inst.relaseAllLocal();
                resolve();
            }, 500);
        })
    }

    /**导入成功后，更新显示地图数据 */
    private updateMapInfo() {
        let self = this;
        self.lbl_mapSize.string = `地图宽高: ${self.mapMgr.mapWidth}, ${self.mapMgr.mapHeight}`;
        self.updateMapScale();
    }

    private updateMapScale() {
        let self = this;
        let scale = self.mapScrollComp.mapScale;
        self.lbl_mapScale.string = `地图缩放比例: ${scale.toFixed(2)}`;
        if (self._mapThingComp) self._mapThingComp.setScale(new Vec3(scale, scale, scale));
    }

    private initEvent() {
        let self = this;
        self.node.on(Node.EventType.MOUSE_DOWN, self.onMouseDown, self);
        self.node.on(Node.EventType.MOUSE_MOVE, self.onMouseMove, self);
        self.mapScrollComp.onMouseMoveHandlerCtx = self;
        self.mapScrollComp.onMouseMoveHandler = self.onMouseMoveHandler;
    }

    private onMouseMoveHandler(localUIPos: Vec3) {
        let self = this;
        let roadNode = self.mapRoadUtils.getNodeByPixel(localUIPos.x, localUIPos.y);
        self.lbl_pixelPos.string = `像素坐标: ${roadNode.px},${roadNode.py}`;
        self.lbl_gridPos.string = `网格坐标: ${roadNode.col},${roadNode.row}`;
        self.lbl_worldPos.string = `世界坐标: ${roadNode.cx},${roadNode.cy}`;
    }

    private _data_list_path() {
        let self = this;
        let rst = [
            { gridType: CONST.GridType.GridType_walk, desc: "行走路点" },
            { gridType: CONST.GridType.GridType_shelter, desc: "半透明路点" },
            { gridType: CONST.GridType.GridType_start, desc: "起始路点" },
            { gridType: CONST.GridType.GridType_WaterVerts, desc: "落水路点" }
        ];
        self._listPathDataList = rst;
        return rst;
    }

    private _data_list_pathSize() {
        let rst = [{ radius: 10, size: 0 }, { radius: 15, size: 1 }, { radius: 20, size: 2 }, { radius: 25, size: 3 }, { radius: 30, size: 4 }, { radius: 35, size: 5 }];
        return rst;
    }

    private _data_list_mapThing() {
        let self = this;
        let rst = [];
        let mapThingUrlMap = self.mapMgr.mapThingUrlMap;
        for (let key in mapThingUrlMap) {
            rst.push({ thingName: key, nativePath: mapThingUrlMap[key] });
        }
        return rst;
    }

    private _select_list_path(data: any, selectedIdx: number, lastSelectedIdx: number) {
        let self = this;
        self.emit(CONST.GEVT.ChangeGridType, { gridType: data.gridType });
    }

    private _select_list_pathSize(data: any, selectedIdx: number, lastSelectedIdx: number) {
        let self = this;
        self.emit(CONST.GEVT.ChangeGridSize, { range: data.size });
    }

    private _select_list_mapThing(data: any, selectedIdx: number, lastSelectedIdx: number) {
        let self = this;
        self.newDragMapThing(data.nativePath);
        self._drawMapThingData = { url: data.nativePath, thingName: data.thingName };
    }

    /**开始拖拽场景已有的物件**/
    private onDragMapThingStart(data: G.DragMapthingInfo) {
        let self = this;
        self.newDragMapThing(data.url);
        self._drawMapThingData = {
            url: data.url,
            thingName: data.thingName,
            taskId: data.taskId,
            groupId: data.groupId,
            type: data.type,
            groupIdStr: data.groupIdStr
        };
    }

    private newDragMapThing(url: string) {
        let self = this;
        self.mapMgr.isForbidDrawGrid = true;
        self.disposeDragMapThing();
        let mapthingComp = self._mapThingComp = self.mapMgr.getMapThingComp(self.mapThingComp, url);
        let scale = self.mapScrollComp.mapScale;
        let mousePos = BaseUT.getMousePos(self._curLocation);//这里不直接取evt.getLocation()，再封装一层是因为舞台缩放，会影响evt.getLocation()的坐标）
        mapthingComp.setPosition(mousePos.x, mousePos.y);
        mapthingComp.setParent(self.grp_dragMapthing);
        mapthingComp.setScale(new Vec3(scale, scale, scale));
    }

    private disposeDragMapThing() {
        let self = this;
        if (self._mapThingComp) {
            self._mapThingComp.destroy();
            self._mapThingComp = null;
        }
        self._drawMapThingData = null;
    }

    private onMouseDown(e: EventMouse) {
        let self = this;
        self._curLocation = e.getLocation();
        let buttonId = e.getButton();
        if (buttonId == EventMouse.BUTTON_LEFT) {
            if (!self.mapMgr.isPressSpace) {
                if (self._mapThingComp) {
                    if (self.mapScrollComp.isInEditArea) {
                        let mousePos = BaseUT.getMousePos(self._curLocation);//这里不直接取evt.getLocation()，再封装一层是因为舞台缩放，会影响evt.getLocation()的坐标） 
                        let localUIPos = self.mapScrollComp.scrollMapUITranstorm.convertToNodeSpaceAR(new Vec3(mousePos.x, mousePos.y, 0));
                        self.emit(CONST.GEVT.DragMapThingDown, <G.DragMapthingInfo>{
                            x: localUIPos.x,
                            y: localUIPos.y,
                            url: self._drawMapThingData.url,
                            thingName: self._drawMapThingData.thingName,
                            taskId: self._drawMapThingData.taskId || 0,
                            groupId: self._drawMapThingData.groupId || 0,
                            groupIdStr: self._drawMapThingData.groupIdStr || 0,
                            type: self._drawMapThingData.type || 0,
                            isByDrag: true
                        });
                    }
                    self.disposeDragMapThing();
                    self.clearTimeout(self._tid);
                    self._tid = self.setTimeout(() => {//延迟0.1秒，这样做是为了在切换选中不同场景物件时，不会选中后就马上绘制触发区域格子
                        self.mapMgr.isForbidDrawGrid = false;
                    }, 200);
                }
            }
        }
    }

    private onMouseMove(e: EventMouse) {
        let self = this;
        self._curLocation = e.getLocation();
        if (self._mapThingComp) {
            let mousePos = BaseUT.getMousePos(self._curLocation);//这里不直接取evt.getLocation()，再封装一层是因为舞台缩放，会影响evt.getLocation()的坐标） 
            self._mapThingComp.setPosition(mousePos.x, mousePos.y);
        }
    }

    private clearDemo() {
        let self = this;
        if (self.lbl_runDemo.string == "关闭运行") {
            self.lbl_runDemo.string = "测试运行";
            UT.closeDlgByName(["JoyStickDlg"]);
            RunDemoCtrl.inst.clear();
        }
    }

    /** 新建地图目录结构 */
    private _tap_btn_create() {
        MessageTip.show({ msg: "功能开发中....." });
    }

    /** 打开文件选择器+读取数据 */
    private _tap_btn_open() {
        let self = this;
        self.mapMgr.openMap();
    }

    /** 导出地图json数据 */
    private _tap_btn_save() {
        let self = this;
        self.mapMgr.exportJson();
    }

    /** 显隐fps*/
    private _tap_btn_profiler() {
        profiler.isShowingStats() ? profiler.hideStats() : profiler.showStats();
    }

    /** 打开帮助*/
    private _tap_btn_help() {
        HelpDlg.show();
    }

    /** 选中对应编辑页签*/
    private select_toogle_group(event: Toggle) {
        let self = this;
        let curTarget = event.node;
        let selectIdx = event.node.parent.children.indexOf(curTarget);
        if (selectIdx == -1 || self._selectIdx == selectIdx) return;
        self._selectIdx = selectIdx;
        self.showEditOperate();
    }

    /**显隐网格 */
    private _tap_btn_showGrid() {
        let self = this;
        self.lbl_grid.string = self.lbl_grid.string == "显示网格" ? "隐藏网格" : "显示网格";
        let graphicsLine = self.mapScrollComp.mapLineGridFactory.graphicsLine;
        graphicsLine.node.active = !graphicsLine.node.active;
    }

    /**显隐路点 */
    private _tap_btn_showPath() {
        let self = this;
        self.lbl_path.string = self.lbl_path.string == "显示路点" ? "隐藏路点" : "显示路点";
        self.mapScrollComp.grp_colorGrid.active = !self.mapScrollComp.grp_colorGrid.active;
    }

    /**显隐物件 */
    private _tap_btn_showMapThing() {
        let self = this;
        self.lbl_mapthing.string = self.lbl_mapthing.string == "显示物件" ? "隐藏物件" : "显示物件";
        self.mapScrollComp.mapThingFactory.refSelfVsb();
    }

    /**重置缩放比例 */
    private _tap_btn_resetScale() {
        let self = this;
        self.mapScrollComp.setMapScale(1);
        self.updateMapScale();
    }

    /** 显隐路点辅助线*/
    private _tap_btn_showObstacleEdge() {
        let self = this;
        let mapData = self.mapMgr.getMapData();
        if (!mapData) {
            MessageTip.show({ msg: "地图数据为空" });
            return;
        }
        let graphic = self.mapScrollComp.graphicsObstacleEdge;
        self.lbl_ObstacleEdge.string = self.lbl_ObstacleEdge.string == "显示路点辅助线" ? "隐藏路点辅助线" : "显示路点辅助线";
        let isShowObstacleEdge = !graphic.node.active;
        graphic.node.active = isShowObstacleEdge;
        if (isShowObstacleEdge) {
            if (!self.mapMgr.isRunningDemoMode) {
                PathFindingAgent.inst.init(mapData);
                ObstacleEdgeUtils.instance.clear();
                Simulator.instance.clear();
                let obstacles = ObstacleEdgeUtils.instance.getObstacleEdge().edgeLines;
                for (let len = obstacles.length, i = 0; i < len; i++) {
                    let e = obstacles[i], lineVectors = [];
                    lineVectors.push(new Vector2(e.startX, e.startY));
                    lineVectors.push(new Vector2(e.endX, e.endY));
                    Simulator.instance.addObstacle(lineVectors);
                }
                Simulator.instance.processObstacles();
            }

            ObstacleEdgeUtils.instance.showObstacleEdge(graphic);
        }
    }

    /** 测试运行 */
    private _tap_btn_runDemo() {
        let self = this;
        if (self.lbl_runDemo.string == "关闭运行") {
            self.clearDemo();
            return;
        }
        let mapData = self.mapMgr.getMapData();
        if (!mapData) {
            MessageTip.show({ msg: "地图数据为空" });
            return;
        }
        self.lbl_runDemo.string = "关闭运行";
        console.log(`地图数据`);
        console.log(mapData);
        self.mapScrollComp.setMapScale(1);
        self.updateMapScale();
        RunDemoCtrl.inst.init(mapData, self.mapScrollComp.grp_scrollMap, self.mapScrollComp.grp_entity, BaseUT.getSize(self.mapScrollComp.grp_mapLayer));
        let graphic = self.mapScrollComp.graphicsObstacleEdge;
        if (graphic.node.active) {
            ObstacleEdgeUtils.instance.showObstacleEdge(graphic);//重新绘制辅助线
        }
        JoyStickDlg.show();
    }

    private _tap_btn_testAstar() {
        let self = this;
        let mapData = self.mapMgr.getMapData();
        if (!mapData) {
            MessageTip.show({ msg: "地图数据为空" });
            return;
        }
        if (!self.mapMgr.isRunningDemoMode) PathFindingAgent.inst.init(mapData);
        TestAstarDlg.show();
    }

    /** 创建文件*/
    private _tap_btn_createFile() {
        FileMgr.inst.createFile(FileMgr.inst.currentDirectoryHandle, "test.txt");
    }

    /** 导出图片 */
    private async _tap_btn_createImage() {
        let self = this;
        let currentDirectoryHandle = FileMgr.inst.currentDirectoryHandle;
        if (!currentDirectoryHandle) return;
        let fileMap = self.mapMgr.fileMap;
        let juhua = await JuHuaDlg.show();
        let error = await FileMgr.inst.deleteFile(currentDirectoryHandle, "out");
        if (error) {
            juhua.close();
            return;
        }
        let directoryHandle = await FileMgr.inst.createDirectory(currentDirectoryHandle, "out");
        if (!directoryHandle) {
            juhua.close();
            return;
        }
        for (let key in fileMap) {
            let file = fileMap[key];
            await FileMgr.inst.saveImgs(directoryHandle, file, key);
        }
        juhua.close();
        MessageTip.show({ msg: '导出图片成功' });
    }

    /** 创建文件夹*/
    private _tap_btn_createDirectory() {
        FileMgr.inst.createDirectory(FileMgr.inst.currentDirectoryHandle, "out");
    }
}


