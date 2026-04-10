import { _decorator } from 'cc';
const { ccclass } = _decorator;
/**
 * @Desc: 
 * @Author: cyk
 * @Date: 2023-06-30 22:00:00
 */
@ccclass('RoadNode')
export class RoadNode {
    private _px: number; //像素坐标x
    private _py: number; //像素坐标y
    private _col: number; //列
    private _row: number; //行
    private _value = 0; //节点的值
    private _f = 0; //路点的f值
    private _g = 0; //路点的g值
    private _h = 0; //路点的h值
    private _parent: RoadNode = null; //路点的父节点
    //-------------二堆叉存储结构-----------------
    private _treeParent: RoadNode = null; //二堆叉结构的父节点
    private _left: RoadNode = null; //二堆叉结构的左子节点
    private _right: RoadNode = null; //二堆叉结构的右子节点
    private _openTag = 0; //是否在开启列表标记
    private _closeTag = 0; //是否在关闭列表标记
    /**
     * 重置二叉堆存储信息
     */
    public resetTree = function () {
        this._treeParent = null;
        this._left = null;
        this._right = null;
    };
    
    public toString = function () {
        return "路点像素坐标：（" + this._px + "," + this._py + "),  " +
            "路点行列：（" + this._row + "," + this._col + "),  " +
            "路点平面直角坐标：（" + this._dx + "," + this._dy + ")";
    };

    public get px() {
        return this._px;
    }

    public set px(value: number) {
        this._px = value;
    }

    public get py() {
        return this._py;
    }

    public set py(value: number) {
        this._py = value;
    }

    public get col() {
        return this._col;
    }

    public set col(value: number) {
        this._col = value;
    }

    public get row() {
        return this._row;
    }

    public set row(value: number) {
        this._row = value;
    }

    /** 路点是否可行走(0不可行走, 1可行走) */
    public get value() {
        return this._value;
    }

    public set value(value: number) {
        this._value = value;
    }

    public get f() {
        return this._f;
    }

    public set f(value: number) {
        this._f = value;
    }

    public get g() {
        return this._g;
    }

    public set g(value: number) {
        this._g = value;
    }

    public get h() {
        return this._h;
    }

    public set h(value: number) {
        this._h = value;
    }

    public get parent() {
        return this._parent;
    }

    public set parent(value: RoadNode) {
        this._parent = value;
    }

    /**二堆叉结构的父节点 */
    public get treeParent() {
        return this._treeParent;
    }

    public set treeParent(value: RoadNode) {
        this._treeParent = value;
    }

    /**二堆叉结构的左子节点 */
    public get left() {
        return this._left;
    }

    public set left(value: RoadNode) {
        this._left = value;
    }

    /**二堆叉结构的右子节点 */
    public get right() {
        return this._right;
    }

    public set right(value: RoadNode) {
        this._right = value;
    }

    /**是否在开启列表标记 */
    public get openTag() {
        return this._openTag;
    }

    public set openTag(value: number) {
        this._openTag = value;
    }

    /**是否在关闭列表标记 */
    public get closeTag() {
        return this._closeTag;
    }

    public set closeTag(value: number) {
        this._closeTag = value;
    }
}
