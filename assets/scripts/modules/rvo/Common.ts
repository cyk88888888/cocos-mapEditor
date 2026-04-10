export class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /** 向量和*/
    public plus(vec: Vector2) {
        return new Vector2(this.x + vec.x, this.y + vec.y);
    }

    /** 向量差*/
    public minus(vec: Vector2) {
        return new Vector2(this.x - vec.x, this.y - vec.y);
    }

    /** 向量积*/
    public multiply(vec: Vector2) {
        return this.x * vec.x + this.y * vec.y;
    }

    /** 向量缩放*/
    public scale(scale: number) {
        return new Vector2(this.x * scale, this.y * scale);
    }

    /**复制向量值（当前向量的值会变成目标向量的值） */
    public copy(vec: Vector2) {
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }

    /**克隆向量值（返回一个新的当前向量值） */
    public clone() {
        return new Vector2(this.x, this.y)
    }
}

export class Obstacle {
    public next: Obstacle;
    public previous: Obstacle;
    public direction: Vector2;
    public point: Vector2;
    public id: number;
    public convex: boolean;
}

export class Line {
    public point: Vector2;
    public direction: Vector2;
}

export class KeyValuePair {
    public key: number;
    public value: any;
    constructor(key: number, value: any) {
        this.key = key;
        this.value = value;
    }
}

export class RVOMath {
    public static RVO_EPSILON: number = 0.00001;
    /** 自身向量积*/
    public static absSq(vec: Vector2) {
        return vec.multiply(vec);
    }

    public static normalize(vec: Vector2) {
        return vec.scale(1 / RVOMath.abs(vec));
    }

    public static distSqPointLineSegment(n: Vector2, i: Vector2, s: Vector2) {
        let u = s.minus(n), e = i.minus(n), o = u.multiply(e) / RVOMath.absSq(e);
        return o < 0 ? this.absSq(u) : o > 1 ? RVOMath.absSq(s.minus(i)) : RVOMath.absSq(s.minus(n.plus(e.scale(o))));
    }

    public static sqr(value: number) {
        return value * value;
    }

    public static det(t: Vector2, n: Vector2) {
        return t.x * n.y - t.y * n.x;
    }

    public static abs(n: Vector2) {
        return Math.sqrt(RVOMath.absSq(n));
    }

    public static leftOf(n: Vector2, i: Vector2, s: Vector2) {
        return RVOMath.det(n.minus(s), i.minus(n));
    }
}