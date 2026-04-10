import { _decorator, instantiate, Prefab, Vec3 } from 'cc';
import { MapMgr } from '../../base/MapMgr';
import { ColorGrid } from '../comp/ColorGrid';
import { CONST } from '../../base/CONST';
import { G } from '../../base/Interface';
import { UIComp } from '../../../../../extensions/cocos-framework/src/ui/UIComp';
import MapRoadUtils from '../../road/MapRoadUtils';
import RoadNode from '../../road/RoadNode';
const { ccclass, property } = _decorator;
/** 
 * @descripttion 网格绘制工厂
 * @author cyk
 * @date 2023-06-30 23:00:00
 */
@ccclass('MapGridFactory')
export class MapGridFactory extends UIComp {
    @property({ type: Prefab })
    public colorGridPrefab: Prefab;

    private mapMgr: MapMgr;
    private mapRoadUtils: MapRoadUtils;
    /**区域格子Graphic缓存map */
    private _graphicsDic: { [areaKey: string]: ColorGrid };
    private _colorDic: { [gridType: string]: string };
    /**删除格子时涉及到的区域临时map */
    private _redrawTempMap: { [graphicKey: string]: string };
    /** 绘制格子周围一圈的偏移值map缓存*/
    private _neighboursDic: { [size: number]: number[][] };
    protected onEnter(): void {
        let self = this;
        self.mapMgr = MapMgr.inst;
        self.mapRoadUtils = MapRoadUtils.instance;
        self.onEmitter(CONST.GEVT.ReDarwGraphic, self.onReDarwGraphic);
    }

    public init(data: {mapData: G.MapJsonInfo, thingPram: G.ThingPramInfo}) {
        let self = this;
        self._graphicsDic = {};
        self._colorDic = {};
        self._neighboursDic = {};
        let mapData= data.mapData;
        let walkList = mapData.walkList || [];
        /** 设置可行走节点**/
        for (let i = 0; i < walkList.length; i++) {//行
            let lineList = walkList[i];
            for (let j = 0; j < lineList.length; j++) {//列
                if (lineList[j] != CONST.WalkType.none) {
                    let gridType: string;
                    if (lineList[j] == CONST.WalkType.walk) {//可行走
                        gridType = CONST.GridType.GridType_walk;
                    } else if (lineList[j] == CONST.WalkType.shelter) {//半透明
                        gridType = CONST.GridType.GridType_shelter;
                    }
                    let roadRoad = self.mapRoadUtils.getNodeByDerect(j, i);
                    self.addGrid(gridType, roadRoad);
                }
            }
        }

        addGridDataByType(CONST.GridType.GridType_start, mapData.startList || []);
        addGridDataByType(CONST.GridType.GridType_WaterVerts, mapData.waterVertList || []);

        if (mapData.mapThingList) {
            mapData.mapThingList.forEach(mapThingData => {
                let tempMapThingInfo = <G.MapThingInfo>{};
                tempMapThingInfo.x = mapThingData.x;
                tempMapThingInfo.y = mapThingData.y;
                self.mapMgr.curMapThingInfo = tempMapThingInfo;//这里创建的临时mapthingInfo是为了导入地图数据时往gridDataDic里塞格子数据用
                if (mapThingData.area) addGridDataByType(CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_light, mapThingData.area);
                if (mapThingData.unWalkArea) addGridDataByType(CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_unWalk, mapThingData.unWalkArea);
                if (mapThingData.keyManStandArea) addGridDataByType(CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_keyManStand, mapThingData.keyManStandArea);
                if (mapThingData.grassArea) addGridDataByType(CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_grass, mapThingData.grassArea);
            });
        }

        function addGridDataByType(gridType: string, gridKeys: string[]) {
            for (let i = 0; i < gridKeys.length; i++) {
                let splitGridKey = gridKeys[i].split("_");
                let roadRoad = self.mapRoadUtils.getNodeByDerect(Number(splitGridKey[0]), Number(splitGridKey[1]));
                self.addGrid(gridType, roadRoad);
            }
        }
    }

    public onAddNodeHandler(localUIPos: Vec3) {
        let self = this;
        self.addOrRmRangeGrid(localUIPos, true);
    }

    public onRemoveNodeHandler(localUIPos: Vec3) {
        let self = this;
        self.addOrRmRangeGrid(localUIPos, false);
    }

    /**添加或者删除格子 */
    private addOrRmRangeGrid(localUIPos: Vec3, isAdd: boolean) {
        let self = this;
        let roadNode = self.mapRoadUtils.getNodeByPixel(localUIPos.x, localUIPos.y);
        let gridType = self.mapMgr.gridType;
        self._redrawTempMap = {};
        let roadNodes = self.getBrushInk(roadNode);
        for (let i = 0; i < roadNodes.length; i++) {
            let tempRoad = roadNodes[i];
            if (isAdd) {
                self.addGrid(gridType, tempRoad);
            } else {
                self.removeGrid(gridType, tempRoad);
            }
        }
        self.drawGraphic();//移除格子时，删除数据后，重新绘制感兴趣区域的所有格子
    }

    /**
     * 添加指定行列的格子
     * @param gridPos 格子行列
     * @returns 
     */
    private addGrid(gridType: string, roadNode: RoadNode) {
        let self = this;
        let mapMgr = self.mapMgr;
        let gridKey = roadNode.col + "_" + roadNode.row;
        let graphicsPos = { x: Math.floor(roadNode.col / mapMgr.areaGraphicSize), y: Math.floor(roadNode.row / mapMgr.areaGraphicSize) };
        let gridDataMap = mapMgr.gridDataMap;
        let areaKey = graphicsPos.x + '_' + graphicsPos.y;
        let colorType = gridType;
        let value = CONST.WalkType.walk;
        if (gridType.indexOf(CONST.GridType.GridType_mapThing) > -1) {//场景物件格子有归属关系，这里特殊处理，方便物件删除时，把格子一起删除
            let mapThingInfo: G.MapThingInfo = mapMgr.curMapThingInfo;
            if (!mapThingInfo || mapThingInfo.type == CONST.MapThingType.bevel) return;//顶点格子不需要绘制颜色格子
            let mapThingKey: string = Math.floor(mapThingInfo.x) + "_" + Math.floor(mapThingInfo.y);
            colorType = gridType == CONST.GridType.GridType_mapThing ? gridType + mapMgr.curMapThingTriggerType : gridType;
            gridType = gridType == CONST.GridType.GridType_mapThing ? gridType + mapMgr.curMapThingTriggerType + "_" + mapThingKey : gridType + "_" + mapThingKey;
        } else if(gridType == CONST.GridType.GridType_shelter) {//半透明路点和可行走路点最终导出时共用同个数组
            let walkData = gridDataMap?.[CONST.GridType.GridType_walk]?.[areaKey]??{};
            if(walkData[gridKey] == CONST.WalkType.walk) {//已存在可行走格子
                self.removeGrid(CONST.GridType.GridType_walk, roadNode);
                delete walkData[gridKey];
            }
            value = CONST.WalkType.shelter;
        } else if(gridType == CONST.GridType.GridType_walk) {//半透明路点和可行走路点最终导出时共用同个数组
            let walkData = gridDataMap?.[CONST.GridType.GridType_shelter]?.[areaKey]??{};
            if(walkData[gridKey] == CONST.WalkType.shelter) {//已存在半透明格子
                self.removeGrid(CONST.GridType.GridType_shelter, roadNode);
                delete walkData[gridKey];
            }
            value = CONST.WalkType.walk;
        }
        if (!gridDataMap[gridType]) gridDataMap[gridType] = {};
        if (!gridDataMap[gridType][areaKey]) gridDataMap[gridType][areaKey] = {};
        if (gridDataMap[gridType][areaKey][gridKey]) return; //已有格子
        gridDataMap[gridType][areaKey][gridKey] = value;
        let color = self._colorDic[gridType] = mapMgr.getColorByType(colorType);
        let cellHalfWidth = mapMgr.cellHalfWidth;
        let cellHalfHeight = mapMgr.cellHalfHeight;
        let graphicsKey = gridType + '_' + areaKey;
        let graphics = self.getGraphic(graphicsKey);
        let mapType = mapMgr.mapType;
        if (mapType == CONST.MapType.angle45) {
            graphics.draw45AngleMapRoadPoint(color, roadNode.px, roadNode.py, cellHalfWidth, cellHalfHeight);
        } else if (mapType == CONST.MapType.angle90) {
            graphics.draw90AngleMapRoadPoint(color, roadNode.px, roadNode.py, cellHalfWidth, cellHalfHeight);
        }
    }

    /**
     * 清除指定行列的格子
     * @param gridPos 格子行列
     * @returns 
     */
    private removeGrid(gridType: string, roadNode: RoadNode) {
        let self = this;
        let mapMgr = self.mapMgr;
        let gridKey = roadNode.col + "_" + roadNode.row;
        if (gridType.indexOf(CONST.GridType.GridType_mapThing) > -1) {//场景物件格子有归属关系，这里特殊处理，方便物件删除时，把格子一起删除
            let mapThingInfo: G.MapThingInfo = mapMgr.curMapThingInfo;
            if (!mapThingInfo) return;
            let mapThingKey: string = Math.floor(mapThingInfo.x) + "_" + Math.floor(mapThingInfo.y);
            gridType = gridType + mapMgr.curMapThingTriggerType + "_" + mapThingKey;
        } 
        let gridDataMap = mapMgr.gridDataMap;
        let graphicsPos = { x: Math.floor(roadNode.col / mapMgr.areaGraphicSize), y: Math.floor(roadNode.row / mapMgr.areaGraphicSize) };
        let areaKey = graphicsPos.x + '_' + graphicsPos.y;

        if (gridDataMap[gridType] && gridDataMap[gridType][areaKey] && gridDataMap[gridType][areaKey][gridKey]) {
            delete gridDataMap[gridType][areaKey][gridKey];
            self._redrawTempMap[gridType + '|' + areaKey] = gridType + '_' + areaKey;
        }
    }

    private onReDarwGraphic(dt: any) {
        let self = this;
        self._redrawTempMap = dt.redrawDic;
        self.drawGraphic();
    }

    /**移除格子删除数据后，重新绘制感兴趣区域的所有格子 */
    private drawGraphic() {
        let self = this;
        if(!self._redrawTempMap) return;
        let gridDataMap = self.mapMgr.gridDataMap;
        let cellHalfWidth = self.mapMgr.cellHalfWidth;
        let cellHalfHeight = self.mapMgr.cellHalfHeight;
        let mapType = self.mapMgr.mapType;
        for (let key in self._redrawTempMap) {
            let splitKey = key.split('|');
            let gridType = splitKey[0];
            let areaKey = splitKey[1];
            let graphicsKey = self._redrawTempMap[key];
            let graphics = self.getGraphic(graphicsKey);
            graphics.clear();
            let color = self._colorDic[gridType];
            let areaGridDataMap = gridDataMap[gridType][areaKey];
            if (areaGridDataMap) {
                for (let gridKey in areaGridDataMap) {
                    let spltGridPosKey = gridKey.split("_");
                    let roadNode = self.mapRoadUtils.getNodeByDerect(Number(spltGridPosKey[0]), Number(spltGridPosKey[1]));
                    if (mapType == CONST.MapType.angle45) {
                        graphics.draw45AngleMapRoadPoint(color, roadNode.px, roadNode.py, cellHalfWidth, cellHalfHeight);
                    } else if (mapType == CONST.MapType.angle90) {
                        graphics.draw90AngleMapRoadPoint(color, roadNode.px, roadNode.py, cellHalfWidth, cellHalfHeight);
                    }
                }
            }
        }
        self._redrawTempMap = null;
    }

    private getGraphic(key: string): ColorGrid {
        let self = this;
        if (!self._graphicsDic[key]) {
            let colorGrid = instantiate(self.colorGridPrefab);
            colorGrid.setParent(self.node);
            let graphics = colorGrid.getComponent(ColorGrid);
            self._graphicsDic[key] = graphics;
        }
        return self._graphicsDic[key];
    }

    /**
     * 根据当前节点获取周围的点
     * @param roadNode 
     * @returns 
     */
    private getBrushInk(roadNode: RoadNode) {
        let self = this;
        let range = self.mapMgr.gridRange;
        let neighbours = self.getNeighbours(range);
        let roadNodes = [];
        for (let i = 0; i < neighbours.length; i++) {
            let col = roadNode.cx + neighbours[i][0];
            let row = roadNode.cy + neighbours[i][1];
            if (0 != col || 0 != row) {
                let tempRoad = self.mapRoadUtils.getNodeByWorldPoint(col, row);
                tempRoad.value = roadNode.value;
                roadNodes.push(tempRoad);
            }
        }
        return roadNodes;
    }

    private getNeighbours(range: number) {
        if (!range)
            return [[0, 0]];
        let neighbours = null;
        if (null != this._neighboursDic[range])
            neighbours = this._neighboursDic[range];
        else {
            neighbours = [];
            for (var i = -range; i <= range; i++)
                for (var j = -range; j <= range; j++)
                    Math.abs(j) + Math.abs(i) > range || neighbours.push([j, i]);
            this._neighboursDic[range] = neighbours;
        }
        return neighbours;
    }
}


