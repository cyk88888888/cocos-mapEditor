import { Agent } from "./Agent";
import { Obstacle, RVOMath, Vector2 } from "./Common";
import { KdTree } from "./KdTree";

export default class Simulator {

    private static _instance: Simulator;

    public static get instance(): Simulator {
        if (this._instance == null) {
            this._instance = new Simulator();
        }
        return this._instance;
    }

    public agentId = 0;
    public agentIdLst: number[] = [];
    public aid2agent: { [aid: number]: Agent } = {};
    public hasAgentChange = !1;
    public obstacles: Obstacle[] = [];
    public kdTree = new KdTree();
    public defaultAgent: Agent;
    public time: number = 0;
    public getAgent(index: number) {
        return this.aid2agent[this.agentIdLst[index]];
    }

    public getAgentByAid(aid: number) {
        return this.aid2agent[aid];
    }

    public getGlobalTime() {
        return this.time;
    }

    private getNumAgents() {
        return this.agentIdLst.length;
    }

    public setAgentPrefVelocity(aid: number, e: Vector2) {
        this.aid2agent[aid].prefVelocity_.copy(e);
    }

    public getAgentPosition(aid: number) {
        return this.aid2agent[aid].position_;
    }

    public getAgentPrefVelocity(aid: number) {
        return this.aid2agent[aid].prefVelocity_;
    }

    public getAgentVelocity(aid: number) {
        return this.aid2agent[aid].velocity_;
    }

    public getAgentRadius(aid: number) {
        return this.aid2agent[aid].radius_;
    }

    public getAgentOrcaLines(aid: number) {
        return this.aid2agent[aid].orcaLines_;
    }

    public addAgent(t: Vector2) {
        if (!this.defaultAgent)
            throw new Error("no default agent");
        let agent = new Agent();
        agent.position_.copy(t);
        agent.maxNeighbors_ = this.defaultAgent.maxNeighbors_;
        agent.maxSpeed_ = this.defaultAgent.maxSpeed_;
        agent.neighborDist = this.defaultAgent.neighborDist;
        agent.radius_ = this.defaultAgent.radius_;
        agent.timeHorizon = this.defaultAgent.timeHorizon;
        agent.timeHorizonObst = this.defaultAgent.timeHorizonObst;
        agent.velocity_.copy(this.defaultAgent.velocity_);
        agent.id = this.agentId++;
        this.aid2agent[agent.id] = agent;
        this.agentIdLst.push(agent.id);
        this.hasAgentChange = !0;
        return agent.id;
    }

    public removeAgent(aid: number) {
        if (this.hasAgent(aid)) {
            delete this.aid2agent[aid];
            let index = this.agentIdLst.indexOf(aid);
            this.agentIdLst[index] = this.agentIdLst[this.agentIdLst.length - 1];
            this.agentIdLst.length--;
            this.hasAgentChange = !0;
        }
    }

    public hasAgent(aid: number) {
        return !!this.aid2agent[aid];
    }

    public setAgentMass(aid: number, mass: number) {
        this.aid2agent[aid].mass = mass;
    }

    public getAgentMass(aid: number) {
        return this.aid2agent[aid].mass;
    }

    public setAgentRadius(aid: number, radius: number) {
        this.aid2agent[aid].radius_ = radius;
    }

    public setAgentDefaults(neighborDist: number, maxNeighbors: number, timeHorizon: number, timeHorizonObst: number, radius: number, maxSpeed: number, velocity: Vector2) {
        if(!this.defaultAgent) this.defaultAgent = new Agent();
        this.defaultAgent.maxNeighbors_ = maxNeighbors;
        this.defaultAgent.maxSpeed_ = maxSpeed;
        this.defaultAgent.neighborDist = neighborDist;
        this.defaultAgent.radius_ = radius;
        this.defaultAgent.timeHorizon = timeHorizon;
        this.defaultAgent.timeHorizonObst = timeHorizonObst;
        this.defaultAgent.velocity_ = velocity;
    }

    public run(dtTime: number) {
        this.kdTree.buildAgentTree(this.getNumAgents());
        for (var e = this.agentIdLst.length, n = 0; n < e; n++) {
            this.aid2agent[this.agentIdLst[n]].computeNeighbors(this);
            this.aid2agent[this.agentIdLst[n]].computeNewVelocity(dtTime);
        }
        for (var i = 0; i < e; i++) {
            this.aid2agent[this.agentIdLst[i]].update(dtTime);
        }
        this.time += dtTime;
    }

    public addObstacle(lineVectors: Vector2[]) {
        if (lineVectors.length < 2)
            return -1;
        let len = this.obstacles.length;
        for (let i = 0; i < lineVectors.length; ++i) {
            let obstacle = new Obstacle();
            obstacle.point = lineVectors[i];
            if (i != 0) {
                obstacle.previous = this.obstacles[this.obstacles.length - 1];
                obstacle.previous.next = obstacle;
            }
            if (i == lineVectors.length - 1) {
                obstacle.next = this.obstacles[len];
                obstacle.next.previous = obstacle;
            }
            obstacle.direction = RVOMath.normalize(lineVectors[i == lineVectors.length - 1 ? 0 : i + 1].minus(lineVectors[i]));
            lineVectors.length == 2 ? obstacle.convex = true : obstacle.convex = RVOMath.leftOf(lineVectors[i == 0 ? lineVectors.length - 1 : i - 1], lineVectors[i], lineVectors[i == lineVectors.length - 1 ? 0 : i + 1]) >= 0;
            obstacle.id = this.obstacles.length;
            this.obstacles.push(obstacle);
        }
        return len;
    }

    public processObstacles() {
        this.kdTree.buildObstacleTree();
    }

    public queryVisibility(t, e, n) {
        return this.kdTree.queryVisibility(t, e, n);
    }

    public getObstacles() {
        return this.obstacles;
    }

    public clear() {
        this.agentIdLst.length = 0;
        this.agentId = 0;
        this.aid2agent = {};
        this.defaultAgent = null;
        this.kdTree = new KdTree();
        this.obstacles.length = 0;
    }
}