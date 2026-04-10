import { Graphics } from "cc";
import MapRoadUtils from "../road/MapRoadUtils";
import ObstacleLine from "./ObstacleLine";
import ObstacleLineData from "./ObstacleLineData";
import PathFindingAgent from "../road/PathFindingAgent";
import RoadNode from "../road/RoadNode";
import { CONST } from "../base/CONST";

export default class ObstacleEdgeUtils {

    private static _instance: ObstacleEdgeUtils;

    public static get instance(): ObstacleEdgeUtils {
        if (this._instance == null) {
            this._instance = new ObstacleEdgeUtils();
        }
        return this._instance;
    }

    private _edgeMap: { [key: string]: ObstacleLineData };
    private _edgeLines: ObstacleLine[];
    public showObstacleEdge(graphic: Graphics) {
        let obstacles = this.getObstacleEdge();
        let edgeMap = obstacles.edgeMap;
        let edgeLines = obstacles.edgeLines;
        graphic.clear();
        graphic.lineWidth = 2.4;
        graphic.strokeColor.fromHEX("#ffff00");
        graphic.fillColor.fromHEX("#ff0000");
        let halfNodeWidth = MapRoadUtils.instance.nodeWidth / 2, halfNodeHeight = MapRoadUtils.instance.nodeHeight / 2, mapType = MapRoadUtils.instance.mapType;
        for (let key in edgeMap) {
            if (edgeMap[key]) {
                let roadNode = MapRoadUtils.instance.getNodeByWorldPoint(edgeMap[key].x + .5, edgeMap[key].y + .5);
                if (mapType == CONST.MapType.angle45) {
                    graphic.circle(roadNode.px, roadNode.py - halfNodeHeight, 5);
                } else if (mapType == CONST.MapType.angle90) {
                    graphic.circle(roadNode.px - halfNodeWidth, roadNode.py - halfNodeHeight, 5);
                }
                graphic.fill();
            }
        }
        for (let len = edgeLines.length, i = 0; i < len; i++) {
            graphic.moveTo(edgeLines[i].startX, edgeLines[i].startY);
            graphic.lineTo(edgeLines[i].endX, edgeLines[i].endY);
            graphic.stroke();
        }
    }

    public getObstacleEdge() {
        let self = this;
        if (!self._edgeMap || !self._edgeLines) {
            self._edgeMap = this.getEdge();
            this.optimizeEdge(self._edgeMap);
            self._edgeLines = this.getEdgeLine(self._edgeMap);
        }

        return { edgeMap: self._edgeMap, edgeLines: self._edgeLines };
    }

    /** 优化边缘*/
    private optimizeEdge(edgeMap: { [key: string]: ObstacleLineData }) {
        let deleteKeys = [];
        for (let key in edgeMap) {
            let obstacleLineData = edgeMap[key];
            let leftAndRight = null != obstacleLineData.left && null != obstacleLineData.right;
            let upAndDown = null != obstacleLineData.up && null != obstacleLineData.down;
            if (leftAndRight && !upAndDown) {
                obstacleLineData.left.right = obstacleLineData.right;
                obstacleLineData.right.left = obstacleLineData.left;
                obstacleLineData.left = null;
                obstacleLineData.right = null;
                deleteKeys.push(key);
            }
            if (!leftAndRight && upAndDown) {
                obstacleLineData.up.down = obstacleLineData.down;
                obstacleLineData.down.up = obstacleLineData.up;
                obstacleLineData.up = null;
                obstacleLineData.down = null;
                deleteKeys.push(key);
            }
        }
        for (let len = deleteKeys.length, i = 0; i < len; i++) {
            let key = deleteKeys[i];
            delete edgeMap[key];
        }
    }

    private getEdgeLine(edgeMap: { [key: string]: ObstacleLineData }): ObstacleLine[] {
        let mapRoadUtils = MapRoadUtils.instance;
        let halfNodeWidth = mapRoadUtils.nodeWidth / 2;
        let halfNodeHeight = mapRoadUtils.nodeHeight / 2;
        let mapType = mapRoadUtils.mapType;
        let curNode: RoadNode;
        let tempNode: RoadNode;
        let startX = 0, startY = 0, endX = 0, endY = 0;
        let obstacleLines = [];
        for (let key in edgeMap) {
            let lineData = edgeMap[key];
            curNode = mapRoadUtils.getNodeByWorldPoint(lineData.x + .5, lineData.y + .5);
            startX = mapType == CONST.MapType.angle45 ? curNode.px : mapType == CONST.MapType.angle90 ? curNode.px - halfNodeWidth : 0;
            startY = curNode.py - halfNodeHeight;
            let obstacleLine: ObstacleLine;
            if (lineData.left && !lineData.connectLeft) {
                tempNode = mapRoadUtils.getNodeByWorldPoint(lineData.left.x + .5, lineData.left.y + .5);
                endX = mapType == CONST.MapType.angle45 ? tempNode.px : mapType == CONST.MapType.angle90 ? tempNode.px - halfNodeWidth : 0;
                endY = tempNode.py - halfNodeHeight;
                obstacleLine = new ObstacleLine();
                obstacleLine.moveTo(startX, startY);
                obstacleLine.lineTo(endX, endY);
                obstacleLines.push(obstacleLine);
                lineData.connectLeft = true;
                lineData.left.connectRight = true;
            }

            if (lineData.up && !lineData.connectUp) {
                tempNode = mapRoadUtils.getNodeByWorldPoint(lineData.up.x + .5, lineData.up.y + .5);
                endX = mapType == CONST.MapType.angle45 ? tempNode.px : mapType == CONST.MapType.angle90 ? tempNode.px - halfNodeWidth : 0;
                endY = tempNode.py - halfNodeHeight;
                obstacleLine = new ObstacleLine();
                obstacleLine.moveTo(startX, startY);
                obstacleLine.lineTo(endX, endY);
                obstacleLines.push(obstacleLine);
                lineData.connectUp = true;
                lineData.up.connectDown = true;
            }

            if (lineData.right && !lineData.connectRight) {
                tempNode = mapRoadUtils.getNodeByWorldPoint(lineData.right.x + .5, lineData.right.y + .5);
                endX = mapType == CONST.MapType.angle45 ? tempNode.px : mapType == CONST.MapType.angle90 ? tempNode.px - halfNodeWidth : 0;
                endY = tempNode.py - halfNodeHeight;
                obstacleLine = new ObstacleLine();
                obstacleLine.moveTo(startX, startY);
                obstacleLine.lineTo(endX, endY);
                obstacleLines.push(obstacleLine);
                lineData.connectRight = true;
                lineData.right.connectLeft = true;
            }

            if (lineData.down && !lineData.connectDown) {
                tempNode = mapRoadUtils.getNodeByWorldPoint(lineData.down.x + .5, lineData.down.y + .5);
                endX = mapType == CONST.MapType.angle45 ? tempNode.px : mapType == CONST.MapType.angle90 ? tempNode.px - halfNodeWidth : 0;
                endY = tempNode.py - halfNodeHeight;
                obstacleLine = new ObstacleLine();
                obstacleLine.moveTo(startX, startY);
                obstacleLine.lineTo(endX, endY);
                obstacleLines.push(obstacleLine);
                lineData.connectDown = true;
                lineData.down.connectUp = true;
            }
        }
        return obstacleLines;
    }

    private getEdge(): { [key: string]: ObstacleLineData } {
        let mapType = MapRoadUtils.instance.mapType;
        return mapType == CONST.MapType.angle45 ? this.getEdge45Angle() : mapType == CONST.MapType.angle90 ? this.getEdge90Angle() : {};
    }

    private getEdge45Angle() {
        let row = MapRoadUtils.instance.row, col = MapRoadUtils.instance.col, cx = 0, cy = 0, edgeMap: { [key: string]: ObstacleLineData } = {};
        for (let dy = 0; dy <= row; dy++) {
            for (let dx = 0; dx <= col; dx++) {
                let obstacleLineData: ObstacleLineData, node = MapRoadUtils.instance.getNodeByDerect(dx, dy);
                cx = node.cx;
                cy = node.cy;
                if (node.dx == 0 && node.dy % 2 == 0) {
                    obstacleLineData = new ObstacleLineData(cx - 0.5, cy + 0.5);
                    edgeMap[obstacleLineData.x + "_" + obstacleLineData.y] = obstacleLineData;
                }
                if (node.dx < col && node.dy == row) {
                    obstacleLineData = new ObstacleLineData(cx + 0.5, cy - 0.5);
                    edgeMap[obstacleLineData.x + "_" + obstacleLineData.y] = obstacleLineData;
                }
                if (node.dx == col && node.dy % 2 == 0 || node.dy == row) {
                    this.saveLeftDownCornerQuadData(cx, cy, edgeMap);
                }
                else {
                    let curNode = PathFindingAgent.inst.getRoadNode(cx, cy);
                    if (!curNode) continue;
                    let leftNode = PathFindingAgent.inst.getRoadNode(cx - 1, cy);
                    let leftDownNode = PathFindingAgent.inst.getRoadNode(cx - 1, cy - 1);
                    let downNode = PathFindingAgent.inst.getRoadNode(cx, cy - 1);
                    if (this.isEnableValue(curNode.value)) {
                        if (this.isOutEdgeNode(leftNode) || this.isOutEdgeNode(leftDownNode) || this.isOutEdgeNode(downNode)) this.saveLeftDownCornerQuadData(cx, cy, edgeMap);
                    } else {
                        if (!this.isDisableValue(curNode.value) || !this.isOutEdgeNode(leftNode) || !this.isOutEdgeNode(leftDownNode) || !this.isOutEdgeNode(downNode)) this.saveLeftDownCornerQuadData(cx, cy, edgeMap);
                    }
                }
            }
        }
        return edgeMap;
    }

    private getEdge90Angle() {
        let row = MapRoadUtils.instance.row, col = MapRoadUtils.instance.col, edgeMap: { [key: string]: ObstacleLineData } = {};
        for (let cy = 0; cy <= row; cy++) {
            for (let cx = 0; cx <= col; cx++) {
                if (cx == col || cy == row) {
                    this.saveLeftDownCornerQuadData(cx, cy, edgeMap);
                } else {
                    let curNode = PathFindingAgent.inst.getRoadNode(cx, cy);
                    let leftNode = PathFindingAgent.inst.getRoadNode(cx - 1, cy);
                    let downLeftNode = PathFindingAgent.inst.getRoadNode(cx - 1, cy - 1);
                    let downNode = PathFindingAgent.inst.getRoadNode(cx, cy - 1);
                    if (this.isEnableValue(curNode.value)) {
                        if (this.isOutEdgeNode(leftNode) || this.isOutEdgeNode(downLeftNode) || this.isOutEdgeNode(downNode)) this.saveLeftDownCornerQuadData(cx, cy, edgeMap);
                    } else {
                        if (!this.isDisableValue(curNode.value) || !this.isOutEdgeNode(leftNode) || !this.isOutEdgeNode(downLeftNode) || !this.isOutEdgeNode(downNode)) this.saveLeftDownCornerQuadData(cx, cy, edgeMap);
                    }
                }
            }
        }
        return edgeMap;
    }

    private saveLeftDownCornerQuadData(cx: number, cy: number, edgeMap: { [key: string]: ObstacleLineData }) {
        let lineData = new ObstacleLineData(cx - 0.5, cy - 0.5);
        edgeMap[lineData.x + "_" + lineData.y] = lineData;
        let leftUpNode = PathFindingAgent.inst.getRoadNode(lineData.x - 0.5, lineData.y + 0.5);
        let rightUpNode = PathFindingAgent.inst.getRoadNode(lineData.x + 0.5, lineData.y + 0.5);
        let rightDownNode = PathFindingAgent.inst.getRoadNode(lineData.x + 0.5, lineData.y - 0.5);
        let leftDownNode = PathFindingAgent.inst.getRoadNode(lineData.x - 0.5, lineData.y - 0.5);
        let leftLineData = edgeMap[lineData.x - 1 + "_" + lineData.y];
        if (leftLineData && ((!this.isOutEdgeNode(leftUpNode) && this.isOutEdgeNode(leftDownNode)) || (this.isOutEdgeNode(leftUpNode) && !this.isOutEdgeNode(leftDownNode)))) {
            lineData.left = leftLineData;
            leftLineData.right = lineData;
        }

        let upLineData = edgeMap[lineData.x + "_" + (lineData.y + 1)];
        if (upLineData && ((!this.isOutEdgeNode(leftUpNode) && this.isOutEdgeNode(rightUpNode)) || (this.isOutEdgeNode(leftUpNode) && !this.isOutEdgeNode(rightUpNode)))) {
            lineData.up = upLineData;
            upLineData.down = lineData;
        }

        let rightLineData = edgeMap[lineData.x + 1 + "_" + lineData.y];
        if (rightLineData && ((!this.isOutEdgeNode(rightUpNode) && this.isOutEdgeNode(rightDownNode)) || (this.isOutEdgeNode(rightUpNode) && !this.isOutEdgeNode(rightDownNode)))) {
            lineData.right = rightLineData;
            rightLineData.left = lineData;
        }

        let downLineData = edgeMap[lineData.x + "_" + (lineData.y - 1)];
        if (downLineData && ((!this.isOutEdgeNode(leftDownNode) && this.isOutEdgeNode(rightDownNode)) || (this.isOutEdgeNode(leftDownNode) && !this.isOutEdgeNode(rightDownNode)))) {
            lineData.down = downLineData;
            downLineData.up = lineData;
        }
    }

    private isEnableValue(value: number) {
        if (value != 0) return true;
    }

    private isDisableValue(value: number) {
        if (value == 0) return true;
    }

    private isOutEdgeNode(roadNode: RoadNode) {
        return !(roadNode && !this.isDisableValue(roadNode.value));
    }

    public clear() {
        let self = this;
        self._edgeMap = null;
        self._edgeLines = null;
    }
}
