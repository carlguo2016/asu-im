function imSocket({url, pingMsg, pingTimeout = 10000, pongTimeout = 10000, reconnectTimeout = 5000}) {
    this.opts = {
        url: url,
        pingMsg: pingMsg,
        pingTimeout: pingTimeout,
        pongTimeout: pongTimeout,
        reconnectTimeout: reconnectTimeout
    };

    this.pingTimeoutId = null;
    this.pongTimeoutId = null;
    this.lockReconnect = false;
    this.forbidReconnect = false;
    this.ws = null;

    this.onopen = () => {};
    this.onclose = () => {};
    this.onerror = () => {};
    this.onmessage = () => {};
    this.onreconnect = () => {};
    this.createWebSocket();
}

imSocket.prototype.createWebSocket = function () {
    try {
        this.ws = new WebSocket(`${this.opts.url}`);
        this.initEventHandle();
    } catch (e) {
        this.reconnect();
        throw e;
    }
}

imSocket.prototype.initEventHandle = function () {
    this.ws.onopen = () => {
        this.onopen();
        this.connect();
    };
    this.ws.onmessage = event => {
        this.onmessage(event);
        this.heartCheck();
    };
    this.ws.onclose = () => {
        this.onclose();
        this.reconnect();
    };
    this.ws.onerror = error => {
        this.onerror(error);
        this.reconnect();
    };
};

imSocket.prototype.connect = function (msg) {
    this.ws.send(msg);
    this.heartCheck();
};

imSocket.prototype.heartCheck = function () {
    this.heartReset();
    this.heartStart();
};

imSocket.prototype.send = function (msg) {
    this.ws.send(msg);
};

imSocket.prototype.reconnect = function () {
    if (this.lockReconnect || this.forbidReconnect) {
        return;
    }
    this.lockReconnect = true;
    this.onreconnect();
    // 没连接上会一直重连，设置延迟避免请求过多
    setTimeout(() => {
        this.createWebSocket();
        this.lockReconnect = false;
    }, this.opts.reconnectTimeout);
};

imSocket.prototype.heartStart = function () {
    this.pingTimeoutId = setTimeout(() => {
        this.ws.send(this.opts.pingMsg);
        this.pongTimeoutId = setTimeout(() => {
            this.ws.close();
        }, this.opts.pongTimeout);
    }, this.opts.pingTimeout);
};

imSocket.prototype.heartReset = function () {
    clearTimeout(this.pingTimeoutId);
    clearTimeout(this.pongTimeoutId);
    this.pingTimeoutId = null;
    this.pongTimeoutId = null;
};

imSocket.prototype.close = function () {
    this.forbidReconnect = true;
    this.ws.close();
};

if (window) {
    window.imSocket = imSocket;
}

export default imSocket;
