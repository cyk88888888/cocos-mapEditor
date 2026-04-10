import { Texture2D, _decorator, Color } from "cc";
const { ccclass } = _decorator;
/**
 * @descripttion 纹理工具
 * @author cyk
 * @date 2024-06-29 16:00:00
 */
@ccclass("TextureUtils")
export class TextureUtils {
    private _texture2d: Texture2D;
    private width = 100;
    private height = 100;
    private buffer: ArrayBuffer;
    private pixelColor: Uint8Array;
    private colorCount: { [key: number]: number };
    private pointColor: number[];
    init(tex: Texture2D) {
        this._texture2d = tex;
        this.width = this._texture2d.width;
        this.height = this._texture2d.height;
        this.initPixelColor();
    }

    initPixelColor() {
        this.buffer = new ArrayBuffer(4 * this.width * this.height);//每4个字节表示一个像素点
        this.pixelColor = new Uint8Array(this.buffer);
        this.pixelColor.fill(0);
    }

    resetPixelColor() {
        this.pixelColor.fill(0);
    }

    setData(t: Iterable<number>) {
        let unit8Arr = new Uint8Array(t);
        if (unit8Arr.length == 4 * this.width * this.height) {
            this.setPixelColorByRGBA(unit8Arr);
            this.setPointColorByRGBA(unit8Arr);
        } else {
            console.warn("数据格式不对");
        }
    }

    getData() {
        return this.pixelColor;
    }

    copyData(arr?: number[]) {
        if (!arr) arr = [];
        for (let i = 0, o = this.pixelColor.length; i < o; ++i)
            arr[i] = this.pixelColor[i];
        return arr;
    }

    getBuffer() {
        return this.buffer;
    }

    getPointData() {
        return this.pointColor;
    }

    getColorCount(t: number, i: number, o: number, r: number) {
        void 0 === r && (r = 255);
        let e = this.convertToNumber(t, i, o, r);
        return this.colorCount[e];
    }

    setPixelColorByRGBA(unit8Arr: Uint8Array) {
        this.pixelColor.set(unit8Arr);
    }

    setPointColorByRGBA(unit8Arr: Uint8Array) {
        this.colorCount = {};
        for (let i = 0; i < this.height; ++i) {
            let o = i * this.height;
            for (let r = 0; r < this.width; ++r) {
                let e = this.convertToNumber(unit8Arr[o++], unit8Arr[o++], unit8Arr[o++], unit8Arr[o++]);
                this.pointColor[r][i] = e;
                this.colorCount[e] ? this.colorCount[e] += 1 : this.colorCount[e] = 1;
            }
        }
    }

    convertToNumber(t: number, i: number, o: number, r: number) {
        return void 0 === r && (r = 255),
            (254 & t) << 23 | i << 16 | o << 8 | r
    }

    setPixel(width: number, height: number, color: Color) {
        if (!(width < 0 || width >= this.width || height < 0 || height > this.height)) {
            width = Math.round(width);
            height = Math.round(height);
            let r = 4 * (height * this.width + width);
            this.pixelColor[r] = color.r;
            this.pixelColor[r + 1] = color.g;
            this.pixelColor[r + 2] = color.b;
            this.pixelColor[r + 3] = color.a;
        }
    }

    setPixels(colorArr: Color[]) {
        let len = colorArr.length, texSize = this.width * this.height;
        for (let i = 0; i < texSize; i++) {
            if (i < len) {
                let color = colorArr[i];
                this.pixelColor[i] = color.r;
                this.pixelColor[i + 1] = color.g;
                this.pixelColor[i + 2] = color.b;
                this.pixelColor[i + 3] = color.a;
            } else {
                this.pixelColor[i] = 0;
                this.pixelColor[i + 1] = 0;
                this.pixelColor[i + 2] = 0;
                this.pixelColor[i + 3] = 255;
            }
        }
    }

    setBlockPixels(t: number, i: number, o: number, r: number, colorArr: Color[]) {
        let h = 0;
        for (let l = colorArr.length, s = i; s < i + r; s++) {
            for (let n = t; n < t + o; n++) {
                let width = n, height = s;
                if (!(width < 0 || width >= this.width || height < 0 || height > this.height)) {
                    let C = 4 * (height * this.width + width), color = colorArr[h];
                    if (h < l) {
                        this.pixelColor[C] = color.r;
                        this.pixelColor[C + 1] = color.g;
                        this.pixelColor[C + 2] = color.b;
                        this.pixelColor[C + 3] = color.a;
                    } else {
                        this.pixelColor[C] = 0;
                        this.pixelColor[C + 1] = 0;
                        this.pixelColor[C + 2] = 0;
                        this.pixelColor[C + 3] = 255;
                    }
                    h++;
                }
            }
        }
    }

    getPixel(width: number, height: number) {
        if (width < 0 || width >= this.width || height < 0 || height > this.height)
            return new Color(0, 0, 0, 255);
        width = Math.round(width);
        height = Math.round(height);
        let o = 4 * (height * this.width + width);
        let color = new Color();
        color.r = this.pixelColor[o];
        color.g = this.pixelColor[o + 1];
        color.b = this.pixelColor[o + 2];
        color.a = this.pixelColor[o + 3];
        return color;
    }

    getPixels() {
        let colorArr = [];
        for (let i = this.pixelColor.length, o = 0; o < i; o += 4) {
            let color = new Color();
            color.r = this.pixelColor[o];
            color.g = this.pixelColor[o + 1];
            color.b = this.pixelColor[o + 2];
            color.a = this.pixelColor[o + 3];
            colorArr.push(color);
        }
        return colorArr;
    }

    getBlockPixels(t: number, i: number, o: number, e: number) {
        let colorArr = [];
        for (let l = i; l < i + e; l++) {
            for (let s = t; s < t + o; s++) {
                let color = new Color();
                if (s < 0 || s >= this.width || l < 0 || l > this.height) {
                    color.r = 0;
                    color.g = 0;
                    color.b = 0;
                    color.a = 255;
                }
                else {
                    var C = 4 * (l * this.width + s);
                    color.r = this.pixelColor[C];
                    color.g = this.pixelColor[C + 1];
                    color.b = this.pixelColor[C + 2];
                    color.a = this.pixelColor[C + 3];
                }
                colorArr.push(color);
            }
        }
        return colorArr;
    }
    get texture2d() {
        return this._texture2d;
    }
    set texture2d(tex: Texture2D) {
        this._texture2d = tex;
    }

    public clear(){
        let self = this;
        self.buffer = null;
        self.pixelColor = null;
        self.colorCount = null;
        self.pointColor = null;
        self._texture2d = null;
    }
}   
