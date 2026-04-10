import { _decorator } from 'cc';
import { UIDlg } from '../../../../../extensions/cocos-framework/src/ui/UIDlg';
const { ccclass, property } = _decorator;

@ccclass('MapThingExtDataEditDlg')
export class MapThingExtDataEditDlg extends UIDlg {
    /** 预制体路径 */
    public static prefabUrl: string = 'prefab/mapEditor/dlg/MapThingExtDataEditDlg';

    protected ctor(): void {
        let self = this;
        self.outSideClosed = true;
    }
}


