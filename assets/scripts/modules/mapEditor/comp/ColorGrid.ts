import { _decorator, Graphics } from 'cc';
import { UIComp } from '../../../../../extensions/cocos-framework/src/ui/UIComp';
import { UT } from '../../base/UT';
const { ccclass, property } = _decorator;

@ccclass('ColorGrid')
export class ColorGrid extends UIComp {
     private _graphics: Graphics;
     /**
      * 绘制45度菱形颜色格子
      * @param color 格子颜色
      * @param x 绘制位置x（网格中心点x）
      * @param y 绘制位置y (网格中心点y)
      * @param cellHalfWidth 地图路点单元宽的一半
      * @param cellHalfHeight 地图路点单元高的一半
      * @param alpha 格子颜色透明度
      */
     public draw45AngleMapRoadPoint(color: string, x: number, y: number, cellHalfWidth: number, cellHalfHeight: number, alpha: number = 0.5) {
          let self = this;
          if (!self._graphics) self._graphics = self.node.getComponent(Graphics);
          UT.draw45AngleMapRoadPoint(self._graphics, x, y, cellHalfWidth, cellHalfHeight, color);
     }

     /**
     * 绘制90度矩形颜色格子
     * @param color 格子颜色
     * @param x 绘制位置x（网格中心点x）
     * @param y 绘制位置y (网格中心点y)
     * @param cellHalfWidth 地图路点单元宽的一半
     * @param cellHalfHeight 地图路点单元高的一半
     * @param alpha 格子颜色透明度
     */
     public draw90AngleMapRoadPoint(color: string, x: number, y: number, cellHalfWidth: number, cellHalfHeight: number, alpha: number = 0.5) {
          let self = this;
          if (!self._graphics) self._graphics = self.node.getComponent(Graphics);
          UT.draw90AngleMapRoadPoint(self._graphics, x, y, cellHalfWidth, cellHalfHeight, color);
     }

     public clear() {
          let self = this;
          self._graphics.clear();
     }
}


