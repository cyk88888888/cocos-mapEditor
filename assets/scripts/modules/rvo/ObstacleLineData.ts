export default class ObstacleLineData {
    public x: number;
    public y: number;
    public connectLeft: boolean;
    public connectUp: boolean;
    public connectRight: boolean;
    public connectDown: boolean;
    public left: ObstacleLineData;
    public up: ObstacleLineData;
    public right: ObstacleLineData;
    public down: ObstacleLineData;
    public constructor(x: number = 0, y: number = 0) {
        this.left = null,
        this.up = null,
        this.right = null,
        this.down = null,
        this.connectLeft = !1,
        this.connectUp = !1,
        this.connectRight = !1,
        this.connectDown = !1,
        this.x = x,
        this.y = y
    };
}