import { Agent } from "./Agent";
import { Obstacle, RVOMath, Vector2 } from "./Common";
import Simulator from "./Simulator";
export interface KdTreeAgentNode {
    begin: number;
    end: number;
    left: number;
    right: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

export interface KdTreeNode {
    obstacle: Obstacle;
    left: KdTreeNode;
    right: KdTreeNode;
}

export class KdtreeCompare {
    public a: number;
    public b: number;
    constructor(a: number, b: number) {
        this.a = a;
        this.b = b;
    }

    public lessThan(e: KdtreeCompare) {
        return this.a < e.a || !(e.a < this.a) && this.b < e.b;
    }

    public lessEqualThan(e:KdtreeCompare) {
        return this.a == e.a && this.b == e.b || this.lessThan(e);
    }

    public bigThan(e:KdtreeCompare) {
        return !this.lessEqualThan(e);
    }

    public bigEqualThan(e:KdtreeCompare) {
        return !this.lessThan(e);
    }
}

export class KdTree {
    public MAX_LEAF_SIZE = 10;
    public agents = null;
    public agentTree: KdTreeAgentNode[] = [];
    public obstacleTree:KdTreeNode = null;
    public buildAgentTree(len: number) {
        if (!this.agents || this.agents.length != len || Simulator.instance.hasAgentChange) {
            Simulator.instance.hasAgentChange = !1;
            this.agents = new Array(len);
            for (var t = 0; t < this.agents.length; t++) {
                this.agents[t] = Simulator.instance.getAgent(t);
            }

            this.agentTree = new Array(2 * this.agents.length);
            for (var i = 0; i < this.agentTree.length; i++) {
                this.agentTree[i] = <KdTreeAgentNode>{};
            }
        }
        if (this.agents.length) this.buildAgentTreeRecursive(0, this.agents.length, 0);
    }

    public buildObstacleTree() {
        let obstacles = Simulator.instance.obstacles;
        let cloneObstacles:Obstacle[] = [];
        for (var t = 0; t < obstacles.length; t++){
            cloneObstacles[t] = obstacles[t];
        }
        this.obstacleTree = this.buildObstacleTreeRecursive(cloneObstacles);
    }

    public computeAgentNeighbors(e: Agent, t: number) {
        return this.queryAgentTreeRecursive(e, t, 0);
    }

    public computeObstacleNeighbors(e: Agent, t: number) {
        this.queryObstacleTreeRecursive(e, t, this.obstacleTree);
    }

    public queryVisibility(e:Vector2, t:Vector2, i:number) {
        return this.queryVisibilityRecursive(e, t, i, this.obstacleTree);
    }

    private buildAgentTreeRecursive(e: number, t: number, i: number) {
        this.agentTree[i].begin = e,
            this.agentTree[i].end = t,
            this.agentTree[i].minX = this.agentTree[i].maxX = this.agents[e].position_.x,
            this.agentTree[i].minY = this.agentTree[i].maxY = this.agents[e].position_.y;
        for (var n = e + 1; n < t; ++n)
            this.agentTree[i].maxX = Math.max(this.agentTree[i].maxX, this.agents[n].position_.x),
                this.agentTree[i].minX = Math.min(this.agentTree[i].minX, this.agents[n].position_.x),
                this.agentTree[i].maxY = Math.max(this.agentTree[i].maxY, this.agents[n].position_.y),
                this.agentTree[i].minY = Math.min(this.agentTree[i].minY, this.agents[n].position_.y);
        if (t - e > this.MAX_LEAF_SIZE) {
            for (var s = this.agentTree[i].maxX - this.agentTree[i].minX > this.agentTree[i].maxY - this.agentTree[i].minY, r = .5 * (s ? this.agentTree[i].maxX + this.agentTree[i].minX : this.agentTree[i].maxY + this.agentTree[i].minY), a = e, h = t; a < h;) {
                for (; a < h && (s ? this.agents[a].position_.x : this.agents[a].position_.y) < r;)
                    ++a;
                for (; h > a && (s ? this.agents[h - 1].position_.x : this.agents[h - 1].position_.y) >= r;)
                    --h;
                if (a < h) {
                    var o = this.agents[a];
                    this.agents[a] = this.agents[h - 1],
                        this.agents[h - 1] = o,
                        ++a,
                        --h
                }
            }
            var g = a - e;
            0 == g && (++g,
                ++a,
                ++h),
                this.agentTree[i].left = i + 1,
                this.agentTree[i].right = i + 2 * g,
                this.buildAgentTreeRecursive(e, a, this.agentTree[i].left),
                this.buildAgentTreeRecursive(a, t, this.agentTree[i].right)
        }
    }

    private buildObstacleTreeRecursive(e: Obstacle[]) {
        if (!e.length)
            return null;
        let t = <KdTreeNode>{};
        for (var a = 0, o = e.length, g = o, u = 0; u < e.length; ++u) {
            for (var l = 0, c = 0, f = e[u], T = f.next, v = 0; v < e.length; v++)
                if (u != v) {
                    var p = e[v]
                        , b = p.next
                        , m = RVOMath.leftOf(f.point, T.point, p.point)
                        , q = RVOMath.leftOf(f.point, T.point, b.point);
                    m >= -RVOMath.RVO_EPSILON && q >= -RVOMath.RVO_EPSILON ? ++l : (m <= RVOMath.RVO_EPSILON && q <= RVOMath.RVO_EPSILON || ++l,
                        ++c);
                    var x = new KdtreeCompare(Math.max(l, c), Math.min(l, c))
                        , y = new KdtreeCompare(Math.max(o, g), Math.min(o, g));
                    if (x.bigEqualThan(y))
                        break
                }
            var R = new KdtreeCompare(Math.max(l, c), Math.min(l, c))
                , O = new KdtreeCompare(Math.max(o, g), Math.min(o, g));
            R.lessThan(O) && (o = l,
                g = c,
                a = u)
        }
        for (var d = [], _ = 0; _ < o; ++_)
            d.push(null);
        for (var A = [], M = 0; M < g; ++M)
            A.push(null);
        for (var V = 0, X = 0, E = a, S = e[E], Y = S.next, I = 0; I < e.length; ++I) {
            if (E != I) {
                var L = e[I]
                    , N = L.next
                    , w = RVOMath.leftOf(S.point, Y.point, L.point)
                    , P = RVOMath.leftOf(S.point, Y.point, N.point);
                if (w >= -RVOMath.RVO_EPSILON && P >= -RVOMath.RVO_EPSILON)
                    d[V++] = e[I];
                else if (w <= RVOMath.RVO_EPSILON && P <= RVOMath.RVO_EPSILON)
                    A[X++] = e[I];
                else {
                    var F = RVOMath.det(Y.point.minus(S.point), L.point.minus(S.point)) / RVOMath.det(Y.point.minus(S.point), L.point.minus(N.point))
                        , k = L.point.plus(N.point.minus(L.point).scale(F))
                        , C = new Obstacle();
                    C.point = k,
                        C.previous = L,
                        C.next = N,
                        C.convex = !0,
                        C.direction = L.direction,
                        C.id = Simulator.instance.obstacles.length,
                        Simulator.instance.obstacles.push(C),
                        L.next = C,
                        N.previous = C,
                        w > 0 ? (d[V++] = L,
                            A[X++] = C) : (A[X++] = L,
                                d[V++] = C)
                }
            }
        }
        t.obstacle = S;
        t.left = this.buildObstacleTreeRecursive(d);
        t.right = this.buildObstacleTreeRecursive(A);
        return t;
    }

    private queryAgentTreeRecursive(agent: Agent, t: number, n: number) {
        if (this.agentTree[n].end - this.agentTree[n].begin <= this.MAX_LEAF_SIZE)
            for (var s = this.agentTree[n].begin; s < this.agentTree[n].end; ++s)
                t = agent.insertAgentNeighbor(this.agents[s], t);
        else {
            var r = RVOMath.sqr(Math.max(0, this.agentTree[this.agentTree[n].left].minX - agent.position_.x)) + RVOMath.sqr(Math.max(0, agent.position_.x - this.agentTree[this.agentTree[n].left].maxX)) + RVOMath.sqr(Math.max(0, this.agentTree[this.agentTree[n].left].minY - agent.position_.y)) + RVOMath.sqr(Math.max(0, agent.position_.y - this.agentTree[this.agentTree[n].left].maxY))
                , a = RVOMath.sqr(Math.max(0, this.agentTree[this.agentTree[n].right].minX - agent.position_.x)) + RVOMath.sqr(Math.max(0, agent.position_.x - this.agentTree[this.agentTree[n].right].maxX)) + RVOMath.sqr(Math.max(0, this.agentTree[this.agentTree[n].right].minY - agent.position_.y)) + RVOMath.sqr(Math.max(0, agent.position_.y - this.agentTree[this.agentTree[n].right].maxY));
            r < a ? r < t && a < (t = this.queryAgentTreeRecursive(agent, t, this.agentTree[n].left)) && (t = this.queryAgentTreeRecursive(agent, t, this.agentTree[n].right)) : a < t && r < (t = this.queryAgentTreeRecursive(agent, t, this.agentTree[n].right)) && (t = this.queryAgentTreeRecursive(agent, t, this.agentTree[n].left))
        }
        return t
    }

    private queryObstacleTreeRecursive(e: Agent, t: number, n: KdTreeNode) {
        if (null == n)
            return t;
        var s = n.obstacle
            , r = s.next
            , a = RVOMath.leftOf(s.point, r.point, e.position_);
        return t = this.queryObstacleTreeRecursive(e, t, a >= 0 ? n.left : n.right),
            RVOMath.sqr(a) / RVOMath.absSq(r.point.minus(s.point)) < t && (a < 0 && e.insertObstacleNeighbor(n.obstacle, t),
                this.queryObstacleTreeRecursive(e, t, a >= 0 ? n.right : n.left)),
            t
    }

    private queryVisibilityRecursive(e: Vector2, t:Vector2, n: number, s:KdTreeNode) {
        if (null == s)
            return !0;
        var r = s.obstacle
            , a = r.next
            , h = RVOMath.leftOf(r.point, a.point, e)
            , o = RVOMath.leftOf(r.point, a.point, t)
            , g = 1 / RVOMath.absSq(a.point.minus(r.point));
        if (h >= 0 && o >= 0)
            return this.queryVisibilityRecursive(e, t, n, s.left) && (RVOMath.sqr(h) * g >= RVOMath.sqr(n) && RVOMath.sqr(o) * g >= RVOMath.sqr(n) || this.queryVisibilityRecursive(e, t, n, s.right));
        if (h <= 0 && o <= 0)
            return this.queryVisibilityRecursive(e, t, n, s.right) && (RVOMath.sqr(h) * g >= RVOMath.sqr(n) && RVOMath.sqr(o) * g >= RVOMath.sqr(n) || this.queryVisibilityRecursive(e, t, n, s.left));
        if (h >= 0 && o <= 0)
            return this.queryVisibilityRecursive(e, t, n, s.left) && this.queryVisibilityRecursive(e, t, n, s.right);
        var u = RVOMath.leftOf(e, t, r.point)
            , l = RVOMath.leftOf(e, t, a.point)
            , c = 1 / RVOMath.absSq(t.minus(e));
        return u * l >= 0 && RVOMath.sqr(u) * c > RVOMath.sqr(n) && RVOMath.sqr(l) * c > RVOMath.sqr(n) && this.queryVisibilityRecursive(e, t, n, s.left) && this.queryVisibilityRecursive(e, t, n, s.right)
    }
}