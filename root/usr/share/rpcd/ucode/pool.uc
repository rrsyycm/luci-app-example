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
            let domain = request.args.domain;
            let port = request.args.port || '80';
            let output_file = '/tmp/tcping_result.txt';
            let cmd = `tcping -c 1 -q -p ${port} ${domain} > ${output_file} 2>&1`;
            let code = system(cmd);

            let output = '';
            try {
                let f = fs.open(output_file, 'r');
                output = f.read('all');
                f.close();
            } catch (e) {
                return {
                    error: 'Failed to read output file',
                    message: '' + e
                };
            }

            let latency = null;
            let re = regexp('time=([0-9.]+) ms', '');
            let m = match(output, re);
            if (m)
                latency = m[1];

            return { time: latency || '超时' };
        }
    },
    get_status: {
        call: function () {
            const code = system('set -o pipefail; curl -sSx socks5://127.0.0.1:20122 -I https://www.google.com | head -n 1');
            return {code:code};
        }
    },

    get_host: {
        call: function () {
            return {name: 'windows'};
        }
    },
    restart_service: {
        call: function () {
            let code = system('/etc/init.d/pool start');
            return {code: code};
        }
    }
};

return {'luci.pool': methods};
