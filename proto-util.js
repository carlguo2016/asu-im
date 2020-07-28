let protobuf = require("protobufjs");

let ProtoUtil = {
    protobufCreate: protobufCreate,
    protobufEncode: protobufEncode,
    protobufDecode: protobufDecode,
    getUserIP: getUserIP
};

function protobufCreate(entityName, jsonFileName = "msg") {
    let pbRoot = require("protobufjs").Root;
    let json = require("./proto/" + jsonFileName + ".json");
    let root = pbRoot.fromJSON(json);
    return root.lookupType(entityName);
}

function protobufEncode(obj, data) {
    let message = obj.create(data);
    let err = obj.verify(message);
    if (err) {
        return null;
    }
    return obj.encode(message).finish();
}

function protobufDecode(obj, buffer) {
    try {
        return obj.decode(buffer);
    } catch (e) {
        if (e instanceof protobuf.util.ProtocolError) {
            console.error("missing required field");
            return null;
        } else {
            console.error("wire format is invalid");
            return null;
        }
    }
}

function getUserIP(onNewIP) { //  onNewIp - your listener function for new IPs
    //compatibility for firefox and chrome
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var pc = new myPeerConnection({
            iceServers: []
        }),
        noop = function () {
        },
        localIPs = {},
        ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
        key;

    function iterateIP(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
    }

    //create a bogus data channel
    pc.createDataChannel("");

    // create offer and set local description
    pc.createOffer().then(function (sdp) {
        sdp.sdp.split('\n').forEach(function (line) {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex).forEach(iterateIP);
        });

        pc.setLocalDescription(sdp, noop, noop);
    }).catch(function (reason) {
        // An error occurred, so handle the failure to connect
    });

    //listen for candidate events
    pc.onicecandidate = function (ice) {
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(iterateIP);
    };
}

export default ProtoUtil;
