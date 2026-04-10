import { CONST } from "./CONST";

export namespace G {
    /**导出json数据结构 */
    export interface MapJsonInfo {
        mapWidth: number;
        mapHeight: number;
        totRow: number;
        totCol: number;
        cellWidth: number;
        cellHeight: number;
        mapType: CONST.MapType;
        /** 路径是否可行走的二维数组，CONST.WalkType -> 0不可行走，1可行走，2可行走&&角色半透明*/
        walkList: number[][];
        blockList: string[];
        blockVertList: string[];
        waterList: string[];
        waterVertList: string[];
        startList: string[];
        mapThingList: MapThingInfo[];
        borderList: BorderData[];
    }

    export interface BorderData{
        x: number;
        y: number;
        groupIdList: number[];
    }

    /**场景物件数据结构 */
    export interface MapThingInfo {
        x: number;
        y: number;
        anchorX: number;
        anchorY: number;
        width: number;
        height: number;
        thingName: string;
        taskId: number;
        groupId: number;
        groupIdStr: string;
        type: number;
        area: string[];
        unWalkArea: string[];
        keyManStandArea: string[];
        grassArea: string[];
    }

    /**场景物件类型Json数据结构 */
    export interface ThingPramInfo {
        thingTypeList: ThingTypeList[];
    }

    /**场景物件类型列表Json数据结构 */
    export interface ThingTypeList {
        type: CONST.MapThingType;
        desc: string;
    }

    /**场景物件拖拽数据结构 */
    export interface DragMapthingInfo {
        url: string;
        /**物件名称 */
        thingName?: string;
        /**物件绑定的任务id */
        taskId?: number;
        /**物件归属的组id */
        groupId?: number;
        /**物件斜角顶点组id(1,2) */
        groupIdStr?: string;
        /**物件类型 */
        type?: number;
        /**物件锚点X */
        anchorX?: number;
        /**物件锚点Y */
        anchorY?: number;
        /**物件坐标X */
        x?: number;
        /**物件坐标Y */
        y?: number;
        isByDrag?: boolean;
    }

    /** 地图切片数据结构*/
    export interface MapFloor {
        /**切片所在列*/
        col: number,
        /**切片所在行*/
        row: number,
        /**地图切片资源名称 */
        sourceName: string,
        /**地图切片blob资源 */
        nativePath: string
    }
}