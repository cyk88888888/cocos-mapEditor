// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { _decorator, Component, Node, director, Scene } from 'cc';
import { Transform } from './Transform';
const { ccclass, property } = _decorator;

@ccclass('GameObject')
export class GameObject extends Node {
    
    public get transform():Transform
    {
        var node:Node = this;
        return node as Transform;
    }

    public get gameObject():GameObject
    {
        var node:Node = this;
        return node as GameObject;
    }

    public setActive(value:boolean) //用这个设置物体的显示与隐藏会安全点
    {
        if(this.active == value)
        {
            return;
        }

        this.active = value;
    }

    public static Find(name:string)
    {
        var currentScene:any = director.getScene();
        return this.searchChildByName(currentScene,name);
    }

    private static searchChildByName(node:Node,name:string):Node | null
    {
        var targetNode:Node = node.getChildByName(name)

        if(targetNode)
        {
            return targetNode;
        }

        var len:number = node.children.length;
        var searchNode:Node | null = null;

        for(var i = 0 ; i < len ; i++)
        {

            searchNode = node.children[i];

            if(searchNode.name == name)
            {
                targetNode = searchNode;
                return targetNode;
            }else
            {
                targetNode = this.searchChildByName(searchNode,name);

                if(targetNode)
                {
                    return targetNode;
                }
            }
        }

        return targetNode;
    }

    public static FindObjectOfType<T extends Component>(type: {prototype: T}):T | null
    {
        var t:any = type;
        var currentScene:Scene  = director.getScene();

        return currentScene.getComponentInChildren(t);
    }

    public static FindObjectsOfType<T extends Component>(type: {prototype: T}):T[] | null
    {
        var t:any = type;
        var currentScene:Scene  = director.getScene();

        return currentScene.getComponentsInChildren(t);
    }

}

Node.prototype["setActive"] = GameObject.prototype.setActive;
Node.prototype["gameObject"] = GameObject.prototype.gameObject;
Node.prototype["transform"] = GameObject.prototype.transform;
