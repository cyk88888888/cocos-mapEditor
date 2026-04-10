import { Node, Prefab, SpriteFrame, instantiate } from "cc";
import { CONST } from "./CONST";
import { G } from "./Interface";
import { InvalidImportDlg } from "../mapEditor/dlg/InvalidImportDlg";
import { FileMgr } from "../../../../extensions/cocos-framework/src/mgr/FileMgr";
import { emmiter } from "../../../../extensions/cocos-framework/src/base/Emmiter";
import { BaseUT } from "../../../../extensions/cocos-framework/src/base/BaseUtil";
import { ImgLoader } from "../../../../extensions/cocos-framework/src/uiComp/ImgLoader";
import { MessageTip } from "../../../../extensions/cocos-framework/src/ui/MessageTip";
/** 
 * @descripttion 地图管理器
 * @author cyk
 * @date 2023-06-01 09:05:10
 */
export class MapMgr {
    private static _inst: MapMgr;
    public static get inst() {
        if (!this._inst) {
            this._inst = new MapMgr();
            this._inst.init();
        }
        return this._inst;
    }
    /** 版本号*/
    public version: string;
    /** 导入的地图切片数组*/
    public mapFloorArr: G.MapFloor[];
    /** 导入等待地图切片列数*/
    public mapslice: number;
    /** 地图宽*/
    public mapWidth: number;
    /** 地图高*/
    public mapHeight: number;
    /**地图格子列数 */
    public totCol: number;
    /**地图格子行数 */
    public totRow: number;
    /**格子宽 */
    public cellWidth: number;
    /**格子宽一半 */
    public cellHalfWidth: number;
    /**格子高 */
    public cellHeight: number;
    /**格子高一半 */
    public cellHalfHeight: number;
    /** 地图类型*/
    public mapType: CONST.MapType;
    /**绘制的格子范围大小 */
    public gridRange: number;
    /**当前绘制的格子类型 */
    public gridType: CONST.GridType;
    /**当前地图缩放比例 */
    public mapScale: number;
    /**绘制格子的单个Graphic区域大小 */
    public areaGraphicSize: number;
    /** 导入的地图场景物件数组*/
    public mapThingUrlMap: { [name: string]: string };
    /** 当前绘制的格子数据*/
    public gridDataMap: { [gridType: string]: { [areaKey: string]: { [gridKey: string]: number } } };
    /**场景物件信息数据 */
    public mapThingMap: { [name: string]: any[] };
    public curMapThingInfo: G.MapThingInfo;//当前正在编辑的场景物件
    /**是否按下space键 */
    public isPressSpace: boolean;
    /**是否按下ctrl键 */
    public isPressCtrl: boolean;
    /**是否禁用绘制颜色格子 */
    public isForbidDrawGrid: boolean;
    /**顶点物件名称 */
    public bavelResStr: string = "black.png";
    /**当前场景物件的触发类型 */
    public curMapThingTriggerType: CONST.MapThingTriggerType;
    public triggerTypes: { type: number, desc: string }[];
    /** 是否测试运行模式*/
    public isRunningDemoMode: boolean;
    public init() {
        let self = this;
        self.gridRange = 0;
        self.gridType = CONST.GridType.GridType_none;
        self.curMapThingTriggerType = CONST.MapThingTriggerType.MapThingTrigger_light;
        self.triggerTypes = [
            { type: CONST.MapThingTriggerType.MapThingTrigger_light, desc: '触发发亮' },
            { type: CONST.MapThingTriggerType.MapThingTrigger_unWalk, desc: '不可行走' },
            { type: CONST.MapThingTriggerType.MapThingTrigger_keyManStand, desc: '犯人站立点' },
            { type: CONST.MapThingTriggerType.MapThingTrigger_grass, desc: '草丛范围点' },
        ];
    }
    /** 文件名对应的file */
    public fileMap:{[name:string]:File};
    /**
     * 打开地图目录
     */
    public async openMap() {
        let self = this;
        let fileMgr = FileMgr.inst;
        let root = await fileMgr.getDirTreeMap();
        console.log(root);
        if (!root) return;
        let mapFloorArr: G.MapFloor[] = [];
        let mapThingUrlMap = {};
        let mapslice = 0;
        let firstRow: number;
        let mapData: G.MapJsonInfo, thingPram: G.ThingPramInfo;
        self.fileMap = {};
        await getFilesRecursively(root);
        async function getFilesRecursively(parent: FileSystemDirectoryHandle | FileSystemFileHandle) {
            if (parent.kind === 'directory') {
                let children: (FileSystemDirectoryHandle | FileSystemFileHandle)[] = parent["children"] || [];
                if (parent.name === 'floor') {
                    for (let i = 0; i < children.length; i++) {
                        children[i]["rootName"] = "floor";
                        await getFilesRecursively(children[i]);
                    }
                } else if (parent.name === 'thing') {
                    for (let i = 0; i < children.length; i++) {
                        children[i]["rootName"] = "thing";
                        await getFilesRecursively(children[i]);
                    }
                } else {
                    let children: (FileSystemDirectoryHandle | FileSystemFileHandle)[] = parent["children"];
                    for (let i = 0; i < children.length; i++) {
                        await getFilesRecursively(children[i]);
                    }
                }
            } else {
                if (parent["rootName"] == "floor") {
                    let splitNameArr = parent.name.split(".")[0].split("_");
                    let col = Number(splitNameArr[1]);//列
                    let row = Number(splitNameArr[0]);//行
                    let file: File = await parent.getFile();
                    if (!firstRow) firstRow = row;
                    if (firstRow == row) {
                        mapslice++;
                    }
                    mapFloorArr.push({ col: col, row: row, sourceName: parent.name, nativePath: fileMgr.createObjectURL(file) });
                } else if (parent["rootName"] == "thing") {
                    if (parent.name.indexOf("_") == -1) {
                        let file: File = await parent.getFile();
                        self.fileMap[parent.name] = file;
                        mapThingUrlMap[parent.name] = fileMgr.createObjectURL(file);
                    }
                }
                if (parent.name == "mapData.json") {
                    let file: File = await parent.getFile();
                    let content = await fileMgr.readLocalText(file);
                    mapData = JSON.parse(content);
                } else if (parent.name == "thingPram.json") {
                    let file: File = await parent.getFile();
                    let content = await fileMgr.readLocalText(file);
                    thingPram = JSON.parse(content);
                }
            }
        }

        let errorMsg: string = '';
        if (!mapData) {
            errorMsg += "mapData.json文件不存在|";
        }
        if (!thingPram) {
            errorMsg += "thingPram.json文件不存在|";
        }
        if (!mapFloorArr.length) {
            errorMsg += "floor地图切片文件夹不存在|";
        }
        if (!Object.keys(mapThingUrlMap).length) {
            errorMsg += "thing地图场景物件文件夹不存在|";
        }

        if (!!errorMsg) {
            InvalidImportDlg.show({ errorMsg: errorMsg });
            return;
        }

        self.mapFloorArr = mapFloorArr;
        self.mapThingUrlMap = mapThingUrlMap;
        self.mapslice = mapslice;
        self.mapFloorArr.sort((a: any, b: any): number => {
            if (a.row < b.row) {
                return -1;
            } else if (a.row > b.row) {
                return 1;
            } else {
                if (a.col > b.col) {
                    return 1;
                } else {
                    return -1;
                }
            }
        })
        console.log(mapData, thingPram);
        self.cellWidth = mapData.cellWidth || 20;
        self.cellHeight = mapData.cellHeight || 20;
        self.cellHalfWidth = Math.floor(self.cellWidth / 2);
        self.cellHalfHeight = Math.floor(self.cellHeight / 2);
        self.mapType = mapData.mapType || CONST.MapType.angle90;
        self.gridDataMap = {};
        self.mapThingMap = {};
        emmiter.emit(CONST.GEVT.ImportMapJson, { mapData: mapData, thingPram: thingPram });
    }

    /**
     * 根据格子类型获取对应颜色
     * @param type 格子类型
     * @returns 
     */
    public getColorByType(type: string): string {
        switch (type) {
            case CONST.GridType.GridType_walk:
                return '#00FF00';//绿
            case CONST.GridType.GridType_shelter:
                return '#FFFF00';//黄
            case CONST.GridType.GridType_WaterVerts:
                return '#FF00FF';//紫色
            case CONST.GridType.GridType_start:
                return '#FF0000';//红
            case CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_light:
                return '#0000FF';//深蓝
            case CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_unWalk:
                return '#330000';//褐色
            case CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_keyManStand:
                return '#CB00FF';//深紫
            case CONST.GridType.GridType_mapThing + CONST.MapThingTriggerType.MapThingTrigger_grass:
                return '#00FFFF';//浅蓝
            default:
                return '#000000';
        }
    }

    /**
     * 根据格子列行获取格子所在的idx 
     * @param x 列
     * @param y 行
     * @return 
     * 
     */
    public pos2Idx(x: number, y: number) {
        let self = this;
        let totLine: number = Math.ceil(self.mapHeight / self.cellHeight);//总行数
        let totCol: number = Math.ceil(self.mapWidth / self.cellWidth);//总列数
        let idx: number = y * totCol + x;
        return idx;
    }

    /**
     * 地图位置坐标转为格子行列
     * @param x 
     * @param y 
     * @returns 
     */
    public pos2Grid(x: number, y: number) {
        let self = this;
        return { col: Math.floor(x / self.cellWidth), row: Math.floor(y / self.cellHeight) };
    }

    /**
    * 格子idx转为格子所在的行列 
    * @param idx
    * @return 
    */
    public idx2Grid(idx: number) {
        let self = this;
        let totLine: number = Math.ceil(self.mapHeight / self.cellHeight);//总行数
        let totCol: number = Math.ceil(self.mapWidth / self.cellWidth);//总列数
        let line: number = Math.floor(idx / totCol);
        let col: number = idx - line * totCol;
        return { col: col, row: line };
    }

    /**
     * 格子idx转为格子所在的坐标x，y
     * @param idx 
     * @param isCenter 是否为格子的中心点坐标，false返回左下角角坐标
     * @returns 
     */
    public idx2Pos(idx: number, isCenter?: boolean) {
        let self = this;
        let grid = self.idx2Grid(idx);
        let offSetX = isCenter ? self.cellWidth / 2 : 0;
        let offSetY = isCenter ? self.cellHeight / 2 : 0;
        return { x: grid.col * self.cellHeight + offSetX, y: grid.row * self.cellWidth + offSetY };
    }

    /**
     * 
     * @param prefab 预制体
     * @param url 场景物件图片路径
     * @param anchorX 
     * @param anchorY 
     * @param completeCb 场景物件图片加载完毕回调
     * @param ctx 
     * @returns 
     */
    public getMapThingComp(prefab: Prefab, url: string, anchorX: number = 0.5, anchorY: number = 0.5, completeCb?: (imgWidth: number, imgHeight: number) => void, ctx?: any): Node {
        let node = instantiate(prefab);
        BaseUT.setPivot(node, anchorX, anchorY);
        BaseUT.setAlpha(node, 0.6);
        let loader = node.getComponent(ImgLoader);
        loader.ctx = ctx;
        loader.loadComplete = function (spriteFrame: SpriteFrame) {
            let imgWidth = spriteFrame.width, imgHeight = spriteFrame.height;
            BaseUT.setSize(node, imgWidth, imgHeight);
            if (completeCb) completeCb.call(ctx, imgWidth, imgHeight);
        }
        loader.url = url;
        return node;
    }

    /** 通过xy获取场景已有的物件*/
    public getMapThingCompByXY(x: number, y: number): Node {
        let self = this;
        let mapThingInfo = self.mapThingMap[Math.floor(x) + "_" + Math.floor(y)];
        let mapThingComp = mapThingInfo[1];
        return mapThingComp;
    }

    /**移除对应场景物件的全部触发区域格子**/
    public rmMapThingGrid(mapThingKey: String) {
        let self = this;
        let existGrid: Boolean;
        let redrawDic: { [key: string]: string } = {};
        for (let i = 0; i < self.triggerTypes.length; i++) {
            let type = self.triggerTypes[i].type;
            let typeKey: string = CONST.GridType.GridType_mapThing + type + "_" + mapThingKey;
            let gridTypeDataMap = self.gridDataMap[typeKey];
            if (gridTypeDataMap) {
                for (const areaKey in gridTypeDataMap) {
                    let areaGridMap = gridTypeDataMap[areaKey];
                    for (const gridKey in areaGridMap) {
                        delete self.gridDataMap[typeKey][areaKey][gridKey];
                        redrawDic[typeKey + "|" + areaKey] = typeKey + "_" + areaKey;
                        existGrid = true;
                    }
                }
            }
        }
        if (existGrid) emmiter.emit(CONST.GEVT.ReDarwGraphic, { redrawDic: redrawDic });
    }

    /**导出json文件到本地 */
    public exportJson() {
        let self = this;
        let mapData = self.getMapData();
        if (!mapData) return;
        FileMgr.inst.saveTextToLocal(JSON.stringify(mapData), function () {
            MessageTip.show({ msg: '保存成功' });
        });
    }

    /**获取当前地图数据 */
    public getMapData(): G.MapJsonInfo {
        let self = this;
        let gridDataMap = self.gridDataMap;
        if (!gridDataMap) return null;
        let mapJsonInfo = <G.MapJsonInfo>{};
        mapJsonInfo.mapWidth = self.mapWidth;
        mapJsonInfo.mapHeight = self.mapHeight;
        mapJsonInfo.cellWidth = self.cellWidth;
        mapJsonInfo.cellHeight = self.cellHeight;
        mapJsonInfo.totRow = self.totRow;
        mapJsonInfo.totCol = self.totCol;
        mapJsonInfo.mapType = self.mapType;
        let walkData = gridDataMap[CONST.GridType.GridType_walk] || {};//可行走
        let shelter = gridDataMap[CONST.GridType.GridType_shelter] || {};
        if (walkData) {
            mapJsonInfo.walkList = [];
            for (let i = 0; i < self.totRow; i++) {
                let linewalkList = [];//每一行
                mapJsonInfo.walkList.push(linewalkList);
                for (let j = 0; j < self.totCol; j++) {
                    let graphicsPos = { x: Math.floor(j / self.areaGraphicSize), y: Math.floor(i / self.areaGraphicSize) };
                    let areaKey = graphicsPos.x + '_' + graphicsPos.y;
                    let areaGridWalkDataMap = walkData[areaKey];
                    let areaGridShelterDataMap = shelter[areaKey];
                    if (!areaGridWalkDataMap && !areaGridShelterDataMap) {
                        linewalkList.push(CONST.WalkType.none);
                    } else {
                        let gridKey = j + "_" + i;
                        let value = areaGridWalkDataMap ? areaGridWalkDataMap[gridKey] : null;
                        if (!value) {//该格子不可行走，再判断是否半透明
                            value = areaGridShelterDataMap ? areaGridShelterDataMap[gridKey] : null;
                        }
                        linewalkList.push(value != null ? value : CONST.WalkType.none);
                    }
                }
            }
        }

        addGridDataByType(CONST.GridType.GridType_start);
        addGridDataByType(CONST.GridType.GridType_WaterVerts);
        function addGridDataByType(gridType: string) {
            let gridTypeDataMap = gridDataMap[gridType];
            if (gridTypeDataMap) {
                for (const areaKey in gridTypeDataMap) {
                    let areaGridMap = gridTypeDataMap[areaKey];
                    for (const gridKey in areaGridMap) {
                        let newList = [];
                        if (gridType == CONST.GridType.GridType_start) newList = mapJsonInfo.startList || (mapJsonInfo.startList = []);
                        else if (gridType == CONST.GridType.GridType_WaterVerts) newList = mapJsonInfo.waterVertList || (mapJsonInfo.waterVertList = []);
                        newList.push(gridKey);
                    }
                }
            }
        }

        if (self.mapThingMap) {
            let triggerTypes = self.triggerTypes;
            for (const name in self.mapThingMap) {
                let mapThingInfo: G.MapThingInfo = self.mapThingMap[name][0];
                let mapThingPropertyMap = {};//场景物件格子数据缓存字段名，对应MapThingInfo里的相应字段名
                mapThingPropertyMap[CONST.MapThingTriggerType.MapThingTrigger_light] = 'area';
                mapThingPropertyMap[CONST.MapThingTriggerType.MapThingTrigger_unWalk] = 'unWalkArea';
                mapThingPropertyMap[CONST.MapThingTriggerType.MapThingTrigger_keyManStand] = 'keyManStandArea';
                mapThingPropertyMap[CONST.MapThingTriggerType.MapThingTrigger_grass] = 'grassArea';
                for (let i = 0; i < triggerTypes.length; i++) {
                    let type = triggerTypes[i].type;
                    let gridTypeDataMap = gridDataMap[CONST.GridType.GridType_mapThing + type + "_" + Math.floor(mapThingInfo.x) + "_" + Math.floor(mapThingInfo.y)];
                    if (gridTypeDataMap) {
                        let chcheList = mapThingInfo[mapThingPropertyMap[type]] || (mapThingInfo[mapThingPropertyMap[type]] = []);
                        for (const areaKey in gridTypeDataMap) {
                            let areaGridMap = gridTypeDataMap[areaKey];
                            for (const gridKey in areaGridMap) {
                                chcheList.push(gridKey);
                            }
                        }
                    }
                }

                if (mapThingInfo.type == CONST.MapThingType.bevel) {
                    let splitGroupStr = mapThingInfo.groupIdStr?.split(",") ?? [];
                    let groupIdList = splitGroupStr.length ? [] : null;
                    for (let i = 0; i < splitGroupStr.length; i++) {
                        groupIdList.push(Number(splitGroupStr[i]));
                    }
                    let borderList = mapJsonInfo.borderList || (mapJsonInfo.borderList = []);
                    let borderData = <G.BorderData>{ x: mapThingInfo.x, y: mapThingInfo.y };
                    if (groupIdList) borderData.groupIdList = groupIdList;
                    borderList.push(borderData);
                } else {
                    let mapThingList = mapJsonInfo.mapThingList || (mapJsonInfo.mapThingList = []);
                    mapThingList.push(mapThingInfo);
                }
            }
        }
        return mapJsonInfo;
    }
}
