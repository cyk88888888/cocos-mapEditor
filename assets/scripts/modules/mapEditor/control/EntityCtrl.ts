import { _decorator, instantiate, Node } from 'cc';
import { EntityPrefabs, PlayerTexture } from '../entity/entityPrefabs/EntityPrefabs';
import PathFindingAgent from '../../road/PathFindingAgent';
import { Player, PlayerControlType, PlayerType } from '../../rvo/entity/Player';
import { RVOSystem } from '../../rvo/RVOSystem';
import { ControlMode } from '../../rvo/ControlMode';
import { emmiter } from '../../../../../extensions/cocos-framework/src/base/Emmiter';
import { CONST } from '../../base/CONST';
const { ccclass } = _decorator;

/**
 * @descripttion 测试运行时的实体管理类
 * @author cyk
 * @date 2023-05-30 23:00:00
 */
@ccclass('EntityCtrl')
export class EntityCtrl {
    private grp_entity: Node;
    public myPlayer: Player;
    private _isCanControlPlayer: boolean;
    private _curRoleIndex:number;
    private _playerTexs: PlayerTexture[];
    public constructor(grp_entity: Node) {
        let self = this;
        self._isCanControlPlayer = true;
        self.init(grp_entity);
    }

    private init(grp_entity: Node) {
        let self = this;
        self.grp_entity = grp_entity;
        self.addPlayer();
        emmiter.on(CONST.GEVT.ChgRole, self.onChgRole, self);
        self._curRoleIndex = 0;
    }

    private addPlayer() {
        let self = this;
        let entityPrefabs = self.grp_entity.getComponent(EntityPrefabs);
        let playerNode = instantiate(entityPrefabs.playerPrefab);
        self._playerTexs = entityPrefabs.playerTexs;
        playerNode.setParent(self.grp_entity);
        let startPos = PathFindingAgent.inst.getRandomStartPos();
        playerNode.setPosition(startPos.x, startPos.y);
        self.myPlayer = playerNode.getComponent(Player);
        self.myPlayer.playerType = PlayerType.my;
        self.myPlayer.controlType = PlayerControlType.user;
        self.myPlayer.controlMode = ControlMode.joystick;
        RVOSystem.instance.runing && self.myPlayer.initRVO();
    }

    private onChgRole(){
        let self = this;
        self._curRoleIndex++;
        if(self._curRoleIndex >= self._playerTexs.length){
            self._curRoleIndex = 0;
        }
        self.initRoleTexture(self._curRoleIndex);
    }

    private initRoleTexture(roleIndex: number){
        let self = this;
        let playerTex = self._playerTexs[roleIndex];
        let myPlayer = self.myPlayer;
        let idleMovieClip = myPlayer.idleMovieClip;
        let walkMovieClip = myPlayer.walkMovieClip;
        idleMovieClip.init(playerTex.idle, idleMovieClip.row, idleMovieClip.col);
        walkMovieClip.init(playerTex.run, walkMovieClip.row, walkMovieClip.col);
    }

    public update(deltaTime: number) {}

    public get isCanControlPlayer(){
        return this._isCanControlPlayer;
    }

    public set isCanControlPlayer(value: boolean){
        this._isCanControlPlayer = value;
    }

    public clear() {
        let self = this;
        if (self.myPlayer) {
            self.myPlayer.node.destroy();
            self.myPlayer = null;
        }
        emmiter.off(CONST.GEVT.ChgRole, self.onChgRole, self);
    }
}

