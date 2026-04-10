import { Graphics } from "cc";
import { SceneMgr } from "../../../../extensions/cocos-framework/src/mgr/SceneMgr";
import { UIDlg } from "../../../../extensions/cocos-framework/src/ui/UIDlg";

export namespace UT {
    /**关闭指定弹窗 */
    export function closeDlgByName(dlgNames: string[]) {
        let tray = SceneMgr.inst.curScene.dlg;
        let children = tray.children || [];
        for (let len = children.length, i = len - 1; i >= 0; i--) {
            let node = children[i];
            let className = node.name;
            if (dlgNames.indexOf(className) > -1) {
                let script = node.getComponent(className) as UIDlg;
                script.close();
            }
        }
    }

    /**
     * 绘制45度菱形颜色格子
     * @param graphics 
     * @param x 绘制位置x（网格中心点x）
     * @param y 绘制位置y (网格中心点y)
     * @param cellHalfWidth 地图路点单元宽的一半
     * @param cellHalfHeight 地图路点单元高的一半
     * @param color 格子颜色
     * @param scale 
     * @param alpha 
     */
    export function draw45AngleMapRoadPoint(graphics: Graphics, x: number, y: number, cellHalfWidth: number, cellHalfHeight: number, color?: string, scale: number = 0.95, alpha: number = 0.5) {
        let fillColor = graphics.fillColor;
        if (color) fillColor.fromHEX(color);
        fillColor.set(fillColor.r, fillColor.g, fillColor.b, alpha * 255);
        let rstWidth = cellHalfWidth * scale;
        let rstHeight = cellHalfHeight * scale;
        graphics.moveTo(-rstWidth + x, y);
        graphics.lineTo(x, -rstHeight + y);
        graphics.lineTo(rstWidth + x, y);
        graphics.lineTo(x, rstHeight + y);
        graphics.fill();
    }

    /**
     * 绘制90度矩形颜色格子
     * @param graphics 
     * @param x 绘制位置x（网格中心点x）
     * @param y 绘制位置y (网格中心点y)
     * @param cellHalfWidth 地图路点单元宽的一半
     * @param cellHalfHeight 地图路点单元高的一半
     * @param color 格子颜色
     * @param scale 
     * @param alpha 
     */
    export function draw90AngleMapRoadPoint(graphics: Graphics, x: number, y: number, cellHalfWidth: number, cellHalfHeight: number, color?: string, scale: number = 0.95, alpha: number = 0.5) {
        let fillColor = graphics.fillColor;
        if (color) fillColor.fromHEX(color);
        fillColor.set(fillColor.r, fillColor.g, fillColor.b, alpha * 255);
        let rstWidth = cellHalfWidth * scale;
        let rstHeight = cellHalfHeight * scale;
        graphics.rect(-rstWidth + x, -rstHeight + y, rstWidth * 2, rstHeight * 2);
        graphics.fill();
    }

}