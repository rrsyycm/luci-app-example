#!/usr/bin/env ucode

'use strict';
import * as fs from 'fs';
import {cursor} from 'uci';

// Rather than parse files in /etc/config, we can use `cursor`.
const uci = cursor();

const methods = {
    ping_test: {
        args: {domain: 'domain', port: 'port'},
        call: function (request) {
            let domain = request.args.domain || 'ltc.ss.poolin.one'; // ltc.ss.poolin.one ss.antpool.com
            let port = request.args.port || '443';
            let output_file = `/tmp/${domain}_ping_output.txt`;
            let time_file = `/tmp/${domain}_time.txt`;
            let ret_file = `/tmp/${domain}_ret.txt`;
            let message = `'{"id":1,"method":"mining.subscribe","params":[]}'`;

            let cmd = `START=$(date +%s%3N); echo ${message} | timeout 1 nc ${domain} ${port} > ${output_file}; RET=$?; END=$(date +%s%3N); echo $((END - START)) > ${time_file}; echo $RET > ${ret_file}`;
            // let cmd = `START=$(date +%s%3N); echo ${message} | timeout 3 nc ${domain} ${port} > ${output_file}; END=$(date +%s%3N); echo $((END - START)) > ${time_file}`;

            system(cmd);

            // 读取延迟时间
            let latency = 3000;
            let code = '1';
            try {
                let f = fs.open(ret_file, 'r');
                code = trim(f.read('all'));
                f.close();
            } catch (e) {
            }

            if (code !== '0') {
                return {delay: 3000, code: code};
            }

            try {
                let f = fs.open(time_file, 'r');
                latency = trim(f.read('all'));
                f.close();
            } catch (e) {
                // ignore read error
            }

            // 可选：也可以读取 output_file 的响应内容进行进一步判断
            return {delay: latency, code: code};
        }
    },
    get_status: {
        call: function () {
            const code = system('set -o pipefail; curl -sSx socks5://127.0.0.1:20122 -I https://www.google.com | head -n 1');
            return {code: code};
        }
    },

    get_host: {
        call: function () {
            return {name: 'windows'};
        }
    },
    pool_run: {
        args: {run: 'run'},
        call: function (request) {
            let code = system(`/etc/init.d/pool ${request.args.run}`);
            return {code: code};
        }
    }
};

return {'luci.pool': methods};
