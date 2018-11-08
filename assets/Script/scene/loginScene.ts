// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
import {clientDefine,SceneName} from "../common/clientDefine"
import { eMsgPort,eMsgType } from "../common/MessageIdentifer"
import clientData from "../globalModule/ClientData"
import Network from "../common/Network"
import Utilty from "../globalModule/Utility"
@ccclass
export default class LoginScene extends cc.Component {

    @property(cc.Node)
    pTipMask : cc.Node = null ;

    // LIFE-CYCLE CALLBACKS:

    strAccount : string = ""
    strPassword : string = "" ;
    strWechatName : string = "";

    onLoad () {
        cc.systemEvent.on(clientDefine.netEventRecievedBaseData,this.onRecievedBaseData,this);
        cc.systemEvent.on(clientDefine.netEventOpen,this.onConnectedToSvr,this);
        cc.systemEvent.on(clientDefine.netEventReconnectd,this.onConnectedToSvr,this);
        this.pTipMask.active = false ;
    }

    start () {
        if ( clientData.getInstance().curAccount.length > 1 && clientData.getInstance().curPwd.length > 1 )
        {
            this.strAccount = clientData.getInstance().curAccount ;
            this.strPassword = clientData.getInstance().curPwd ;
            this.doLogin();
        }
    }

    onClickWechatLogin()
    {
        // lanch wechat
    }

    // clientData will recieved base data , and invoke loading scene ;
    onRecievedBaseData()
    {
        cc.director.loadScene(SceneName.Scene_Main) ;
    }

    onConnectedToSvr()
    {
        console.log("login scene recived connected to svr event");
        if ( this.strAccount != "" && "" != this.strPassword )
        {
            this.doLogin();
        }
    }

    doLogin()
    {
        if ( this.strAccount == "" || "" == this.strPassword )
        {
            Utilty.showTip("account is null") ;
            return ;
        }

        let msgLogin = {};
        msgLogin["cAccount"] = this.strAccount ;
        msgLogin["cPassword"] = this.strPassword ;
        let self = this ;
        Network.getInstance().sendMsg(msgLogin,eMsgType.MSG_PLAYER_LOGIN,eMsgPort.ID_MSG_PORT_GATE,1,
            ( jsmg : Object )=>{
                let ret : number = jsmg["ret"] ;
                self.pTipMask.active = ret == 0 ;
                if ( ret == 0 )  // clientData will recieved base data , and invoke loading scene ;
                {
                    // save a valid account , most used when developing state ;
                    clientData.getInstance().curAccount = this.strAccount;
                    clientData.getInstance().curPwd = this.strPassword ;
                    console.log("login scene login ok");
                    return true ;
                } 
                self.doRegister();
                return true ;
            });
        this.pTipMask.active = true ;
    }

    doRegister()
    {
        let msgReg = {}; // cName
        msgReg["cAccount"] = this.strAccount ;
        msgReg["cPassword"] = this.strPassword ;
        msgReg["cRegisterType"] = this.strWechatName.length > 0 ;
        msgReg["nChannel"] = 0 ;
        let self = this ;
        Network.getInstance().sendMsg(msgReg,eMsgType.MSG_PLAYER_REGISTER,eMsgPort.ID_MSG_PORT_GATE,1,
            ( jsmg : Object )=>{
                let ret : number = jsmg["nRet"] ;
                if ( ret != 0 )  // clientData will recieved base data , and invoke loading scene ;
                {
                    Utilty.showTip("注册账号失败");
                    self.pTipMask.active = false ;
                    return true;
                } 
                // register ok , then save account info to local ;
                this.strAccount = jsmg["cAccount"] ;
                this.strPassword = jsmg["cPassword"] ;
                clientData.getInstance().curAccount = this.strAccount;
                clientData.getInstance().curPwd = this.strPassword ;

                console.log("login scene register ok : " + this.strAccount );
                self.doLogin();
                return true ;
            });
    }

    onDestroy()
    {
        cc.systemEvent.targetOff(this);
    }

    onClickVisitorBtn( event : cc.Event.EventTouch, customEventData : string )
    {
        let nIdx : number = parseInt(customEventData) ;
        let vAcc : string[] = [ "new1","new2","new3","new4"] ;
        let vName : string[] =  [ "new1","new2","new3","new4"] ;
        if ( nIdx >= vAcc.length )
        {
            console.log( "invalid visitor idx = " + nIdx );
            nIdx = 0 ;
        }

        this.strWechatName = vName[nIdx] ;
        this.strAccount = vAcc[nIdx] ;
        this.strPassword = "v1";
        console.log( "visitor " + nIdx + " click login" );
        this.doLogin();
    }
}
