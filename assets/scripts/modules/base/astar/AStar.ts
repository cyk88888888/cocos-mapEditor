import { _decorator, game } from 'cc';
import { RoadNode } from './RoadNode';
import { PathQuadSeek } from './PathQuadSeek';
import { PathOptimize } from './PathOptimize';
import { BinaryTreeNode } from './BinaryTreeNode';
import { emmiter } from '../../../../../extensions/cocos-framework/src/base/Emmiter';
import { CONST } from '../CONST';
const { ccclass } = _decorator;
/**
 * @Desc: A*寻路（45度等视角地图 || 90度平面地图）
 * @Author: cyk
 * @Date: 2023-06-30 22:00:00
 */
@ccclass('AStar')
export class AStar {
    /** 横向移动一个格子的代价*/
    private COST_STRAIGHT = 10;

    /** 斜向移动一个格子的代价*/
    private COST_DIAGONAL = 14;

    /** 最大搜寻步骤数，超过这个值时表示找不到目标*/
    private maxStep = 100000;

    /** 开启列表*/
    private _openlist: Array<RoadNode>;

    /** 关闭列表*/
    private _closelist: Array<RoadNode>;

    /** 二叉堆存储结构*/
    private _binaryTreeNode: BinaryTreeNode;

    /** 开始节点*/
    private _startNode: RoadNode;

    /** 当前检索节点*/
    private _currentNode: RoadNode;

    /** 目标节点*/
    private _targetNode: RoadNode;

    /** 地图路点数据*/
    private _roadNodes: { [key: string]: RoadNode };

    /** 用于检索一个节点周围上下左右4个点的向量数组*/
    private _round1: number[][];

    /** 用于检索一个节点周围8个点的向量数组*/
    private _round2: number[][];

    /** 用于检索一个节点周围n个点的向量数组，默认8个方向*/
    private _round: number[][];

    /** 寻路角色体积周围一圈的偏移值*/
    private _neighbours: number[][];

    /** 寻路角色体积周围一圈的偏移值map缓存*/
    private _neighboursDic: { [size: number]: number[][] };

    private handle = -1;

    /** 是否优化路径*/
    private optimize = true;

    /** 优化类型，默认使用最短路径的优化*/
    private _pathOptimize = PathOptimize.none;

    /** 默认使用8方向寻路*/
    private _pathQuadSeek = PathQuadSeek.path_dire_8;

    /** 自定义一个路点是否能通过，如果是null，则用默认判断条件*/
    private _isPassCallBack: Function = null;

    private _isPassCallBackCtx: any = null;

    /** 计算本次寻路的总耗时 */
    public costTotTime: number;

    /** 计算本次寻路的开始时间*/
    private _startCalculateTime: number;

    /** 分帧计算时，上一帧结束的时间*/
    private _lastSearchTime: number;

    private _isFinding: boolean;

    private _findingNode: RoadNode;

    /** 角色大小，单位：圈（以指定格子为中心的圈）*/
    private _size = 0;

    private _path: RoadNode[];

    /** 本次寻路总步数*/
    private _step = 0;

    /** 是否停止寻路*/
    private _isStopSearch: boolean;

    /** 总行数*/
    private _totRow: number;

    /** 总列数*/
    private _totCol: number;

    /** 格子宽*/
    private _cellWidth: number;

    /** 格子高*/
    private _cellHeight: number;

    /** 格子数据*/
    private _walkList: number[][];
    public constructor() {
        let self = this;
        self._roadNodes = {};
        self._binaryTreeNode = new BinaryTreeNode();
        self._round1 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        self._round2 = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
        self._round = self._round2;
        self._neighboursDic = {};
        // emmiter.on(CONST.GEVT.ChgGridWalkable, self.onGridWalkChg, self);
    }

    /**
     * 初始化
     * @param totRow 总行数
     * @param totCol 总列数
     * @param cellWidth 格子宽
     * @param cellHeight 格子高
     * @param walkList 行走格子数据
     */
    public init(totRow: number, totCol: number, cellWidth: number, cellHeight:number, walkList: number[][]) {
        this._totRow = totRow;
        this._totCol = totCol;
        this._cellWidth = cellWidth;
        this._cellHeight = cellHeight;
        this._walkList = walkList;
    }

    /**
     * 设置最大寻路步骤
     * @param maxStep
     */
    public setMaxSeekStep(maxStep: number) {
        this.maxStep = maxStep;
    }

    /**
     * 设置路径优化等级
     * @param optimize
     */
    public setPathOptimize(optimize: PathOptimize) {
        this._pathOptimize = optimize;
    }

    /**
     * 设置4方向路点的寻路类型
     * @param pathQuadSeek
     */
    public setPathQuadSeek(pathQuadSeek: PathQuadSeek) {
        this._pathQuadSeek = pathQuadSeek;
        if (this._pathQuadSeek == PathQuadSeek.path_dire_4) {
            this._round = this._round1; //如果是4方向寻路，则只需初始化4方向的寻路向量数组
        }
        else {
            this._round = this._round2; //如果是8方向寻路，则只需初始化8方向的寻路向量数组
        }
    }

    /**
     * 定义一个路点是否能通过，如果参数是null，则用默认判断条件
     * @param callback
     */
    public setRoadNodePassCondition(callback: Function, ctx: any) {
        this._isPassCallBack = callback;
        this._isPassCallBackCtx = ctx;
    }

    /**
     * 寻路入口方法
     * @param {number} startX
     * @param {number} startY
     * @param {number} targetX
     * @param targetY
     * @param {number} size 角色大小，单位：圈（以指定格子为中心的圈）
     * @param {boolean} frameDelay 是否分帧
     * @returns {Array<G.RoadNode>}
     */
    public findPath(startX: number, startY: number, targetX: number, targetY: number, size?: number, frameDelay?: boolean): Array<RoadNode> {
        let self = this;
        if (self._isFinding) {
            console.warn("无法寻路，上一次寻路操作还在进行中");
            return;
        }
        let startGrid = self.posToGrid(startX, startY);
        let targetGrid = self.posToGrid(targetX, targetY);
        self._startNode = self.getRoadNode(startGrid.col, startGrid.row);
        self._findingNode = self._startNode;
        self._targetNode = self.getRoadNode(targetGrid.col, targetGrid.row);
        if (!self._startNode || !self._targetNode)
            return [];
        if (self._startNode == self._targetNode) {
            return [self._targetNode];
        }
        self._neighbours = self.getNeighbours(size);
        if (!self.isCanPass(this._targetNode)) {
            console.warn(`目标不可达到!!! 起始点行列: ${self._startNode.row},${self._startNode.col}, 结束点行列: ${self._targetNode.row},${self._targetNode.col}, 角色大小: ${size}`);
            return [];
        }
        self._startNode.g = 0; //重置起始节点的g值
        self._startNode.resetTree(); //清除起始节点原有的二叉堆关联关系
        self._binaryTreeNode.refleshTag(); //刷新二叉堆tag，用于后面判断是不是属于当前次的寻路
        self._step = 0;
        let time = self.getTime();
        self._startCalculateTime = time;
        self._lastSearchTime = time;
        self._path = null;
        self._size = size;
        self._isFinding = true;
        if (frameDelay)
            self.search(frameDelay);
        else
            return self.search();
    }

    /** 继续寻路*/
    public findPathContinue() {
        let self = this;
        if (!self._targetNode)
            return;
        if (self._isFinding && !self._path)
            self.search(true);
    }

    /** 停止寻路*/
    public stopFindingPath() {
        let self = this;
        self._isStopSearch = true;
        self._isFinding = false;
    }

    public search(frameDelay?: boolean): Array<RoadNode> {
        let self = this;
        self._isStopSearch = false;
        this._currentNode = frameDelay ? self._findingNode : self._startNode;
        let searchTime;
        if (frameDelay) {
            searchTime = 2 * Math.ceil(1000 / Number(game.frameRate));
        }
        while (true) {
            if (self._isStopSearch) {
                console.warn("强制停止寻路");
                return null;
            }
            if (self._step > this.maxStep) {
                self._isFinding = false;
                // let totTime = this.getTime() - this._startCalculateTime;
                // console.warn(`超过最大寻路步数{${this.maxStep}}, 没找到目标，计算步骤为：${self._step}, 总耗时: ${totTime}ms, 起始点行列：${this._startNode.row},${this._startNode.col}, 结束点行列: ${this._targetNode.row},${this._targetNode.col}, 角色大小: ${this._size}`);
                return [];
            }
            self._step++;
            this.searchRoundNodes(this._currentNode);
            if (this._binaryTreeNode.isTreeNull()) {
                self._isFinding = false;
                // let totTime = this.getTime() - this._startCalculateTime;
                // console.warn(`没找到目标，计算步骤为：${self._step}, 总耗时: ${totTime}ms, 起始点行列：${this._startNode.row},${this._startNode.col}, 结束点行列: ${this._targetNode.row},${this._targetNode.col}, 角色大小: ${this._size}`);
                return [];
            }
            this._currentNode = this._binaryTreeNode.getMin_F_Node();
            if (frameDelay) {
                let now = self.getTime();
                let passTime = now - self._lastSearchTime;
                if (passTime >= searchTime) {
                    self._lastSearchTime = now;
                    self._findingNode = this._currentNode;
                    // console.warn(`触发了分帧寻路，已检索时间：${passTime}ms，当前检索到的点行列：${self._findingNode.row}，${self._findingNode.col}`);
                    return null;
                }
            }
            if (this._currentNode == this._targetNode) {
                self.costTotTime = this.getTime() - this._startCalculateTime;
                // console.log(`找到目标计算步骤为: ${self._step}，总耗时: ${self.costTotTime}ms`);
                self._isFinding = false;
                return this.getPath();
            }
            else {
                this._binaryTreeNode.setRoadNodeInCloseList(this._currentNode); //打入关闭列表标记
            }
        }
    }

    /**
     * 测试寻路步骤
     * @param {number} startX
     * @param {number} startY
     * @param {number} targetX
     * @param targetY
     * @param {number} size 角色大小，单位：圈（以指定格子为中心的圈）
     * @param {Function} callback
     * @param target
     * @param {number} time
     */
    public testFindPathStep(startX: number, startY: number, targetX: number, targetY: number, size: number, callback: Function, target: any, time: number = 100) {
        let self = this;
        let startGrid = self.posToGrid(startX, startY);
        let targetGrid = self.posToGrid(targetX, targetY);
        self._startNode = self.getRoadNode(startGrid.col, startGrid.row);
        self._currentNode = self._startNode;
        self._targetNode = self.getRoadNode(targetGrid.col, targetGrid.row);
        self._neighbours = self.getNeighbours(size);
        if (!self.isCanPass(self._targetNode)) {
            console.warn(`目标不可达到!!! 起始点行列: ${self._startNode.row},${self._startNode.col}, 结束点行列: ${self._targetNode.row},${self._targetNode.col}, 角色大小: ${size}`);
            return;
        }
        this._startNode.g = 0; //重置起始节点的g值
        this._startNode.resetTree(); //清除起始节点原有的二叉堆关联关系
        this._binaryTreeNode.refleshTag(); //刷新二叉堆tag，用于后面判断是不是属于当前次的寻路
        //this._binaryTreeNode.addTreeNode(this._startNode); //把起始节点设置为二叉堆结构的根节点
        this._closelist = [];
        let step = 0;
        clearInterval(this.handle);
        this.handle = setInterval(function () {
            if (step > self.maxStep) {
                console.warn("超过目标计算步骤为：", step);
                clearInterval(self.handle);
                return;
            }
            step++;
            self.searchRoundNodes(self._currentNode);
            if (self._binaryTreeNode.isTreeNull()) {
                console.warn(`超过寻路最大步数!!! 起始点行列: ${self._startNode.row},${self._startNode.col}, 结束点行列: ${self._targetNode.row},${self._targetNode.col}, 角色大小: ${size}`);
                clearInterval(self.handle);
                return;
            }
            self._currentNode = self._binaryTreeNode.getMin_F_Node();
            if (self._currentNode == self._targetNode) {
                console.log("找到目标，计算步骤为：", step);
                clearInterval(self.handle);
                self._openlist = self._binaryTreeNode.getOpenList();
                callback.apply(target, [self._startNode, self._targetNode, self._currentNode, self._openlist, self._closelist, self.getPath()]);
            }
            else {
                self._binaryTreeNode.setRoadNodeInCloseList(self._currentNode); //打入关闭列表标记
                self._openlist = self._binaryTreeNode.getOpenList();
                self._closelist.push(self._currentNode);
                callback.apply(target, [self._startNode, self._targetNode, self._currentNode, self._openlist, self._closelist, null]);
            }
        }, time);
    }

    /**
     * 获得最终寻路到的所有路点
     * @return
     */
    public getPath() {
        let nodeArr: Array<RoadNode> = this._path = [];
        let node = this._targetNode;
        while (node != this._startNode) {
            nodeArr.unshift(node);
            node = node.parent;
        }
        nodeArr.unshift(this._startNode);
        //如果不优化，则直接返回完整寻路路径
        if (this._pathOptimize == PathOptimize.none) {
            return nodeArr;
        }
        //第一阶段优化： 对横，竖，正斜进行优化
        //把多个节点连在一起的，横向或者斜向的一连串点，除两边的点保留
        for (let i = 1; i < nodeArr.length - 1; i++) {
            let preNode = nodeArr[i - 1];
            let midNode = nodeArr[i];
            let nextNode = nodeArr[i + 1];
            let bool1 = midNode.col == preNode.col && midNode.col == nextNode.col;
            let bool2 = midNode.row == preNode.row && midNode.row == nextNode.row;
            let bool3 = false;
            if (this._pathQuadSeek == PathQuadSeek.path_dire_8) {
                bool3 = ((midNode.col - preNode.col) / (midNode.row - preNode.row)) * ((nextNode.col - midNode.col) / (nextNode.row - midNode.row)) == 1;
            }
            if (bool1 || bool2 || bool3) {
                nodeArr.splice(i, 1);
                i--;
            }
        }
        //如果寻路类型是4方向寻路，则直接返回第一阶段的优化结果。
        //（因为4方向寻路是用不到第二阶段优化的，否则进入第二阶段优化的话，路径就不按上下左右相连了，这并不是4方寻路想要的结果）
        if (this._pathQuadSeek == PathQuadSeek.path_dire_4) {
            return nodeArr;
        }
        //如果只需要优化到第一阶段，则直接返回第一阶段的优化结果
        if (this._pathOptimize == PathOptimize.better) {
            return nodeArr;
        }
        //第二阶段优化：对不在横，竖，正斜的格子进行优化
        for (let i = 0; i < nodeArr.length - 2; i++) {
            let startNode = nodeArr[i];
            let optimizeNode = null;
            let j: number;
            //优先从尾部对比，如果能直达就把中间多余的路点删掉
            for (j = nodeArr.length - 1; j > i + 1; j--) {
                let targetNode = nodeArr[j];
                //在第一阶段优已经优化过横，竖，正斜了，所以再出现是肯定不能优化的，可以忽略
                if (startNode.col == targetNode.col || startNode.row == targetNode.row || Math.abs(targetNode.col - startNode.col) == Math.abs(targetNode.row - startNode.row)) {
                    continue;
                }
                if (this.isArriveBetweenTwoNodes(startNode, targetNode)) {
                    optimizeNode = targetNode;
                    break;
                }
            }
            if (optimizeNode) {
                let optimizeLen = j - i - 1;
                nodeArr.splice(i + 1, optimizeLen);
            }
        }
        return nodeArr;
    }

    /**
     * 两点之间是否可到达
     */
    public isArriveBetweenTwoNodes(startNode: RoadNode, targetNode: RoadNode) {
        if (startNode == targetNode) {
            return false;
        }
        let disX = Math.abs(targetNode.col - startNode.col);
        let disY = Math.abs(targetNode.row - startNode.row);
        let dirX = 0;
        if (targetNode.col > startNode.col) {
            dirX = 1;
        }
        else if (targetNode.col < startNode.col) {
            dirX = -1;
        }
        let dirY = 0;
        if (targetNode.row > startNode.row) {
            dirY = 1;
        }
        else if (targetNode.row < startNode.row) {
            dirY = -1;
        }
        let rx = 0;
        let ry = 0;
        let intNum = 0;
        let decimal = 0;
        if (disX > disY) {
            let rate = disY / disX;
            for (let i = 0; i < disX; i++) {
                ry = startNode.row + i * dirY * rate;
                intNum = Math.floor(ry);
                decimal = ry % 1;
                let col1 = startNode.col + i * dirX;
                let row1 = decimal <= 0.5 ? intNum : intNum + 1;
                ry = startNode.row + (i + 1) * dirY * rate;
                intNum = Math.floor(ry);
                decimal = ry % 1;
                let col2 = startNode.col + (i + 1) * dirX;
                let row2 = decimal <= 0.5 ? intNum : intNum + 1;
                let node1 = this.getRoadNode(col1, row1);
                let node2 = this.getRoadNode(col2, row2);
                //cc.log(i + "  :: " + node1.row," yy ",startNode.row + i * rate,ry % 1);
                if (!this.isCrossAtAdjacentNodes(node1, node2)) {
                    return false;
                }
            }
        }
        else {
            let rate = disX / disY;
            for (let i = 0; i < disY; i++) {
                rx = i * dirX * rate;
                intNum = dirX > 0 ? Math.floor(startNode.col + rx) : Math.ceil(startNode.col + rx);
                decimal = Math.abs(rx % 1);
                let col1 = decimal <= 0.5 ? intNum : intNum + 1 * dirX;
                let row1 = startNode.row + i * dirY;
                rx = (i + 1) * dirX * rate;
                intNum = dirX > 0 ? Math.floor(startNode.col + rx) : Math.ceil(startNode.col + rx);
                decimal = Math.abs(rx % 1);
                let col2 = decimal <= 0.5 ? intNum : intNum + 1 * dirX;
                let row2 = startNode.row + (i + 1) * dirY;
                let node1 = this.getRoadNode(col1, row1);
                let node2 = this.getRoadNode(col2, row2);
                if (!this.isCrossAtAdjacentNodes(node1, node2)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 判断两个相邻的点是否可通过
     * @param node1
     * @param node2
     */
    public isCrossAtAdjacentNodes(node1: RoadNode, node2: RoadNode) {
        if (node1 == node2) {
            return false;
        }
        //两个点只要有一个点不能通过就不能通过
        if (!this.isCanPass(node1) || !this.isCanPass(node2)) {
            return false;
        }
        let dirX = node2.col - node1.col;
        let dirY = node2.row - node1.row;
        //如果不是相邻的两个点 则不能通过
        if (Math.abs(dirX) > 1 || Math.abs(dirY) > 1) {
            return false;
        }
        //如果相邻的点是在同一行，或者同一列，则判定为可通过
        if ((node1.col == node2.col) || (node1.row == node2.row)) {
            return true;
        }
        //只剩对角情况了
        if (this.isPassNode(this.getRoadNode(node1.col, node1.row + dirY)) && this.isPassNode(this.getRoadNode((node1.col + dirX), node1.row))) {
            return true;
        }
        return false;
    }

    /**
     * 是否是可通过的点
     * @param node
     */
    public isPassNode(node: RoadNode) {
        if (this._isPassCallBack != null) {
            //如果设置有自定义条件，则使用自定义判断条件
            return this._isPassCallBack.call(this._isPassCallBackCtx, node);
        }
        if (node == null || node.value == 0) {
            return false;
        }
        return true;
    }

    public isCanPass(node: RoadNode) {
        if (!this.isPassNode(node))
            return false;
        if (!this._neighbours || !this._neighbours.length)
            return true;
        for (let i = 0; i < this._neighbours.length; i++) {
            let col = node.col + this._neighbours[i][0], row = node.row + this._neighbours[i][1];
            let tempNode = this.getRoadNode(col, row);
            if (!this.isPassNode(tempNode))
                return false;
        }
        return true;
    }

    /**
     * 根据行列获得路节点
     * @param col 列
     * @param row 行
     * @returns
     */
    public getRoadNode(col: number, row: number): RoadNode {
        let self = this;
        let key = col + "_" + row;
        let node = this._roadNodes[key];
        let walkList = this._walkList;
        if (!node && walkList[row] != undefined && walkList[row][col] != undefined) {
            let nodeWidth = self._cellWidth;
            let nodeHeight = self._cellHeight;
            let halfNodeWidth = Math.floor(nodeWidth / 2);
            let halfNodeHeight = Math.floor(nodeHeight / 2);
            node = new RoadNode();
            node.col = col;
            node.row = row;
            node.px = Math.floor(col * nodeWidth + halfNodeWidth);
            node.py = Math.floor(row * nodeHeight + halfNodeHeight);
            this._roadNodes[key] = node;
        }
        if (node) node.value = walkList[row][col];
        return node;
    }

    public getNeighbours(size: number) {
        if (!size)
            return null;
        let e = null;
        if (null != this._neighboursDic[size])
            e = this._neighboursDic[size];
        else {
            e = [];
            for (let j = -size; j <= size; j++)
                for (let i = -size; i <= size; i++)
                    0 == i && 0 == j || Math.abs(i) + Math.abs(j) > size || e.push([i, j]);
            this._neighboursDic[size] = e;
        }
        return e;
    }

    /**
     * 查找一个节点周围可通过的点
     * @param node
     * @return
     */
    public searchRoundNodes(node: RoadNode) {
        for (let i = 0; i < this._round.length; i++) {
            let col = node.col + this._round[i][0];
            let row = node.row + this._round[i][1];
            let node2 = this.getRoadNode(col, row);
            if (this.isCanPass(node2) && node2 != this._startNode && !this.isInCloseList(node2) && !this.inInCorner(node2)) {
                this.setNodeF(node2);
            }
        }
    }

    /**
     * 设置节点的F值
     * @param node
     */
    public setNodeF(node: RoadNode) {
        let g;
        if (node.col == this._currentNode.col || node.row == this._currentNode.row) {
            g = this._currentNode.g + this.COST_STRAIGHT;
        }
        else {
            g = this._currentNode.g + this.COST_DIAGONAL;
        }
        if (this.isInOpenList(node)) {
            if (g < node.g) {
                node.g = g;
                node.parent = this._currentNode;
                node.h = (Math.abs(this._targetNode.col - node.col) + Math.abs(this._targetNode.row - node.row)) * this.COST_STRAIGHT; //曼哈顿估价法
                node.f = node.g + node.h;
                //节点的g值已经改变，把节点先从二堆叉树结构中删除，再重新添加进二堆叉树
                this._binaryTreeNode.removeTreeNode(node);
                this._binaryTreeNode.addTreeNode(node);
            }
        }
        else {
            node.g = g;
            this._binaryTreeNode.setRoadNodeInOpenList(node); //给节点打入开放列表的标志
            node.resetTree();
            node.parent = this._currentNode;
            node.h = (Math.abs(this._targetNode.col - node.col) + Math.abs(this._targetNode.row - node.row)) * this.COST_STRAIGHT;
            node.f = node.g + node.h;
            this._binaryTreeNode.addTreeNode(node);
        }
    }

    /**
     * 节点是否在开启列表
     * @param node
     * @return
     */
    public isInOpenList(node: RoadNode) {
        return this._binaryTreeNode.isInOpenList(node);
    }

    /**
     * 节点是否在关闭列表
     * @param node
     * @returns
     */
    public isInCloseList(node: RoadNode) {
        return this._binaryTreeNode.isInCloseList(node);
    }

    /**
     * 节点是否在拐角处
     * @return
     */
    public inInCorner(node: RoadNode) {
        if (this._pathQuadSeek == PathQuadSeek.path_dire_4) {
            //如果是4方向寻路类型，则不可能有拐角，所以直接返回false;
            return false;
        }
        if (node.col == this._currentNode.col || node.row == this._currentNode.row) {
            return false;
        }
        let node1 = this.getRoadNode(this._currentNode.col, node.row);
        let node2 = this.getRoadNode(node.col, this._currentNode.row);
        if (this.isPassNode(node1) && this.isPassNode(node2)) {
            return false;
        }
        return true;
    }

    public get path() {
        return this._path;
    }

    /** 格子可行走状态变更*/
    public onGridWalkChg(grid: { row: number, col: number }) {
        let key = grid.col + "_" + grid.row;
        let node = this._roadNodes[key];
        if (node) {
            node.value = this._walkList[grid.row][grid.col];
        }
    };

    public posToGrid(x: number, y: number): { row: number, col: number } {
        let self = this;
        return { row: Math.floor(y / self._cellHeight), col: Math.floor(x / self._cellWidth) }
    }

    public posToIndex(x: number, y: number): number {
        let self = this;
        let grid = self.posToGrid(x, y);
        return grid.row * self._totCol + grid.col;
    }

    public gridToPos(row: number, col: number, isRandom?: boolean): { x: number, y: number } {
        let self = this;
        let percent = isRandom ? Math.random() : 0.5;
        return { x: (col + percent) * self._cellWidth, y: (row + percent) * self._cellHeight }
    }

    public indexToPos(idx: number, isRandom?: boolean): { x: number, y: number } {
        let self = this;
        let grid = self.indexToGrid(idx);
        return self.gridToPos(grid.row, grid.col, isRandom);
    }

    public indexToGrid(idx: number): { row: number, col: number } {
        let self = this;
        let grid = self.indexToGrid(idx);
        return { row: Math.floor(idx / self._totCol), col: Math.floor(idx % self._totCol) }
    }

    /** 随机获取可行走的一个节点*/
    public getRanDomStartPos(): RoadNode {
        let self = this;
        let canWalkArr = [];
        let walfList = self._walkList || [];
        for (let row = 0, len = walfList.length; row < len; row++) {
            let cols = walfList[row];
            for (let col = 0, len = cols.length; col < len; col++) {
                if (cols[col]) canWalkArr.push(self.getRoadNode(col, row));
            }
        }
        let randomIdx = Math.floor(Math.random() * canWalkArr.length);
        return canWalkArr[randomIdx];
    }

    public get isFinding() {
        return this._isFinding;
    }

    /** 获取当前时间(毫秒)*/
    private getTime() {
        return new Date().getTime();
    }

    public get startNode() {
        return this._startNode;
    }

    public get targetNode() {
        return this._targetNode;
    }

    public clear() {
        let self = this;
        self._openlist = null;
        self._closelist = null;
        self._path = null;
        self._targetNode = null;
        self._startNode = null;
        self._findingNode = null;
        self._isFinding = false;
        self._isStopSearch = false;
        self._walkList = null;
    }

    /**
     * 释放资源
     */
    public release() {
        // emmiter.off(CONST.GEVT.ChgGridWalkable, this.onGridWalkChg, this);
        this._roadNodes = null;
        this._round = null;
        this._round1 = null;
        this._round2 = null;
        this._binaryTreeNode = null;
        this.clear();
    };
}