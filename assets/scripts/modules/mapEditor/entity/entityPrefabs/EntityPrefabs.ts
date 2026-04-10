import { _decorator, Component, Node, Prefab, Texture2D } from 'cc';
import { UIComp } from '../../../../../../extensions/cocos-framework/src/ui/UIComp';
const { ccclass, property } = _decorator;

@ccclass('PlayerTexture')
export class PlayerTexture {
    @property({ type: Texture2D })
    public run: Texture2D;
    /**
     * 贴图文件名
     */
    @property({type:Texture2D})
    public idle:Texture2D;
}

@ccclass('EntityPrefabs')
export class EntityPrefabs extends UIComp {
    @property({ type: Prefab })
    public playerPrefab: Prefab;
    /**
     * 角色贴图文件名列表
     */
    @property(PlayerTexture)
    public playerTexs:PlayerTexture[] = [];

}

