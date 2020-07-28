import imSocket from "./ws"

import {WS_END_POINT} from './const'
import Api from "./api"
import Proto from "./proto-msg"
import Util from "./proto-util"
import Const from "./proto-const"
import chat from './proto/chat.json'

let Event = require("./event")

function TIM() {
    this.EVENT = Const.EVENT,
    this.ws = null
    this.uid = null
    this.TIM_APP_KEY = ''
}

TIM.prototype.create = function (options) {
    if (!options || !options.hasOwnProperty("tim_app_key")) {
        console.error("缺少tim_app_key")
        return this
    }
    this.TIM_APP_KEY = options.tim_app_key
    return this
}

TIM.prototype.login = async function (options) {
    if (!options) {
        console.error("缺少userId, userSign参数")
        return
    }
    if (!options.hasOwnProperty("userId")) {
        console.error("缺少userId参数")
        return
    }
    if (!options.hasOwnProperty("userSign")) {
        console.error("缺少userSign参数")
        return
    }

    let userId = options.userId
    let userSign = options.userSign

    this.uid = userId

    let err, result
    // 1. 判断TIM_APP_KEY的正确性
    [err, result] = await Api.Org.checkKeyValid({
        app_key: this.TIM_APP_KEY
    })
    if (err || !result) {
        console.error("app_key错误")
        return
    }

    // 2. 判断userId与userSign的正确性
    [err, result] = await Api.User.checkUserValid({
        user_id: userId,
        user_sign: userSign
    })
    if (err || !result) {
        console.error("用户ID, userSig错误")
        return
    }

    // 3. 连接ws
    this.ws = new imSocket({
        url: WS_END_POINT,
        pingMsg: Proto.pingMsg(userId)
    })
    this.ws.onopen = function () {
        console.log("连接建立成功...")
        Proto.connectMsg(userId)
    };
    this.ws.onmessage = async function (event) {
        if (event.data instanceof Blob) {
            let reader = new FileReader()
            reader.readAsArrayBuffer(event.data)
            reader.onload = function (e) {
                let buf = new Uint8Array(reader.result)
                if (!buf || buf.length <= 0) {
                    return
                }
                let body = Proto.respDecode(buf)
                let dataContentProtobuf = Util.protobufCreate("DataContent", "chat")
                let result = Util.protobufDecode(dataContentProtobuf, body)
                if (!result) {
                    return
                }

                switch (result.action) {
                    case chat.nested.DataContent.nested.ActionType.values.CONNECT:
                        console.log('connect...')
                        break;
                    case chat.nested.DataContent.nested.ActionType.values.PING:
                        console.log('ping...')
                        break;
                    case chat.nested.DataContent.nested.ActionType.values.PONG:
                        console.log('pong...')
                        break;
                    case chat.nested.DataContent.nested.ActionType.values.CHAT:
                        if (result.type === chat.nested.DataContent.nested.ChatType.values.C2C) {
                            // 单聊
                            Event.emit(Const.EVENT.MESSAGE_RECEIVED, result.chatMsg)
                        }
                        break;
                    case chat.nested.DataContent.nested.ActionType.values.MSG_SIGN:
                        console.log(Const.EVENT, 111222333)
                        if (result.type === chat.nested.DataContent.nested.ChatType.values.C2C) {
                            // 单聊
                            Event.emit(Const.EVENT.MESSAGE_READ_BY_PEER, result.chatMsg)
                        }
                        break;
                    case chat.nested.DataContent.nested.ActionType.values.MSG_REVOKE:
                        if (result.type === chat.nested.DataContent.nested.ChatType.values.C2C) {
                            // 单聊
                            Event.emit(Const.EVENT.MESSAGE_REVOKED, result.chatMsg)
                        }
                        break;
                }
            }
        }
    };
}

TIM.prototype.logout = function () {
    for (let key in Const.EVENT) {
        Event.off(Const.EVENT[key])
    }
    this.ws.close()
}

TIM.prototype.on = function (event, cb) {
    Event.on(event, cb)
    return this
}

TIM.prototype.createTextMessage = function (options) {
    if (!options || !options.hasOwnProperty("to")) {
        console.error("缺少to参数")
        return
    }
    if (!options || !options.hasOwnProperty("text")) {
        console.error("缺少text参数")
        return
    }
    let to = options.to.trim()
    let text = options.text.trim()
    if (to.length <= 0) {
        console.error("to参数不能为空")
        return
    }
    if (text.length <= 0) {
        console.error("text参数不能为空")
        return
    }

    return {
        fromId: this.uid,
        toId: options.to,
        msg: options.text,
        type: chat.nested.ChatMsg.nested.MsgType.values.TEXT
    }
}

TIM.prototype.sendMessage = function (message) {
    let $this = this;
    return new Promise((resolve, reject) => {
        Api.Message.genId().then(res => {
            message.msgId = res
            let msg = Proto.chatMsg(message)
            $this.ws.send(msg)
            resolve("发送成功")
        }).catch(err => {
            reject("发送失败")
        })
    })
}

export default new TIM()
