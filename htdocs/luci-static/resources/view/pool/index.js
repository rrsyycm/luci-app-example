'use strict';
// noinspection JSAnnotator
return L.view.extend({
    render: function() {
        return E('iframe', {
            src: '/luci-static/resources/view/pool/index.html?t=11111',
            style: 'width: 100%; height: 100vh; border: none;'
        });
    }
});
