function ajax(options) {
    options = options || {};
    options.type = (options.type || 'GET').toUpperCase();
    options.dataType = options.dataType || 'json';
    let params = formatParams(options.data);

    //创建-第一步
    let xhr;
    //非IE6
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else {
        //ie6及其以下版本浏览器
        xhr = ActiveXObject('Microsoft.XMLHTTP');
    }

    //接收-第三步
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            let status = xhr.status;
            if (status >= 200 && status < 300) {
                options.success && options.success(xhr.responseText, xhr.responseXML);
            } else {
                options.error && options.error(status);
            }
        }
    }

    //连接和发送-第二步
    if (options.type === 'GET') {
        xhr.open('GET', options.url + '?' + params, true);
        xhr.send(null);
    } else if (options.type === 'POST') {
        xhr.open('POST', options.url, true);
        //设置表单提交时的内容类型
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(params);
    }
}

//格式化参数
function formatParams(data) {
    let arr = [];
    for (let name in data) {
        arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
    }
    arr.push(('v=' + Math.random()).replace('.', ''));
    return arr.join('&');
}

export default ajax;
