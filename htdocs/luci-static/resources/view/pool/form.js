'use strict';
'require form';
'require ui';
'require view';
'require rpc';

const load_sample1 = rpc.declare({
    object: 'luci.pool',
    method: 'get_sample1'
});

const load_sample2 = rpc.declare({
    object: 'luci.pool',
    method: 'get_sample2'
});

const pingHost = rpc.declare({
    object: 'luci.pool',
    method: 'get_host',
});

const getStatus = rpc.declare({
    object: 'luci.example',
    method: 'get_status',
    expect: { running: false }
});
// noinspection JSAnnotator
return view.extend({
    load: function () {
        return Promise.all([
            getStatus()
        ]);
    },
    render: function (data) {
        const status = data[0];  // result of getStatus()
        var m, s, o;

        m = new form.Map('pool', _('pool App'));

        s = m.section(form.TypedSection, 'settings', _('Settings'));
        s.anonymous = true;

        o = s.option(form.Flag, 'enable_feature', _('Enable Feature'));
        o.default = status.running ? '1' : '0';
        o.rmempty = false;

        o = s.option(form.Value, 'target_host', _('Target Host'));
        o.placeholder = 'www.baidu.com';
        o.rmempty = false;

        o = s.option(form.Button, '_runbtn', _('Run Ping'));
        o.inputtitle = _('Ping');
        o.inputstyle = 'apply';

        o.onclick = function () {
            pingHost().then(res => {
                console.log('ping', res.option_one.name)
                ui.showModal(_('Ping'), _(res.option_one.name));
            }).catch(function (err) {
                console.error('ping', err)
            });
        };

        return m.render();
    }
});