'use strict';
'require form';
'require ui';
'require view';
'require rpc';
'require uci';

const load_sample1 = rpc.declare({
    object: 'luci.pool', method: 'get_sample1'
});

const load_sample2 = rpc.declare({
    object: 'luci.pool', method: 'get_sample2'
});

const getHost = rpc.declare({
    object: 'luci.pool', method: 'get_host',
});

const getStatus = rpc.declare({
    object: 'luci.pool', method: 'get_status'
});

const restartService = rpc.declare({
    object: 'luci.pool', method: 'restart_service'
});

const pingTest = rpc.declare({
    object: 'luci.pool', method: 'ping_test', params: ['domain', 'port']
});

// noinspection JSAnnotator
return view.extend({
    load: function () {
        return Promise.all([getStatus()]);
    },
    render: function (data) {
        const status = data[0];  // result of getStatus()
        console.log('status', status.code)
        var m, s, o;

        m = new form.Map('pool', _('1688 Pool App'));


        s = m.section(form.TypedSection, 'setting', _('Settings'));
        s.anonymous = true;

        o = s.option(form.Flag, 'enable_feature','主开关',status.code === 7 ? `错误代码 ${status.code}` : '成功运行');
        o.default = true;
        o.rmempty = false;


        o.cfgvalue = function (section_id) {
            return uci.get('pool', section_id, 'enable_feature') || '0';
        };

        o.write = function (section_id, value) {
            uci.set('pool', section_id, 'enable_feature', value);
            uci.save('pool');
            // 修改配置后，自动重启服务
            restartService().then(res => {
                console.log('restart', res)
                if (res.code === 0) {
                    ui.addNotification(null, _('服务已重启'));
                } else {
                    ui.addNotification(null, _('服务启动失败，退出码：') + res.code);
                }
            });
        };

        o = s.option(form.DynamicList, 'list_option', _('测试矿池地址'));

        o = s.option(form.Button, '_runbtn', _('运行测试'));
        o.inputtitle = _('Ping');
        o.inputstyle = 'apply';

        o.onclick = function (ev) {
            ev.target.disabled = true;
            ev.target.textContent = _('Pinging...');
            const domains = uci.get('pool', 'third', 'list_option') || [];
            let tasks = [];

            // 清空之前结果
            this.resultsContainer.textContent = '';

            for (let i = 0; i < domains.length; i++) {
                let parts = domains[i].split(':');
                let host = parts[0];
                let port = parts.length > 1 ? parts[1] : '80';

                let task = pingTest(host, port).then(res => {
                    // 假设res有res.time为延迟字符串
                    this.resultsContainer.textContent += `${host}:${port} -> 延迟: ${res.time || '无数据'}\n`;
                }).catch(err => {
                    this.resultsContainer.textContent += `${host}:${port} -> 测试失败\n`;
                });

                tasks.push(task);
            }

            Promise.all(tasks).finally(() => {
                ev.target.disabled = false;
                ev.target.textContent = _('Ping');
            });
        }.bind(this);



        // 在 render() 末尾添加一个div并返回整体
        return m.render().then(el => {
            let container = document.createElement('div');
            container.id = 'ping-results';
            container.style = 'margin-top: 1em; white-space: pre-wrap; font-family: monospace;';

            el.appendChild(container);
            this.resultsContainer = container;
            return el;
        });

    }
});