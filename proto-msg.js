import chat from './proto/chat.json'

import Util from "./proto-util"

const VERSION = 1
const HEAD_LENGTH = 2
const CMD_ID_REQ = 6
const CMD_ID_RESP = 8

let ProtoMsg = {
    connectMsg: connectMsg,
    pingMsg: pingMsg,
    chatMsg: chatMsg,
    signMsg: signMsg,
    respDecode: respDecode
}

function _C2CMsg(action, chatMsg) {
    let data = {
        action: action,
        chatMsg: chatMsg,
        type: chat.nested.DataContent.nested.ChatType.values.C2C,
        platform: chat.nested.DataContent.nested.platformType.values.WEB_H5,
        groupId: 0,
    }
    let dataContentProtobuf = Util.protobufCreate("DataContent", "chat")
    let buffer = Util.protobufEncode(dataContentProtobuf, data)
    return respEncode(buffer)
}

function connectMsg(uid) {
    let chatMsg = {
        fromId: uid
    }
    return _C2CMsg(chat.nested.DataContent.nested.ActionType.values.CONNECT, chatMsg)
}

function pingMsg(uid) {
    let chatMsg = {
        fromId: uid
    }
    return _C2CMsg(chat.nested.DataContent.nested.ActionType.values.PING, chatMsg)
}

function chatMsg(msg) {
    let chatMsg = {
        msgId: msg.msgId,
        fromId: msg.fromId,
        toId: msg.toId,
        msg: msg.msg,
        type: msg.type,
        seq: 0
    }
    console.log(chatMsg, 111222)
    return _C2CMsg(chat.nested.DataContent.nested.ActionType.values.CHAT, chatMsg)
}

function signMsg(uid, msgId) {
    let chatMsg = {
        fromId: uid,
        msgId: msgId
    }
    return _C2CMsg(chat.nested.DataContent.nested.ActionType.values.MSG_SIGN, chatMsg)
}

function decimalToBinary(num, digit) {
    let binaryStr = Number(num).toString(2)
    while (binaryStr.length < Number(digit)) {
        binaryStr = '0' + binaryStr
    }
    return binaryStr
}

function headerCheckSum(version, headLength, cmdId, packLen) {
    let b = [];
    b[0] = version
    b[1] = headLength
    b[2] = cmdId
    b[3] = 0x00
    b[4] = ((packLen >> 24) & 0xff)
    b[5] = ((packLen >> 16) & 0xff)
    b[6] = ((packLen >> 8) & 0xff)
    b[7] = (packLen & 0xff)
    return _sumCheck(b, 8)
}

function _sumCheck(binary, len) {
    let sum = 0
    for (let i = 0; i < len; i++) {
        sum = sum + binary[i]
    }
    if (sum > 0xff) {
        //超过了255，使用补码（补码 = 原码取反 + 1）
        sum = ~sum
        sum = sum + 1
    }
    return sum & 0xff
}

function respDecode(array) {
    let version = ((array[0] & 0xf0) >> 4)
    let headLength = (array[0] & 0x0f)
    let cmdId = array[1]
    let checkSum = array[2] + array[3]
    let packLength = array[4] + array[5] + array[6] + array[7]
    let result = headerCheckSum(version, headLength, cmdId, packLength)

    if (version !== VERSION) {
        console.error("version错误")
        return
    }
    if (headLength !== HEAD_LENGTH) {
        console.error("headLength错误")
        return
    }
    if (cmdId !== CMD_ID_RESP) {
        console.error("cmdId错误")
        return
    }
    if (result !== checkSum) {
        console.error("校验和出错")
        return
    }
    return array.slice(8, array.length + 1)
}

function respEncode(body) {
    let packLen = body.length + HEAD_LENGTH
    let sum = headerCheckSum(VERSION, HEAD_LENGTH, CMD_ID_REQ, packLen)
    let version = decimalToBinary(VERSION, 4)
    let headLength = decimalToBinary(HEAD_LENGTH, 4)
    let cmdId = decimalToBinary(CMD_ID_REQ, 8)

    let b = []
    b[0] = parseInt(version + headLength, 2)
    b[1] = parseInt(cmdId, 2)
    b[2] = (sum >> 16) & 0xff
    b[3] = (sum & 0xff)
    b[4] = ((packLen >> 24) & 0xff)
    b[5] = ((packLen >> 16) & 0xff)
    b[6] = ((packLen >> 8) & 0xff)
    b[7] = (packLen & 0xff)
    b.push(...body)
    return new Uint8Array(b)
}

export default ProtoMsg
