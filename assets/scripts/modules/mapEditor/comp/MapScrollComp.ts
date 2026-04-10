import { _decorator, EventKeyboard, EventMouse, Graphics, input, Input, KeyCode, Layout, Node, Size, Sprite, SpriteFrame, UITransform, Vec2, Vec3, Widget } from 'cc';
import { CONST } from '../../base/CONST';
import { MapMgr } from '../../base/MapMgr';
import { MapGridFactory } from '../factory/MapGridFactory';
import { MapThingFactory } from '../factory/MapThingFactory';
import RoadNode from '../../road/RoadNode';
import { UIComp } from '../../../../../extensions/cocos-framework/src/ui/UIComp';
import { BaseUT } from '../../../../../extensions/cocos-framework/src/base/BaseUtil';
import { ResMgr } from '../../../../../extensions/cocos-framework/src/mgr/ResMgr';
import { MessageTip } from '../../../../../extensions/cocos-framework/src/ui/MessageTip';
import { MapLineGridFactory } from '../factory/MapLineGridFactory';
import MapRoadUtils from '../../road/MapRoadUtils';
import { UT } from '../../base/UT';
import { FogOfWar } from '../../rvo/utils/FogOfWar';
import { G } from '../../base/Interface';
const { ccclass, property } = _decorator;
/** 
 * @descripttion 编辑器地图滚动组件
 * @author cyk
 * @date 2023-05-30 23:00:00
 */
@ccclass('MapScrollComp')
export class MapScrollComp extends UIComp {
    /** 预制体路径 */
    public static prefabUrl: string = 'prefab/mapEditor/MapScrollComp';
    @property({ type: Node, tooltip: "地图总容器" })
    public grp_mapLayer: Node;
    @property({ type: Node, tooltip: "地图滚动容器" })
    public grp_scrollMap: Node;
    @property({ type: Node, tooltip: "地图切片容器" })
    public grp_mapSlices: Node;
    @property({ type: Node, tooltip: "地图格子路点容器" })
    public grp_colorGrid: Node;
    @property({ type: MapLineGridFactory, tooltip: "地图网格线条绘制工厂" })
    public mapLineGridFactory: MapLineGridFactory;
    @property({ type: Graphics, tooltip: "绘制障碍物边缘路线线条" })
    public graphicsObstacleEdge: Graphics;
    @property({ type: Graphics, tooltip: "绘制A*x寻路路线线条" })
    public graphicsDarwAstarLine: Graphics;
    @property({ type: MapGridFactory, tooltip: "地图格子绘制工厂" })
    public mapGridFactory: MapGridFactory;
    @property({ type: MapThingFactory, tooltip: "地图物件生成工厂" })
    public mapThingFactory: MapThingFactory;
    @property({ type: Node, tooltip: "场景实体容器" })
    public grp_entity: Node;
    @property({ type: FogOfWar, tooltip: "战争迷雾" })
    public fogOfWar: FogOfWar;

    public isInEditArea: boolean;
    private mapMgr: MapMgr;
    /**编辑区域宽高 */
    private _editAreaSize: Size;
    private _pressSpace: boolean;
    /**是否按下鼠标左键 */
    private _pressMouseLeft: boolean;
    /**是否按下鼠标右键 */
    private _pressMouseRight: boolean;
    /**ctrl键是否处于按下状态 */
    private _isCtrlDown: Boolean;
    private _preUIPos: Vec2;
    private _scrollMapUITranstorm: UITransform;
    private onAddNodeHandler: Function;
    private onRemoveNodeHandler: Function;
    public onMouseMoveHandler: Function;
    public onMouseMoveHandlerCtx: any;
    protected onEnter(): void {
        let self = this;
        self.mapMgr = MapMgr.inst;
        self._scrollMapUITranstorm = self.grp_scrollMap.getComponent(UITransform);
        self.onEmitter(CONST.GEVT.ChangeGridType, self.onChangeGridType);
        self.onEmitter(CONST.GEVT.ChangeGridSize, self.onChangeGridRange);
        self.onEmitter(CONST.GEVT.UpdateAstarGrid, self.drawAstarGrid);
        self.onEmitter(CONST.GEVT.StartRunDemo, self.onStartRunDemo); 
        self.onEmitter(CONST.GEVT.StopRunDemo, self.onStopRunDemo); 
        self.onEmitter(CONST.GEVT.FogOfWarActiveStatus, self.setFogOfWarActive);  
    }

    public async onImportMapJson(data: {mapData: G.MapJsonInfo, thingPram: G.ThingPramInfo}) {
        let self = this;
        await self.addMapSlices(data);
    }

    /**导入地图切片 */
    private async addMapSlices(data: {mapData: G.MapJsonInfo, thingPram: G.ThingPramInfo}) {
        let self = this;
        self.grp_mapSlices.destroyAllChildren();
        self.grp_colorGrid.destroyAllChildren();
        self.grp_scrollMap.setPosition(0, 0, 0);
        self.grp_scrollMap.setScale(new Vec3(1, 1, 1));
        self.mapMgr.mapScale = 1;
        let mapMgr = self.mapMgr;
        let mapFloorArr = mapMgr.mapFloorArr;
        let mapslice = mapMgr.mapslice;
        let tempX: number = 0;
        let tempY: number = 0;
        let index: number = 0;
        let totWidth: number = 0;
        let totHeight: number = 0;
        let hasFinishOneLine: boolean;
        let mapSliceLayout = self.grp_mapSlices.getComponent(Layout);
        mapSliceLayout.constraintNum = mapslice;
        for (let i = 0; i < mapFloorArr.length; i++) {
            await showFloorItor(mapFloorArr[i]);
        }
        mapMgr.mapWidth = totWidth;
        mapMgr.mapHeight = totHeight;
        MapRoadUtils.instance.updateMapInfo(totWidth, totHeight, self.mapMgr.cellWidth, self.mapMgr.cellHeight, self.mapMgr.mapType);
        BaseUT.setSize(self.grp_scrollMap, totWidth, totHeight);
        BaseUT.setSize(self.grp_mapSlices, totWidth, totHeight);
        console.log("地图宽高:", mapMgr.mapWidth, mapMgr.mapHeight);
       
        self.init(data);
        async function showFloorItor(floorInfo: G.MapFloor) {
            let url: string = floorInfo.nativePath;
            return new Promise<void>((resolve, reject) => {
                ResMgr.inst.loadLocalImg(url, (spriteFrame: SpriteFrame) => {
                    index++;
                    console.log(floorInfo.sourceName, spriteFrame.texture.width, spriteFrame.texture.height);
                    tempX = (tempX + spriteFrame.texture.width);
                    if (!hasFinishOneLine) totWidth += spriteFrame.texture.width;
                    if (index == mapslice) {
                        index = 0;
                        tempX = 0;
                        tempY = (tempY + spriteFrame.texture.height);
                        totHeight += spriteFrame.texture.height;
                        hasFinishOneLine = true;
                    };
                    let mapSliceNode = BaseUT.newUINode(floorInfo.sourceName);
                    let sprite = mapSliceNode.addComponent(Sprite);
                    sprite.spriteFrame = spriteFrame;
                    mapSliceNode.setParent(self.grp_mapSlices);
                    resolve();
                }, self);
            })
        }
    }

    private init(data: {mapData: G.MapJsonInfo, thingPram: G.ThingPramInfo}) {
        let self = this;
        self.initEvent();
        self.mapLineGridFactory.init(data);
        self.mapGridFactory.init(data);
        self.mapThingFactory.init(data);
        self.clearFogOfWar();
    }

    private drawAstarGrid(dt: any) {
        let self = this;
        let cellHalfWidth = self.mapMgr.cellHalfWidth;
        let cellHalfHeight = self.mapMgr.cellHalfHeight;
        let mapType = self.mapMgr.mapType;
        let roadNodeArr: RoadNode[] = dt.roadNodeArr;
        let graphic = self.graphicsDarwAstarLine;
        graphic.clear();
        for (let i = 0, len = roadNodeArr.length; i < len; i++) {
            let node = roadNodeArr[i];
            if (mapType == CONST.MapType.angle45) {
                UT.draw45AngleMapRoadPoint(graphic,node.px, node.py, cellHalfWidth, cellHalfHeight);
            } else if (mapType == CONST.MapType.angle90) {
                UT.draw90AngleMapRoadPoint(graphic, node.px, node.py, cellHalfWidth, cellHalfHeight);
            }
        }
    }

    /**初始化事件 */
    private initEvent() {
        let self = this;
        self._editAreaSize = BaseUT.getSize(self.grp_mapLayer);
        // this.node.on(Node.EventType.MOUSE_MOVE, this.onShowRoadMsg, self),
        self.grp_mapLayer.on(Node.EventType.MOUSE_MOVE, self.onMouseMove, self);
        self.grp_mapLayer.on(Node.EventType.MOUSE_DOWN, self.onMouseDown, self);
        self.grp_mapLayer.on(Node.EventType.MOUSE_ENTER, self.onMouseEnter, self, true);//移入必须注册在捕获阶段，不然移到场景物件时会触发MOUSE_LEAVE
        self.grp_mapLayer.on(Node.EventType.MOUSE_LEAVE, self.onMouseLeave, self);
        self.grp_mapLayer.on(Node.EventType.MOUSE_WHEEL, self.onMouseWheel, self);

        input.on(Input.EventType.KEY_DOWN, self.onKeyDown, self); //监听键盘按键按下
        input.on(Input.EventType.KEY_UP, self.onKeyUp, self); //监听键盘按键放开
        self.onAddNodeHandler = self.mapGridFactory.onAddNodeHandler;
        self.onRemoveNodeHandler = self.mapGridFactory.onRemoveNodeHandler;
    }

    private onMouseDown(e: EventMouse) {
        let self = this;
        let buttonId = e.getButton();
        if (buttonId == EventMouse.BUTTON_MIDDLE) {//按下鼠标中建
            return;
        }
        if (buttonId == EventMouse.BUTTON_LEFT) {
            self._pressMouseLeft = true;
        } else if (buttonId == EventMouse.BUTTON_RIGHT) {
            self._pressMouseRight = true;
        }
        self.grp_mapLayer.on(Node.EventType.MOUSE_UP, self.onMouseUp, self);
        let isDealGrid = false;
        if (!self._pressSpace) {
            if (self.mapMgr.gridType != CONST.GridType.GridType_none) {
                if (self._pressMouseLeft && !self.mapMgr.isForbidDrawGrid) {
                    let mousePos = BaseUT.getMousePos(e.getLocation());//这里不直接取evt.getLocation()，再封装一层是因为舞台缩放，会影响evt.getLocation()的坐标） 
                    let localUIPos = self._scrollMapUITranstorm.convertToNodeSpaceAR(new Vec3(mousePos.x, mousePos.y, 0));
                    if (self._isCtrlDown) {
                        if (self.onRemoveNodeHandler) self.onRemoveNodeHandler.call(self.mapGridFactory, localUIPos);
                    } else {
                        if (self.onAddNodeHandler) self.onAddNodeHandler.call(self.mapGridFactory, localUIPos);
                    }
                    isDealGrid = true;
                }
            } else {
                MessageTip.show({ msg: "请选择操作功能！" });
            }
        }
        if(!isDealGrid) self._preUIPos = e.getUILocation();//没有在处理绘制格子时，才能赋值拖动地图的起始坐标
    }

    private onMouseMove(e: EventMouse) {
        let self = this;
        let mousePos = BaseUT.getMousePos(e.getLocation());//这里不直接取evt.getLocation()，再封装一层是因为舞台缩放，会影响evt.getLocation()的坐标） 
        let localUIPos = self._scrollMapUITranstorm.convertToNodeSpaceAR(new Vec3(mousePos.x, mousePos.y, 0));
        if(self.onMouseMoveHandler) self.onMouseMoveHandler.call(self.onMouseMoveHandlerCtx, localUIPos);
        if (self._pressSpace) {//拖动地图
            if(self._pressMouseLeft && self._preUIPos) {
                let curUILocation = e.getUILocation();
                let deltaX = curUILocation.x - self._preUIPos.x;
                let deltaY = curUILocation.y - self._preUIPos.y;
                let toX = self.grp_scrollMap.position.x + deltaX;
                let toY = self.grp_scrollMap.position.y + deltaY;
                self.grp_scrollMap.setPosition(toX, toY);
                self._preUIPos = curUILocation;
                self.checkLimitPos();
            }
        } else {
            if (self.mapMgr.gridType != CONST.GridType.GridType_none) {
                if (self._pressMouseLeft && !self.mapMgr.isForbidDrawGrid) {
                    if (self._isCtrlDown) {
                        if (self.onRemoveNodeHandler) self.onRemoveNodeHandler.call(self.mapGridFactory, localUIPos);
                    } else {
                        if (self.onAddNodeHandler) self.onAddNodeHandler.call(self.mapGridFactory, localUIPos);
                    }
                }
            }
        }
    }


    private onMouseUp(e: EventMouse) {
        let self = this;
        // this.grp_mapLayer.off(Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        self.grp_mapLayer.off(Node.EventType.MOUSE_UP, self.onMouseUp, self);
        let buttonId = e.getButton();
        if (buttonId == EventMouse.BUTTON_LEFT) {
            self._pressMouseLeft = false;
        } else if (buttonId == EventMouse.BUTTON_RIGHT) {
            self._pressMouseRight = false;
        }
        self._preUIPos = null;
    }

    private onChangeGridType(dt: any) {
        let self = this;
        self.mapMgr.gridType = dt.gridType;
    }

    private onChangeGridRange(dt: any) {
        let self = this;
        self.mapMgr.gridRange = dt.range;
    }

    private onMouseEnter(e: EventMouse) {
        let self = this;
        self.isInEditArea = true;
        self.checkMousCursor();
    }

    private onMouseLeave(e: EventMouse) {
        let self = this;
        self.isInEditArea = false;
        self.checkMousCursor();
    }

    private onMouseWheel(event: EventMouse) {
        let location = event.getLocation();
        event.getScrollY() > 0 ? this.scaleMap(0.1, location) : this.scaleMap(-0.1, location);
    }

    /**设置地图缩放比例 */
    public setMapScale(scale: number) {
        let self = this;
        if (self.mapScale == scale) return;//已经是初始缩放比例
        let widget = self.node.getComponent(Widget);
        let selfSize = BaseUT.getSize(self.node);
        let view = BaseUT.getView();
        let location = new Vec2((widget.left + selfSize.width / 2) * view.getScaleX(), (widget.bottom + selfSize.height / 2) * view.getScaleY());//以当前地图视角中心为圆心来重置缩放
        self.scaleMap(scale - self.mapScale, location);
    }

    /**
     * 缩放地图
     * @param deltaScale 
     * @param location 鼠标相对于左下角的位置
     */
    private scaleMap(deltaScale: number, location: Vec2) {
        let self = this;
        let scale = self.grp_scrollMap.scale.x + deltaScale;
        let editAreaWidth = self._editAreaSize.width;
        let editAreaHeight = self._editAreaSize.height;
        let mapMinWidth = Math.max(self.mapMgr.mapWidth, editAreaWidth);
        let mapMinHeight = Math.max(self.mapMgr.mapHeight, editAreaHeight);
        let minScale = Math.max(editAreaWidth / mapMinWidth, editAreaHeight / mapMinHeight);
        if (scale > 2.5) scale = 2.5;
        if (scale < minScale) scale = minScale;
        if (self.mapScale == scale) return;
        self.mapMgr.mapScale = scale;
        let mousePos = BaseUT.getMousePos(location);//这里不直接取evt.getLocation()，再封装一层是因为舞台缩放，会影响evt.getLocation()的坐标） 
        let localUIPos = self._scrollMapUITranstorm.convertToNodeSpaceAR(new Vec3(mousePos.x, mousePos.y, 0));
        self.grp_scrollMap.setScale(new Vec3(scale, scale, scale));//一定要设置z的scale，不然会影响转换成世界坐标的值
        let globalPos = self._scrollMapUITranstorm.convertToWorldSpaceAR(new Vec3(localUIPos.x, localUIPos.y, 0));
        let moveDelta = new Vec2(mousePos.x - globalPos.x, mousePos.y - globalPos.y);
        let toX = self.grp_scrollMap.position.x + moveDelta.x;
        let toY = self.grp_scrollMap.position.y + moveDelta.y;
        self.grp_scrollMap.setPosition(toX, toY);
        self.checkLimitPos();
        self.emit(CONST.GEVT.UpdateMapScale);
    }

    /**检测地图滚动容器边界 */
    private checkLimitPos() {
        let self = this;
        let maxScrollX = self.stageWidth - self._editAreaSize.width;
        let maxScrollY = self.stageHeight - self._editAreaSize.height;
        if (self.grp_scrollMap.position.x > 0) self.grp_scrollMap.setPosition(new Vec3(0, self.grp_scrollMap.position.y));
        if (self.grp_scrollMap.position.x < -maxScrollX) self.grp_scrollMap.setPosition(new Vec3(-maxScrollX, self.grp_scrollMap.position.y));
        if (self.grp_scrollMap.position.y > 0) self.grp_scrollMap.setPosition(new Vec3(self.grp_scrollMap.position.x, 0));
        if (self.grp_scrollMap.position.y < -maxScrollY) self.grp_scrollMap.setPosition(new Vec3(self.grp_scrollMap.position.x, -maxScrollY));
    }

    public get scrollMapUITranstorm() {
        let self = this;
        return self._scrollMapUITranstorm;
    }

    public get mapScale() {
        let self = this;
        return self.grp_scrollMap.scale.x;
    }

    private get stageWidth() {
        let self = this;
        let editAreaWidth = self._editAreaSize.width;
        let mapMinWidth = Math.max(self.mapMgr.mapWidth, editAreaWidth);
        return mapMinWidth * self.grp_scrollMap.scale.x;
    }

    private get stageHeight() {
        let self = this;
        let editAreaHeight = self._editAreaSize.height;
        let mapMinHeight = Math.max(self.mapMgr.mapHeight, editAreaHeight);
        return mapMinHeight * self.grp_scrollMap.scale.y;
    }

    private onKeyDown(event: EventKeyboard) {
        let self = this;
        switch (event.keyCode) {
            case KeyCode.SPACE:
                self.mapMgr.isPressSpace = self._pressSpace = true;
                self.checkMousCursor();
                break;
            case KeyCode.CTRL_LEFT:
            case KeyCode.CTRL_RIGHT:
                self.mapMgr.isPressCtrl = self._isCtrlDown = true;
                break;
        }
    }

    private onKeyUp(event: EventKeyboard) {
        let self = this;
        switch (event.keyCode) {
            case KeyCode.SPACE:
                self.mapMgr.isPressSpace = self._pressSpace = false;
                self.checkMousCursor();
                break;
            case KeyCode.CTRL_LEFT:
            case KeyCode.CTRL_RIGHT:
                self.mapMgr.isPressCtrl = self._isCtrlDown = false;
                break;
        }
    }

    private checkMousCursor() {
        let self = this;
        if (self.mapMgr.isRunningDemoMode) return;
        if (self._pressSpace && self.isInEditArea) {
            BaseUT.changeMouseCursor("grab");
        } else {
            BaseUT.changeMouseCursor("auto");
        }
    }

    private onStartRunDemo(){
        let self = this;
        self.initFogOfWar();
    }

    private onStopRunDemo(){
        this.fogOfWar.clear();
    }

    private setFogOfWarActive(isOpen:boolean){
        this.fogOfWar.node.active = isOpen;
    }

    private initFogOfWar(){
        this.setFogOfWarActive(true);
        this.fogOfWar.init(this.stageWidth, this.stageHeight);
    }

    private clearFogOfWar(){
        this.setFogOfWarActive(false);
        this.fogOfWar.clear();
    }
}


