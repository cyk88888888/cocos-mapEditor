import { _decorator, Component, Sprite, Color, Vec3, UITransform, Texture2D, Vec2, CCInteger, Size, Node } from "cc";
import { TextureUtils } from "./TextureUtils";
const { ccclass, property } = _decorator;
/**
 * @descripttion 战争迷雾组件
 * @author cyk
 * @date 2024-06-29 16:00:00
 */
@ccclass('FogOfWar')
export class FogOfWar extends Component {
    @property({ type: Sprite })
    private fogMask: Sprite;
    @property({ type: CCInteger })
    private texWidth: number = 256;
    @property({ type: CCInteger })
    private texHeight: number = 256;
    @property({ type: Color })
    private defaultColor: Color = new Color(0, 0, 0, 255);

    public static instance: FogOfWar;
    private maskTex: Texture2D = null
    private texUtils: TextureUtils;
    private maskSize: Size;
    private maskScaleX = 1;
    private maskScaleY = 1;
    private maskScale = 1;
    private tempVec3 = new Vec3();
    private isTexChange = false;
    onLoad() {
        FogOfWar.instance = this;
    }

    init(width: number, height: number) {
        this.fogMask.node.getComponent(UITransform).setContentSize(width, height);
        this.maskTex = new Texture2D();
        this.maskTex.reset({
            width: this.texWidth,
            height: this.texHeight,
            format: Texture2D.PixelFormat.RGBA8888
        });
        this.texUtils = new TextureUtils();
        this.texUtils.init(this.maskTex);
        this.resetColor();
        this.maskTex.uploadData(this.texUtils.getData());
        this.maskSize = this.fogMask.node.getComponent(UITransform).contentSize;
        this.maskScaleX = this.texWidth / this.maskSize.width;
        this.maskScaleY = this.texHeight / this.maskSize.height;
        this.maskScale = Math.max(this.maskScaleX, this.maskScaleY);
        this.fogMask.enabled = true;
        this.fogMask.spriteFrame.texture = this.maskTex;
    }

    lateUpdate() {
        if (this.isTexChange) {
            this.isTexChange = false;
            this.maskTex.uploadData(this.texUtils.getData());
        }
    }

    resetColor() {
        for (let i = 0; i < this.texHeight; i++) {
            for (let j = 0; j < this.texWidth; j++) {
                this.texUtils.setPixel(j, i, this.defaultColor);
            }
        }
    }

    /** 绘制圆形*/
    public drawCircle(x: number, y: number, radius: number) {
        let texPos = this.convertNodePosToTexPos(this.fogMask.node, x, y);
        x = Math.floor(texPos.x * this.maskScaleX);
        y = Math.floor(texPos.y * this.maskScaleY);
        radius = Math.floor(radius);
        let horizontal = radius * this.maskScale;
        let vertical = radius * this.maskScale;
        this.drawColor(x, y, horizontal, vertical, radius);
    }

    /** 绘制椭圆形*/
    public drawOval(x: number, y: number, horizontal: number, vertical: number) {
        let texPos = this.convertNodePosToTexPos(this.fogMask.node, x, y);
        x = Math.floor(texPos.x * this.maskScaleX);
        y = Math.floor(texPos.y * this.maskScaleY);
        horizontal = horizontal * this.maskScale;
        vertical = vertical * this.maskScale;
        let radius = Math.max(horizontal, vertical);
        this.drawColor(x, y, horizontal, vertical, radius);
    }

    private convertNodePosToTexPos(node: Node, x: number, y: number) {
        this.tempVec3.set(x, y, 0);
        let uiTransform = node.getComponent(UITransform);
        let uiPos = this.tempVec3;//uiTransform.convertToNodeSpaceAR(this.tempVec3);
        uiPos.x += uiTransform.width * uiTransform.anchorX;
        uiPos.y += uiTransform.height * uiTransform.anchorY;
        uiPos.y = uiTransform.height - uiPos.y;
        return new Vec2(uiPos.x, uiPos.y);
    }

    private drawColor(x: number, y: number, horizontal: number, vertical: number, radius: number) {
        let maskSize = this.maskSize;
        if (maskSize.width < maskSize.height) {
            vertical *= maskSize.width / maskSize.height;
        } else if (maskSize.width > maskSize.height) {
            horizontal *= maskSize.height / maskSize.width;
        }
        let o = horizontal * horizontal;
        let r = vertical * vertical;
        for (let height = y - radius; height < y + radius; height++) {
            for (let width = x - radius; width < x + radius; width++) {
                let m = width - x;
                let u = height - y;
                let f = m * m / o + u * u / r;
                if (f <= 1) {
                    let color = this.texUtils.getPixel(width, height);
                    color.a = Math.floor(color.a * f);
                    this.texUtils.setPixel(width, height, color);
                }
            }
        }
        this.isTexChange = true;
    }

    public clear() {
        let self = this;
        if (self.maskTex) {
            self.maskTex.destroy();
            self.maskTex = null;
        }
        if (self.texUtils) {
            self.texUtils.clear();
            self.texUtils = null;
        }
        this.fogMask.enabled = false;
    }
}