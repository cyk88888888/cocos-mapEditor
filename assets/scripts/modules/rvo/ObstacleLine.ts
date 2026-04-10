export default class ObstacleLine {
    public startX: number;
    public startY: number;
    public endX: number;
    public endY: number;
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
    }

    public moveTo(startX: number, startY: number) {
        this.startX = startX;
        this.startY = startY;
    }

    public lineTo(endX: number, endY: number) {
        this.endX = endX;
        this.endY = endY;
    }
}