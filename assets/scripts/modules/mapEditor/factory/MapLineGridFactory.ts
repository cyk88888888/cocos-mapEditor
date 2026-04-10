import { _decorator, Graphics, instantiate, Prefab, Vec3 } from 'cc';
import { MapMgr } from '../../base/MapMgr';
import { G } from '../../base/Interface';
import { UIComp } from '../../../../../extensions/cocos-framework/src/ui/UIComp';
import { CONST } from '../../base/CONST';
const { ccclass, property } = _decorator;
/** 
 * @descripttion 地图网格线条绘制工厂
 * @author cyk
 * @date 2023-06-30 23:00:00
 */
@ccclass('MapLineGridFactory')
export class MapLineGridFactory extends UIComp {
    /** 地图网格线条*/
    public graphicsLine: Graphics;

    private mapMgr: MapMgr;
    /** 是否绘制辅助线*/
    private _showAuxiliaryLine: boolean;
    protected ctor(): void {
        let self = this;
        self._showAuxiliaryLine = false;
    }

    protected onEnter(): void {
        let self = this;
        self.mapMgr = MapMgr.inst;
        self.graphicsLine = self.getComponent(Graphics);
    }

    public init(data: {mapData: G.MapJsonInfo, thingPram: G.ThingPramInfo}) {
        let self = this;
        let mapData = data.mapData;
        let cellWidth = mapData.cellWidth;
        let cellHeight = mapData.cellHeight;
        let mapWidth = mapData.mapWidth;
        let mapHeight = mapData.mapHeight;
        let totCol = Math.ceil(mapWidth / cellWidth);
        let totRow = Math.ceil(mapHeight / cellHeight);
        let totGrid = totRow * totCol;//总格子数
        self.mapMgr.areaGraphicSize = totGrid < 65536 ? 16 : totGrid < 300000 ? 32 : 64
        let mapType = self.mapMgr.mapType;
        if (mapType == CONST.MapType.angle45) {
            self.mapMgr.totCol = totCol;
            self.mapMgr.totRow = 2 * totRow;
            self.draw45AngleGrid(totRow, totCol, cellWidth, cellHeight);
        } else if (mapType == CONST.MapType.angle90) {
            self.mapMgr.totCol = totCol;
            self.mapMgr.totRow = totRow;
            self.draw90AngleGrid(totRow, totCol, cellWidth, cellHeight);
        }

    }

    /**绘制45等视角网格 */
    private draw45AngleGrid(totRow: number, totCol: number, cellWidth: number, cellHeight: number) {
        let self = this;
        let halfCeilWidth = cellWidth / 2;
        let halfCeilHeight = cellHeight / 2;
        let doubleCol = 2 * totCol + 1;
        let doubleRow = 2 * totRow + 1;
        let max_x = doubleCol * halfCeilWidth;
        let max_y = doubleRow * halfCeilHeight;


        let lineGraphics = self.graphicsLine;
        lineGraphics.clear();
        lineGraphics.lineWidth = 2;
        //绘制辅助线
        if (self._showAuxiliaryLine) {
            lineGraphics.strokeColor.fromHEX('#11115566');
            for (let i = 0; i < doubleRow + 1; i++) {
                lineGraphics.moveTo(0, i * halfCeilHeight);
                lineGraphics.lineTo(max_x, i * halfCeilHeight);
            }
            for (let i = 0; i < doubleCol + 1; i++) {
                lineGraphics.moveTo(i * halfCeilWidth, 0);
                lineGraphics.lineTo(i * halfCeilWidth, max_y);
            }
            lineGraphics.stroke();
        }

        //绘制菱形网格
        lineGraphics.strokeColor.fromHEX('#9E9E9E');
        let startX: number, startY: number, endX: number, endY: number;
        for (let i = 1; i < doubleCol + doubleRow; i++) {
            if (i % 2 == 1) {
                startX = i * halfCeilWidth;
                startY = 0;
                endX = 0;
                endY = i * halfCeilHeight;
                if (startX > max_x) {
                    startX = max_x;
                    startY = (i - doubleCol) * halfCeilHeight;
                }
                if (endY > max_y) {
                    endX = (i - doubleRow) * halfCeilWidth;
                    endY = max_y;
                }
            } else {
                startX = i * halfCeilWidth;
                startY = max_y;
                endX = 0;
                endY = (doubleRow - i) * halfCeilHeight;
                if (startX > max_x) {
                    startX = max_x;
                    startY = (doubleRow - (i - doubleCol)) * halfCeilHeight;
                }
                if (endY < 0) {
                    endX = (i - doubleRow) * halfCeilWidth;
                    endY = 0
                }
            }
            lineGraphics.moveTo(startX, startY);
            lineGraphics.lineTo(endX, endY);
        }
        lineGraphics.stroke();
    }

    /**绘制矩形网格 */
    private draw90AngleGrid(totRow: number, totCol: number, cellWidth: number, cellHeight: number) {
        let self = this;
        let lineGraphics = self.graphicsLine;
        lineGraphics.clear();
        lineGraphics.strokeColor.fromHEX('#9E9E9E');
        lineGraphics.lineWidth = 1;
        for (let i = 0; i < totCol + 1; i++)//画竖线
        {
            lineGraphics.moveTo(i * cellWidth, 0);
            lineGraphics.lineTo(i * cellWidth, totRow * cellHeight);
        }

        for (let i = 0; i < totRow + 1; i++)//画横线
        {
            lineGraphics.moveTo(0, i * cellHeight);
            lineGraphics.lineTo(totCol * cellHeight, i * cellWidth);
        }
        lineGraphics.stroke();
    }
}


