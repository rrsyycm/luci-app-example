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
// noinspection JSAnnotator
return view.extend({
    load: function () {
        return Promise.all([getStatus()]);
    }, render: function (data) {
        const status = data[0];  // result of getStatus()
        console.log('status', status.running ? '1' : '0')
        var m, s, o;

        m = new form.Map('pool', _('pool App'));

        s = m.section(form.TypedSection, 'setting', _('Settings'));
        s.anonymous = true;

        o = s.option(form.Flag, 'enable_feature', _('Enable Feature'));
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


        o = s.option(form.Value, 'target_host', _('Target Host'));
        o.placeholder = 'www.baidu.com';
        o.rmempty = false;

        o = s.option(form.Button, '_runbtn', _('Run Ping'));
        o.inputtitle = _('Ping');
        o.inputstyle = 'apply';

        o.onclick = function () {
            getHost().then(res => {
                console.log('ping', res)
            }).catch(function (err) {
                console.error('ping', err)
            });
        };

        return m.render();
    }
});