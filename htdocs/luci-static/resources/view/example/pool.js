'use strict';
'require form';
'require ui';
'require view';
'require rpc';

const load_sample1 = rpc.declare({
    object: 'luci.example',
    method: 'get_sample1'
});

const load_sample2 = rpc.declare({
    object: 'luci.example',
    method: 'get_sample2'
});

const pingHost = rpc.declare({
    object: 'luci.example',
    method: 'ping_host',
    params: ['target']
});
// noinspection JSAnnotator
return view.extend({
    load: function () {
        return Promise.all([
            load_sample1()
        ]);
    },
    render: function () {
        var m, s, o;

        m = new form.Map('example', _('Example App'));

        s = m.section(form.TypedSection, 'settings', _('Settings'));
        s.anonymous = true;

        o = s.option(form.Flag, 'enable_feature', _('Enable Feature'));
        o.default = '0';
        o.rmempty = false;

        o = s.option(form.Value, 'target_host', _('Target Host'));
        o.placeholder = 'www.baidu.com';
        o.rmempty = false;

        o = s.option(form.Button, '_runbtn', _('Run Ping'));
        o.inputtitle = _('Ping');
        o.inputstyle = 'apply';

        o.onclick = function () {
            ui.showModal(_('Ping'), _('Calling get_sample1()...'));

            pingHost('8.8.8.8').then(res => {
                console.log('ping', res)
            }).catch(function (err) {
                console.error('ping', err)
            });


            return load_sample2().then(function (res) {
                console.log('load_sample2', res)
            }).catch(function (err) {
                console.error('load_sample2', err)
            });
        };

        return m.render();
    }
});