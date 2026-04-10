import { _decorator } from 'cc';
import { RoadNode } from './RoadNode';
const { ccclass } = _decorator;
/**
 * @Desc: 二堆叉结构存储
 * @Author: cyk
 * @Date: 2023-06-30 22:00:00
 */
@ccclass('BinaryTreeNode')
export class BinaryTreeNode {
    /**
     * 当前寻路标记,用于标记节点是否属于当前次寻路运算
     */
    public seekTag = 0;
    /**
     * 开启列表根节点
     */
    public openNode: RoadNode = null;
    /**
     * 计数当次寻路的运算代价（用于测试数据）
     */
    public count = 0;
    /**
     * 刷新寻路tag标记，用于标记当前是哪次的寻路
     */
    public refleshTag() {
        this.openNode = null;
        this.count = 0;
        this.seekTag++;
        if (this.seekTag > 1000000000) {
            this.seekTag = 0;
        }
    };
    /**
     * 二叉堆树是否为空，即没有任何节点加入
     * @returns
     */
    public isTreeNull() {
        return this.openNode == null;
    };
    /**
     * 把节点添加进二叉堆里
     * @param roadNode 要添加的节点
     * @param head 从哪个节点位置开始添加
     * @returns
     */
    public addTreeNode(roadNode: RoadNode, head: RoadNode = null) {
        if (head === void 0) { head = null; }
        this.count++; //计数统计运算代价
        if (head == null) {
            if (this.openNode == null) {
                this.openNode = roadNode;
                //console.log(this.count,"add root ",roadNode.f,roadNode.toString());
                return;
            }
            else {
                head = this.openNode;
            }
        }
        if (head == roadNode) {
            return;
        }
        if (roadNode.f >= head.f) {
            if (head.right == null) {
                head.right = roadNode;
                roadNode.treeParent = head;
                //console.log(this.count,"add right ",roadNode.f,roadNode.toString());
            }
            else {
                this.addTreeNode(roadNode, head.right);
            }
        }
        else {
            if (head.left == null) {
                head.left = roadNode;
                roadNode.treeParent = head;
                //console.log(this.count,"add left ",roadNode.f,roadNode.toString());
            }
            else {
                this.addTreeNode(roadNode, head.left);
            }
        }
    };
    /**
     * 删除树节点
     * @param roadNode 要删除的节点
     */
    public removeTreeNode(roadNode: RoadNode) {
        this.count++; //计数统计运算代价
        if (roadNode.treeParent == null && roadNode.left == null && roadNode.right == null) {
            if (roadNode == this.openNode) {
                this.openNode = null; //删除根节点
            }
            else {
                //节点不在树结构中,不做任何处理
            }
            return;
        }
        if (roadNode.treeParent == null) {
            if (roadNode.left) {
                this.openNode = roadNode.left;
                roadNode.left.treeParent = null;
                if (roadNode.right) {
                    roadNode.right.treeParent = null;
                    this.addTreeNode(roadNode.right, this.openNode);
                }
            }
            else if (roadNode.right) {
                this.openNode = roadNode.right;
                roadNode.right.treeParent = null;
            }
        }
        else {
            if (roadNode.treeParent.left == roadNode) {
                if (roadNode.right) {
                    roadNode.treeParent.left = roadNode.right;
                    roadNode.right.treeParent = roadNode.treeParent;
                    if (roadNode.left) {
                        roadNode.left.treeParent = null;
                        this.addTreeNode(roadNode.left, roadNode.right);
                    }
                }
                else {
                    roadNode.treeParent.left = roadNode.left;
                    if (roadNode.left) {
                        roadNode.left.treeParent = roadNode.treeParent;
                    }
                }
            }
            else if (roadNode.treeParent.right == roadNode) {
                if (roadNode.left) {
                    roadNode.treeParent.right = roadNode.left;
                    roadNode.left.treeParent = roadNode.treeParent;
                    if (roadNode.right) {
                        roadNode.right.treeParent = null;
                        this.addTreeNode(roadNode.right, roadNode.left);
                    }
                }
                else {
                    roadNode.treeParent.right = roadNode.right;
                    if (roadNode.right) {
                        roadNode.right.treeParent = roadNode.treeParent;
                    }
                }
            }
        }
        roadNode.resetTree();
    };
    /**
     * 从二叉堆结构里快速查找除f值最小的路节点
     * @param head 搜索的起始节点
     * @returns
     */
    public getMin_F_Node(head: RoadNode = null) {
        this.count++; //计数统计运算代价
        if (head == null) {
            if (this.openNode == null) {
                return null;
            }
            else {
                head = this.openNode; //如果头节点为null，并且开启节点不为空，则头节点默认使用开启节点
            }
        }
        if (head.left == null) {
            let minNode = head;
            if (head.treeParent == null) {
                this.openNode = head.right;
                if (this.openNode) {
                    this.openNode.treeParent = null;
                }
            }
            else {
                head.treeParent.left = head.right;
                if (head.right) {
                    head.right.treeParent = head.treeParent;
                }
            }
            return minNode;
        }
        else {
            return this.getMin_F_Node(head.left);
        }
    };
    /**
     * 把节点加入开启列表，即打入开启列表标志
     * @param node
     */
    public setRoadNodeInOpenList(node: RoadNode) {
        node.openTag = this.seekTag; //给节点打入开放列表的标志
        node.closeTag = 0; //关闭列表标志关闭
    };
    /**
     * 把节点加入关闭列表，即打入关闭列表标志
     * @param node
     */
    public setRoadNodeInCloseList(node: RoadNode) {
        node.openTag = 0; //开放列表标志关闭
        node.closeTag = this.seekTag; //给节点打入关闭列表的标志
    };
    /**
     * 节点是否在开启列表
     * @param node
     * @returns
     */
    public isInOpenList(node: RoadNode) {
        return node.openTag == this.seekTag;
    };
    /**
     * 节点是否在关闭列表
     * @param node
     * @returns
     */
    public isInCloseList(node: RoadNode) {
        return node.closeTag == this.seekTag;
    };
    public getOpenList() {
        let openList = [];
        this.seachTree(this.openNode, openList);
        return openList;
    };
    public seachTree(head: RoadNode, openList: RoadNode[]) {
        if (head == null) {
            return;
        }
        openList.push(head);
        if (head.left) {
            this.seachTree(head.left, openList);
        }
        if (head.right) {
            this.seachTree(head.right, openList);
        }
    };
}