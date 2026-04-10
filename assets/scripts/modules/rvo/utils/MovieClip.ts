

import {CCFloat, CCInteger, Rect, Sprite, SpriteFrame, Texture2D, _decorator, Component, Vec2, Size, UITransform, CCBoolean } from "cc";

const { ccclass, property } = _decorator;

/**
 * 动画播放器
 */
@ccclass('MovieClip')
export default class MovieClip extends Component {

    /**
     * Sprite渲染器
     */
    protected m_sprite:Sprite = null;

    /**
     * 动画计时间隔 每隔0.1s更新一帧
     */
    protected timer:number = 0.1;

    /**
     * 播放 时间 间隔
     */
    @property(CCFloat)
    public interval:number = 0.1;

    /**
     * 贴图文件名
     */
    @property({type:Texture2D})
    public texture:Texture2D = null;

    /**
     * 播放次数，0代表无限循环
     */
    @property({type:CCInteger})
    public playTimes:number = 0;

    /**
     * 图片切割成几行
     */
    @property(CCInteger)
    public row:number = 4;

    /**
     * 图片切割成几列
     */
    @property(CCInteger)
    public col:number = 4;

    /**
     * 播放第几行序列动画
     */
    @property(CCInteger)
    public rowIndex:number = 0;

    /**
     * 是否从头播到尾，（序列图有几帧就播放几帧）
     */
    @property(CCBoolean)
    public isAll:boolean = false;
    
    /**
     * 是否刚载入脚本就自动播放
     */
    @property(CCBoolean)
    public autoPlayOnLoad:boolean = true;

    /**
     * 播放完是否自动销毁，如果playTimes的值是0（代表无限循环），那么动画永恒不会触发自动销毁
     */
    @property(CCBoolean)
    public autoDestroy:boolean = false;

    /**
     *  从哪一行的哪一帧开始播放
     */
    @property(CCInteger)
    public begin:number = 0;

    /**
     *  从哪一行的哪一帧结束播放
     */
    @property(CCInteger)
    public end:number = 0;

    /**
     * 总动画帧数
     */
    public totalFrame:number = 8;

    /**
     * 当前正确播放第几帧
     */
    public currentFrame:number = 0;

    /**
     * 当前播放了第几次
     */
    public currentTimes:number = 0;

    /**
     * 影片是否在播放中
     */
    public running:boolean = true;

    private _playIndex: number = 0;
    public get playIndex(): number {
        return this._playIndex;
    }
    public set playIndex(value: number) {
        this._playIndex = value;
    }

    /**
     * 每一帧动画图片的宽
     */
    private _pieceWidth:number = 0;

    /**
     * 每一帧动画图片的高
     */
    private _pieceHeight:number = 0;

    /**
     * 动画序列帧图片数组
     */
    private _bitmapArr:SpriteFrame[][] = [];

    /**
     * 是否已经初始化过
     */
    private _isInit:boolean = false;

    private _uiTransform:UITransform = null;
    public get uiTransform():UITransform
    {
        if(!this._uiTransform)
        {
            this._uiTransform = this.node.getComponent(UITransform);
        }

        return this._uiTransform;
    }

    // Use this for initialization
    onLoad()
    {
        this.running = this.autoPlayOnLoad;

        if(!this._isInit)
        {
            this.init(this.texture,this.row,this.col,this.playTimes);
        }
    }

    /**
     * 初始化动画播放器
     * @param tex 要播放的动画序列图集
     * @param row 动画序列图集分为几行
     * @param col 动画序列图集分为几列
     * @param playeTimes 动画播放次数，填1为单次播放，填n播放n次，填0为无限循环
     */
    public init(tex:Texture2D,row:number,col:number,playeTimes:number = 0)
    {
        if(tex == null)
        {
            return;
        }

        this.reset();

        this._isInit = true;
        this.texture = tex;
        this.row = row;
        this.col = col;
        this.playTimes = playeTimes;

        if(this.end == 0)
        {
            this.end = this.col;
        }

        this.rowIndex = this.clamp(this.rowIndex,0,this.row - 1);

        this._pieceWidth = this.texture.width / this.col;
        this._pieceHeight = this.texture.height / this.row;
        
        if(!this.m_sprite)
        {
            this.m_sprite = this.getComponent(Sprite);

            if(!this.m_sprite)
            {
                this.m_sprite = this.addComponent(Sprite);
            }
        }
        
        this._bitmapArr.length = 0;

        for(var i = 0 ; i < this.row ; i++)
        {
            this._bitmapArr[i] = [];

            for(var j = 0 ; j < this.col ; j++)
            {
                var spriteFrame:SpriteFrame = new SpriteFrame();
                spriteFrame.texture = this.texture;
                spriteFrame.rect = new Rect(j * this._pieceWidth,i * this._pieceHeight,this._pieceWidth, this._pieceHeight);
                spriteFrame.rotated = false;
                spriteFrame.offset = new Vec2(0,0);
                spriteFrame.originalSize = new Size(this._pieceWidth,this._pieceHeight);
                this._bitmapArr[i][j] = spriteFrame;
            }
        }
        
        this.m_sprite.spriteFrame = this._bitmapArr[this.rowIndex][0];

        this.uiTransform.width = this._pieceWidth;
        this.uiTransform.height = this._pieceHeight;

        //this.timer = this.interval;
        this.timer = 0;
        this.playAction();
    }

    /**
     * 重置数据
     */
    public reset()
    {
        this.timer = 0;
        this.playIndex = 0;
        this.currentTimes = 0;
        this.currentFrame = 0;
    }

    update(dt:number)
    {
        if(this.texture == null)
            return;

        if (!this.running)
            return;

        if (this.playTimes != 0 && this.currentTimes == this.playTimes)
        {
            this.running = false;
            return;
        }
            
        this.timer -= dt;

        if (this.timer <= 0)
        {
            if(this.isAll) //如果是从头播到尾
            {
                this.begin = 0;
                this.end = this.col;
            }

            this.timer = this.interval;

            this.currentFrame = this.currentFrame % this.col;

            this.playAction();

            this.currentFrame ++;

            if(this.currentFrame == this.col)
            {
                if(this.isAll)
                {
                    this.rowIndex++;

                    if(this.rowIndex == this.row)
                    {
                        this.currentTimes ++;

                        this.node.emit("completeTimes");

                        if (this.playTimes != 0 && this.currentTimes == this.playTimes)
                        {
                            this.node.emit("complete");

                            if(this.autoDestroy)
                            {
                                this.node.destroy();
                            }
                        }
                    }

                    this.rowIndex %= this.row;
                }else
                {
                    this.currentTimes ++;

                    this.node.emit("completeTimes");

                    if (this.playTimes != 0 && this.currentTimes == this.playTimes)
                    {
                        this.node.emit("complete");

                        if(this.autoDestroy)
                        {
                            this.node.destroy();
                        }
                    }
                }

            }
        }
 
    }

    /**
     * 播放当前帧画面
     */
    public playAction()
    {
        if(this.end == this.begin)
            return;

        this.rowIndex = this.clamp(this.rowIndex, 0, this.row - 1);
        this._playIndex = this._playIndex % (this.end - this.begin) + this.begin;
        this.m_sprite.spriteFrame = this._bitmapArr[this.rowIndex][this._playIndex];
        this._playIndex++;
    }

    /**
     * 播放影片
     */
    public play()
    {
        this.running = true;
        this.playAction();
    }

    /**
     * 停止播放影片
     */
    public stop()
    {
        this.running = false;
    }

    /**
     * 跳帧播放 类似于flash影片剪辑的接口
     * @param frame 
     */
    public gotoAndPlay(frame:number)
    {
        this.running = true;
        this._playIndex = frame;
        this._playIndex = this.clamp(this._playIndex, 0, this.col - 1);

    }

    /**
     * 跳帧停止 类似于flash影片剪辑的接口
     * @param frame 
     */
    public gotoAndStop(frame:number)
    {
        this.running = false;

        this._playIndex = frame;
        this._playIndex = this.clamp(this._playIndex, 0, this.col - 1);
        
        this.m_sprite.spriteFrame = this._bitmapArr[this.rowIndex][this._playIndex];
    }


    /**
     * 控制值的上下限
     * @param value 
     * @param minLimit 
     * @param maxLimit 
     * @returns 
     */
    public clamp(value:number,minLimit:number,maxLimit:number)
    {
        if(value < minLimit)
        {
            return minLimit;
        }

        if(value > maxLimit)
        {
            return maxLimit;
        }

        return value;
    }

}
