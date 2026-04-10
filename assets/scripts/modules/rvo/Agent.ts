import { KeyValuePair, Line, Obstacle, RVOMath, Vector2 } from "./Common";
import Simulator from "./Simulator";

export class Agent {
    public agentNeighbors_: KeyValuePair[] = [];
    public obstaclNeighbors_: KeyValuePair[] = [];
    public orcaLines_: Line[] = [];
    public position_ = new Vector2(0, 0);
    public prefVelocity_ = new Vector2(0, 0);
    public velocity_ = new Vector2(0, 0);
    public id: number = 0;
    public maxNeighbors_: number = 0;
    public maxSpeed_: number = 0;
    public neighborDist: number = 0;
    public radius_: number = 0;
    public timeHorizon = 0;
    public timeHorizonObst: number = 0;
    public newVelocity_ = new Vector2(0, 0);
    public mass: number = 1;

    public computeNeighbors(simulator: Simulator) {
        this.obstaclNeighbors_.length = 0;
        let t = Math.pow(this.timeHorizonObst * this.maxSpeed_ + this.radius_, 2);
        simulator.kdTree.computeObstacleNeighbors(this, t);
        this.agentNeighbors_.length = 0;
        if (this.maxNeighbors_ > 0) {
            t = Math.pow(this.neighborDist, 2);
            t = simulator.kdTree.computeAgentNeighbors(this, t);
        }
    }

    public computeNewVelocity(dtTime: number) {
        this.orcaLines_.length = 0;
        for (var t = this.orcaLines_, n = 1 / this.timeHorizonObst, r = 0; r < this.obstaclNeighbors_.length; ++r) {
            for (var a = this.obstaclNeighbors_[r].value, c = a.next, h = a.point.minus(this.position_), l = c.point.minus(this.position_), u = !1, p = 0; p < t.length; ++p)
                if (RVOMath.det(h.scale(n).minus(t[p].point), t[p].direction) - n * this.radius_ >= -RVOMath.RVO_EPSILON && RVOMath.det(l.scale(n).minus(t[p].point), t[p].direction) - n * this.radius_ >= -RVOMath.RVO_EPSILON) {
                    u = !0;
                    break
                }
            if (!u) {
                var d = RVOMath.absSq(h)
                    , _ = RVOMath.absSq(l)
                    , m = RVOMath.sqr(this.radius_)
                    , y = c.point.minus(a.point)
                    , g = h.scale(-1).multiply(y) / RVOMath.absSq(y)
                    , v = RVOMath.absSq(h.scale(-1).minus(y.scale(g)))
                    , b = new Line();
                if (g < 0 && d <= m)
                    a.convex && (b.point = new Vector2(0, 0),
                        b.direction = RVOMath.normalize(new Vector2(-h.y, h.x)),
                        t.push(b));
                else if (g > 1 && _ <= m)
                    c.convex && RVOMath.det(l, c.direction) >= 0 && (b.point = new Vector2(0, 0),
                        b.direction = RVOMath.normalize(new Vector2(-l.y, l.x)),
                        t.push(b));
                else if (g >= 0 && g <= 1 && v <= m)
                    b.point = new Vector2(0, 0),
                        b.direction = a.direction.scale(-1),
                        t.push(b);
                else {
                    var f = void 0
                        , x = void 0;
                    if (g < 0 && v <= m) {
                        if (!a.convex)
                            continue;
                        c = a;
                        var w = Math.sqrt(d - m);
                        f = new Vector2(h.x * w - h.y * this.radius_, h.x * this.radius_ + h.y * w).scale(1 / d),
                            x = new Vector2(h.x * w + h.y * this.radius_, -h.x * this.radius_ + h.y * w).scale(1 / d)
                    } else if (g > 1 && v <= m) {
                        if (!c.convex)
                            continue;
                        a = c;
                        var N = Math.sqrt(_ - m);
                        f = new Vector2(l.x * N - l.y * this.radius_, l.x * this.radius_ + l.y * N).scale(1 / _),
                            x = new Vector2(l.x * N + l.y * this.radius_, -l.x * this.radius_ + l.y * N).scale(1 / _)
                    } else {
                        if (a.convex) {
                            var q = Math.sqrt(d - m);
                            f = new Vector2(h.x * q - h.y * this.radius_, h.x * this.radius_ + h.y * q).scale(1 / d)
                        } else
                            f = a.direction.scale(-1);
                        if (c.convex) {
                            var S = Math.sqrt(_ - m);
                            x = new Vector2(l.x * S + l.y * this.radius_, -l.x * this.radius_ + l.y * S).scale(1 / _)
                        } else
                            x = a.direction
                    }
                    var V = a.previous
                        , M = !1
                        , O = !1;
                    a.convex && RVOMath.det(f, V.direction.scale(-1)) >= 0 && (f = V.direction.scale(-1),
                        M = !0),
                        c.convex && RVOMath.det(x, c.direction) <= 0 && (x = c.direction,
                            O = !0);
                    var P = a.point.minus(this.position_).scale(n)
                        , z = c.point.minus(this.position_).scale(n)
                        , L = z.minus(P)
                        , k = a == c ? .5 : this.velocity_.minus(P).multiply(L) / RVOMath.absSq(L)
                        , R = this.velocity_.minus(P).multiply(f)
                        , A = this.velocity_.minus(z).multiply(x);
                    if (k < 0 && R < 0 || a == c && R < 0 && A < 0) {
                        var H = RVOMath.normalize(this.velocity_.minus(P));
                        b.direction = new Vector2(H.y, -H.x),
                            b.point = P.plus(H.scale(this.radius_ * n)),
                            t.push(b)
                    } else if (k > 1 && A < 0) {
                        var E = RVOMath.normalize(this.velocity_.minus(z));
                        b.direction = new Vector2(E.y, -E.x),
                            b.point = z.plus(E.scale(this.radius_ * n)),
                            t.push(b)
                    } else {
                        var I = k < 0 || k > 1 || a == c ? 1 / 0 : RVOMath.absSq(this.velocity_.minus(L.scale(k).plus(P)))
                            , B = R < 0 ? 1 / 0 : RVOMath.absSq(this.velocity_.minus(f.scale(R).plus(P)))
                            , D = A < 0 ? 1 / 0 : RVOMath.absSq(this.velocity_.minus(x.scale(A).plus(z)));
                        if (I <= B && I <= D) {
                            b.direction = a.direction.scale(-1);
                            var F = new Vector2(-b.direction.y, b.direction.x);
                            b.point = F.scale(this.radius_ * n).plus(P),
                                t.push(b)
                        } else if (B <= D) {
                            if (M)
                                continue;
                            b.direction = f;
                            var T = new Vector2(-b.direction.y, b.direction.x);
                            b.point = T.scale(this.radius_ * n).plus(P),
                                t.push(b)
                        } else if (!O) {
                            b.direction = x.scale(-1);
                            var C = new Vector2(-b.direction.y, b.direction.x);
                            b.point = C.scale(this.radius_ * n).plus(z),
                                t.push(b)
                        }
                    }
                }
            }
        }
        for (var K = t.length, X = 1 / this.timeHorizon, Z = 0; Z < this.agentNeighbors_.length; ++Z) {
            var j = this.agentNeighbors_[Z].value
                , G = j.position_.minus(this.position_)
                , J = j.mass / (this.mass + j.mass)
                , Q = this.mass / (this.mass + j.mass)
                , U = J >= .5 ? this.velocity_.minus(this.velocity_.scale(J)).scale(2) : this.prefVelocity_.plus(this.velocity_.minus(this.prefVelocity_).scale(2 * J))
                , W = Q >= .5 ? j.velocity_.scale(2).scale(1 - Q) : j.prefVelocity_.plus(j.velocity_.minus(j.prefVelocity_).scale(2 * Q))
                , Y = U.minus(W)
                , $ = RVOMath.absSq(G)
                , ii = this.radius_ + j.radius_
                , ti = RVOMath.sqr(ii)
                , ei = new Line()
                , si = void 0;
            if ($ > ti) {
                var ni = Y.minus(G.scale(X)), oi = RVOMath.absSq(ni), ri = ni.multiply(G);
                if (ri < 0 && RVOMath.sqr(ri) > ti * oi) {
                    var ai = Math.sqrt(oi), ci = ni.scale(1 / ai);
                    ei.direction = new Vector2(ci.y, -ci.x), si = ci.scale(ii * X - ai)
                } else {
                    var hi = Math.sqrt($ - ti);
                    if (RVOMath.det(G, ni) > 0) {
                        var li = new Vector2(G.x * hi - G.y * ii, G.x * ii + G.y * hi);
                        ei.direction = li.scale(1 / $);
                    } else {
                        var ui = new Vector2(G.x * hi + G.y * ii, -G.x * ii + G.y * hi);
                        ei.direction = ui.scale(-1 / $);
                    }
                    var pi = Y.multiply(ei.direction);
                    si = ei.direction.scale(pi).minus(Y)
                }
            } else {
                var di = 1 / dtTime, _i = Y.minus(G.scale(di)), mi = RVOMath.abs(_i), yi = _i.scale(1 / mi);
                ei.direction = new Vector2(yi.y, -yi.x);
                si = yi.scale(ii * di - mi);
            }
            ei.point = U.plus(si.scale(J));
            t.push(ei);
        }
        var gi = this.linearProgram2(t, this.maxSpeed_, this.prefVelocity_, !1, this.newVelocity_);
        gi < t.length && this.linearProgram3(t, K, gi, this.maxSpeed_, this.newVelocity_);
    }

    public insertAgentNeighbor(agent: Agent, t: number) {
        if (this != agent) {
            var s = RVOMath.absSq(this.position_.minus(agent.position_));
            if (s < t) {
                this.agentNeighbors_.length < this.maxNeighbors_ && this.agentNeighbors_.push(new KeyValuePair(s, agent));
                for (var o = this.agentNeighbors_.length - 1; 0 != o && s < this.agentNeighbors_[o - 1].key;) {
                    this.agentNeighbors_[o] = this.agentNeighbors_[o - 1];
                    --o;
                }

                this.agentNeighbors_[o] = new KeyValuePair(s, agent);
                this.agentNeighbors_.length == this.maxNeighbors_ && (t = this.agentNeighbors_[this.agentNeighbors_.length - 1].key);
            }
        }
        return t;
    }

    public insertObstacleNeighbor(i: Obstacle, t: number) {
        var s = i.next, o = RVOMath.distSqPointLineSegment(i.point, s.point, this.position_);
        if (o < t) {
            this.obstaclNeighbors_.push(new KeyValuePair(o, i));
            for (var r = this.obstaclNeighbors_.length - 1; 0 != r && o < this.obstaclNeighbors_[r - 1].key;) {
                this.obstaclNeighbors_[r] = this.obstaclNeighbors_[r - 1];
                --r;
            }

            this.obstaclNeighbors_[r] = new KeyValuePair(o, i);
        }
    }

    public update(dtTime: number) {
        this.velocity_.copy(this.newVelocity_);
        this.position_.copy(this.position_.plus(this.velocity_.scale(dtTime)));
    }

    public linearProgram1(i: Line[], t: number, s: number, n: Vector2, o: boolean, r: Vector2) {
        var a = i[t].point.multiply(i[t].direction)
            , c = RVOMath.sqr(a) + RVOMath.sqr(s) - RVOMath.absSq(i[t].point);
        if (c < 0)
            return !1;
        for (var h = Math.sqrt(c), l = -a - h, u = -a + h, p = 0; p < t; ++p) {
            var d = RVOMath.det(i[t].direction, i[p].direction)
                , _ = RVOMath.det(i[p].direction, i[t].point.minus(i[p].point));
            if (Math.abs(d) <= RVOMath.RVO_EPSILON) {
                if (_ < 0)
                    return !1
            } else {
                var m = _ / d;
                if (d >= 0 ? u = Math.min(u, m) : l = Math.max(l, m),
                    l > u)
                    return !1
            }
        }
        if (o)
            n.multiply(i[t].direction) > 0 ? r.copy(i[t].point.plus(i[t].direction.scale(u))) : r.copy(i[t].point.plus(i[t].direction.scale(l)));
        else {
            var y = i[t].direction.multiply(n.minus(i[t].point));
            y < l ? r.copy(i[t].point.plus(i[t].direction.scale(l))) : y > u ? r.copy(i[t].point.plus(i[t].direction.scale(u))) : r.copy(i[t].point.plus(i[t].direction.scale(y)))
        }
        return !0;
    }

    public linearProgram2(i: Line[], t: number, s: Vector2, n: boolean, o: Vector2) {
        n ? o.copy(s.scale(t)) : RVOMath.absSq(s) > RVOMath.sqr(t) ? o.copy(RVOMath.normalize(s).scale(t)) : o.copy(s);
        for (var r = 0; r < i.length; ++r) {
            if (RVOMath.det(i[r].direction, i[r].point.minus(o)) > 0) {
                var a = o.clone();
                if (!this.linearProgram1(i, r, t, s, n, o))
                    return o.copy(a),
                        r
            }
        }
        return i.length;
    }

    public linearProgram3(i: Line[], t: number, n: number, r: number, a: Vector2) {
        for (var c = 0, h = n; h < i.length; ++h) {
            if (RVOMath.det(i[h].direction, i[h].point.minus(a)) > c) {
                for (var l = [], u = 0; u < t; ++u)
                    l.push(i[u]);
                for (var p = t; p < h; ++p) {
                    var d = new Line()
                        , _ = RVOMath.det(i[h].direction, i[p].direction);
                    if (Math.abs(_) <= RVOMath.RVO_EPSILON) {
                        if (i[h].direction.multiply(i[p].direction) > 0)
                            continue;
                        d.point = i[h].point.plus(i[p].point).scale(.5)
                    } else
                        d.point = i[h].point.plus(i[h].direction.scale(RVOMath.det(i[p].direction, i[h].point.minus(i[p].point)) / _));
                    d.direction = RVOMath.normalize(i[p].direction.minus(i[h].direction)),
                        l.push(d)
                }
                var m = a.clone();
                this.linearProgram2(l, r, new Vector2(-i[h].direction.y, i[h].direction.x), !0, a) < l.length && a.copy(m),
                    c = RVOMath.det(i[h].direction, i[h].point.minus(a))
            }
        }
    }
}