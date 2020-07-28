import ajax from "./ajax"

import {END_POINT} from './const'

function Api() {
    function request(method, url, json) {
        return new Promise((resolve, reject) => {
            ajax({
                url: END_POINT + url,
                type: method,
                dataType: 'json',
                data: json,
                success: function (resp, xml) {
                    //请求成功后执行的代码
                    let body = JSON.parse(resp)
                    if (body.hasOwnProperty('code') && body.code === 0) {
                        return resolve(body.data)
                    } else {
                        return reject(body)
                    }
                },
                error: function (err) {
                    //失败后执行的代码
                    let body = JSON.parse(err)
                    return reject(body)
                }
            })
        })
    }

    function to(promise) {
        return promise
            .then(data => {
                return [null, data]
            })
            .catch(err => [err])
    }

    return {
        Org: {
            checkKeyValid: (params) => {
                return to(request('POST', '/org/check-key-valid', params))
            },
        },
        User: {
            checkUserValid: (params) => {
                return to(request('POST', '/user/check-user-valid', params))
            },
        },
        Message: {
            genId: () => {
                return request('POST', '/message/genId')
            },
        }
    }
}

export default new Api()
