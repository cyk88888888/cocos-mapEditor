import { _decorator, Button, CCString, Component, Label, Node } from 'cc';
import { UIComp } from 'db://cocos-framework/ui/UIComp';
import { UILayer } from 'db://cocos-framework/ui/UILayer';
const { ccclass, property, executeInEditMode  } = _decorator;

@ccclass('Dlg_frame')
@executeInEditMode(true)
export class Dlg_frame extends UIComp {
    @property({ type: CCString, tooltip: "弹窗标题"  })
    public title: string = "";

    private lbl_title: Label;
    protected ctor() {
        let self = this;
        self.lbl_title = this.node.getChildByName("title").getComponent(Label);
    }

    protected onEnter() {
        let self = this;
        self.lbl_title.string = self.title;
    }

    private _tap_btn_close(){
        let self = this;
        let master = self.node.parent;
        let masterScript = master.getComponent(UILayer);
        masterScript && masterScript.close();
    }

}


