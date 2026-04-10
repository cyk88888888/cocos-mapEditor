import { _decorator, Component, Node, ITriggerEvent, Collider, UITransform, Vec3, UIOpacity, CCString, Collider2D, Contact2DType, IPhysics2DContact } from "cc";
import { GameObject } from "../../GameObject";
import { Transform } from "../../Transform";
const { ccclass, property } = _decorator;

/**
 * 行为组件
 */
@ccclass("Behaviour")
export class Behaviour extends Component {
    
    /**
     * 对象标识
     */
    @property({tooltip:"对象标识"})
    public tag:string = "";

    private colliders_2D:Collider2D[] = null;
    private colliders_3D:Collider[] = null;

    private _transform:Transform = null;
    public get transform():Transform
    {
        if(!this._transform)
        {
            this._transform = this.node as Transform;
        }

        return this._transform;
    }

    private _gameObject:GameObject = null;
    public get gameObject():GameObject
    {
        if(!this._gameObject)
        {
            this._gameObject = this.node as GameObject;
        }

        return this._gameObject;
    }

    private _uiTransform:UITransform = null;
    public get uiTransform():UITransform
    {
        if(!this._uiTransform)
        {
            this._uiTransform = this.node.getComponent(UITransform);
        }

        return this._uiTransform;
    }

    private _uiOpacity: UIOpacity = null;
    public get uiOpacity(): UIOpacity {

        if(!this._uiOpacity)
        {
            this._uiOpacity = this.node.getComponent(UIOpacity);
        }

        return this._uiOpacity;
    }

    //--------------------------------设置宽高 begin---------------------------------------------
    public get width(): number {

        if(this.uiTransform)
        {
            return this.uiTransform.width;
        }

        return 0;
    }
    public set width(value: number) {
        if(this.uiTransform)
        {
            this.uiTransform.width = value;
        }
    }

    public get height(): number {
        if(this.uiTransform)
        {
            return this.uiTransform.height;
        }

        return 0;
    }
    public set height(value: number) {
        if(this.uiTransform)
        {
            this.uiTransform.height = value;
        }
    }
    //--------------------------------设置宽高 end---------------------------------------------

    //--------------------------------设置透明度 begin---------------------------------------------
    private _alpha: number = 1;
    public get alpha(): number {
        return this._alpha;
    }
    /**alpha值的范围是 0-1 */
    public set alpha(value: number) {
        this._alpha = value;

        if(this._alpha < 0)
        {
            this._alpha = 0;
        }else if(this._alpha > 1)
        {
            this._alpha = 1;
        }

        if(this.uiOpacity != null)
        {
            this.uiOpacity.opacity = 255 * (this._alpha / 1);
        }
    }

    private _opacity: number = 255;
    public get opacity(): number {
        return this._opacity;
    }
    /**opacity值的范围是 0-255 */
    public set opacity(value: number) {
        this._opacity = value;
        
        if(this._opacity < 0)
        {
            this._opacity = 0;
        }else if(this._opacity > 255)
        {
            this._opacity = 255;
        }

        if(this.uiOpacity != null)
        {
            this.uiOpacity.opacity = this._opacity;
        }
    }
    //--------------------------------设置透明度 end---------------------------------------------

    //--------------------------------局部坐标 begin---------------------------------------------
    public get x(): number {
        return this.transform.position.x;
    }
    public set x(value: number) {
        var pos:Vec3 = this.transform.position;
        pos.x = value;
        this.transform.position = pos;
    }

    public get y(): number {
        return this.transform.position.y;
    }
    public set y(value: number) {
        var pos:Vec3 = this.transform.position;
        pos.y = value;
        this.transform.position = pos;
    }

    public get z(): number {
        return this.transform.position.z;
    }
    public set z(value: number) {
        var pos:Vec3 = this.transform.position;
        pos.z = value;
        this.transform.position = pos;
    }
    //---------------------------------局部坐标 end-----------------------------------------------

    //--------------------------------世界坐标 begin----------------------------------------------
    public get wx(): number {
        return this.transform.worldPosition.x;
    }
    public set wx(value: number) {
        var pos:Vec3 = this.transform.worldPosition;
        pos.x = value;
        this.transform.worldPosition = pos;
    }

    public get wy(): number {
        return this.transform.worldPosition.y;
    }
    public set wy(value: number) {
        var pos:Vec3 = this.transform.transform.worldPosition;
        pos.y = value;
        this.transform.worldPosition = pos;
    }

    public get wz(): number {
        return this.transform.worldPosition.z;
    }
    public set wz(value: number) {
        var pos:Vec3 = this.transform.worldPosition;
        pos.z = value;
        this.transform.worldPosition = pos;
    }
    //--------------------------------世界坐标 end----------------------------------------------

    onLoad()
    {
        this.addColliderEventListener();
    }

    /**
     * 监听碰撞事件
     */
    protected addColliderEventListener()
    {
        this.add2DColliderEventListener();
        this.add3DColliderEventListener();
    }

    /**
     * 监听2d碰撞事件
     */
    protected add2DColliderEventListener()
    {
        this.colliders_2D = this.getComponents(Collider2D);

        if(this["onTriggerEnter2D"])
        {
            for(var i = 0 ; i < this.colliders_2D.length ; i++)
            {
                this.colliders_2D[i].on(Contact2DType.BEGIN_CONTACT,this["onTriggerEnter2D"],this);
            }
        }

        if(this["onTriggerExit2D"])
        {
            for(var i = 0 ; i < this.colliders_2D.length ; i++)
            {
                this.colliders_2D[i].on(Contact2DType.END_CONTACT,this["onTriggerExit2D"],this);
            }
        }

        if(this["onCollisionEnter2D"])
        {
            for(var i = 0 ; i < this.colliders_2D.length ; i++)
            {
                this.colliders_2D[i].on(Contact2DType.BEGIN_CONTACT,this["onCollisionEnter2D"],this);
            }
        }

        if(this["onCollisionExit2D"])
        {
            for(var i = 0 ; i < this.colliders_2D.length ; i++)
            {
                this.colliders_2D[i].on(Contact2DType.END_CONTACT,this["onCollisionExit2D"],this);
            }
        }

    }

    /**
     * 监听3d碰撞事件
     */
    protected add3DColliderEventListener()
    {
        this.colliders_3D = this.getComponents(Collider);

        if(this["onTriggerEnter"])
        {
            for(var i = 0 ; i < this.colliders_3D.length ; i++)
            {
                this.colliders_3D[i].on("onTriggerEnter",this["onTriggerEnter"],this);
            }
        }

        if(this["onTriggerStay"])
        {
            for(var i = 0 ; i < this.colliders_3D.length ; i++)
            {
                this.colliders_3D[i].on("onTriggerStay",this["onTriggerStay"],this);
            }
        }

        if(this["onTriggerExit"])
        {
            for(var i = 0 ; i < this.colliders_3D.length ; i++)
            {
                this.colliders_3D[i].on("onTriggerExit",this["onTriggerExit"],this);
            }
        }

        if(this["onCollisionEnter"])
        {
            for(var i = 0 ; i < this.colliders_3D.length ; i++)
            {
                this.colliders_3D[i].on("onCollisionEnter",this["onCollisionEnter"],this);
            }
        }

        if(this["onCollisionStay"])
        {
            for(var i = 0 ; i < this.colliders_3D.length ; i++)
            {
                this.colliders_3D[i].on("onCollisionStay",this["onCollisionStay"],this);
            }
        }

        if(this["onCollisionExit"])
        {
            for(var i = 0 ; i < this.colliders_3D.length ; i++)
            {
                this.colliders_3D[i].on("onCollisionExit",this["onCollisionExit"],this);
            }
        }
    }


    /**
     * 注销所有碰撞事件
     */
    protected removeAllColliderEventListener()
    {
        if(this.colliders_2D)
        {
            for(var i = 0 ; i < this.colliders_2D.length ; i++)
            {
                if(this["onTriggerEnter2D"])
                {
                    this.colliders_2D[i].off(Contact2DType.BEGIN_CONTACT,this["onTriggerEnter2D"],this);
                }
                
                if(this["onTriggerExit2D"])
                {
                    this.colliders_2D[i].off(Contact2DType.END_CONTACT,this["onTriggerExit2D"],this);
                }

                if(this["onCollisionEnter2D"])
                {
                    this.colliders_2D[i].off(Contact2DType.BEGIN_CONTACT,this["onCollisionEnter2D"],this);
                }

                if(this["onCollisionExit2D"])
                {
                    this.colliders_2D[i].off(Contact2DType.END_CONTACT,this["onCollisionExit2D"],this);
                } 
            }
        }

        if(this.colliders_3D)
        {
            for(var i = 0 ; i < this.colliders_3D.length ; i++)
            {
                if(this["onTriggerEnter"])
                {
                    this.colliders_3D[i].off("onTriggerEnter",this["onTriggerEnter"],this);
                }
                
                if(this["onTriggerStay"])
                {
                    this.colliders_3D[i].off("onTriggerStay",this["onTriggerStay"],this);
                }

                if(this["onTriggerExit"])
                {
                    this.colliders_3D[i].off("onTriggerExit",this["onTriggerExit"],this);
                }

                if(this["onCollisionEnter"])
                {
                    this.colliders_3D[i].off("onCollisionEnter",this["onCollisionEnter"],this);
                }

                if(this["onCollisionStay"])
                {
                    this.colliders_3D[i].off("onCollisionStay",this["onCollisionStay"],this);
                }

                if(this["onCollisionExit"])
                {
                    this.colliders_3D[i].off("onCollisionExit",this["onCollisionExit"],this);
                } 
            }
        }
    }

    onDestroy()
    {
        this.removeAllColliderEventListener();
    }

    /* //3D碰撞函数模板
    protected onTriggerEnter(event:ITriggerEvent):void
    {
    }
    */

    /* //3D碰撞函数模板
    public onTriggerEnter2D(self: Collider2D, other: Collider2D, contact: IPhysics2DContact | null)
    {

    }*/


}

//Behaviour.prototype.onLoad = function(){this.onLoad(); console.log("执行了behaviour的 onload")};