import { _decorator, Component, Node, math, Vec3, Quat } from "cc";
import { GameObject } from "./GameObject";
const { ccclass, property } = _decorator;

@ccclass('Transform')
export class Transform extends Node
{

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

  /**
   * 以节点的正Z轴为方向朝向目标
   * @param pos 
   * @param up 
   */
  public lookAtZ(pos: math.Vec3, up?: math.Vec3)
  {
    //super.lookAt(pos, up);
    
    var outDir:Vec3 = new Vec3();
    Vec3.subtract(outDir,pos,this.worldPosition);
    outDir.normalize();

    var quat:Quat = new Quat()
    Quat.fromViewUp(quat,outDir.normalize(),up);
    this.rotation = quat;
  }
  
  public find(path:string):Node
  {
    return this.getChildByPath(path);
  }

  public getComponentInParent<T extends Component>(type: {prototype: T}):T
  {
      var t:any = type;

      var component:T | null = this.getComponent(t);

      if(!component)
      {
        component = this.searchParentComponent(this,t);
      }

      //this.getComponent
      return component;
  }

  public searchParentComponent<T extends Component>(node:Node, type: {prototype:T}):T
  {
    var t:any = type;
    var component:T | null = null;
    
    if(node.parent)
    {
      component = node.parent.getComponent(t);

      if(component)
      {
          return component;
      }else
      {
          component = this.searchParentComponent(node.parent,type);
          if(component)
          {
            return component;
          }

      }
      
    }

    return component;
  }

}

Node.prototype["lookAtZ"] = Transform.prototype.lookAtZ;
Node.prototype["find"] = Transform.prototype.find;
Node.prototype["getComponentInParent"] = Transform.prototype.getComponentInParent;
Node.prototype["searchParentComponent"] = Transform.prototype.searchParentComponent;
//Node.prototype["gameObject"] = GameObject.prototype.gameObject; //GameObject已经设置过了，不用再设置
//Node.prototype["transform"] = GameObject.prototype.transform; //GameObject已经设置过了，不用再设置
//Transform.prototype = Node.prototype;
