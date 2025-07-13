'use strict';
'require form';
'require ui';
'require view';
'require rpc';
'require uci';


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
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,
    load: function () {
        return Promise.all([uci.load('pool')]);
    },
    render: function () {
        // 创建 Vue 挂载点
        const root = E('div', {id: 'vue-app'});
        var sections = uci.sections('pool');
        console.log('sections', sections)


        // 动态加载 Vue 3 和 Element Plus
        const loadResources = () => {
            // Element Plus CSS (使用国内 CDN 加速)
            const elementCSS = E('link', {
                rel: 'stylesheet',
                href: 'https://unpkg.com/element-plus/dist/index.css'
            });

            // Vue 3
            const vueJS = E('script', {
                src: 'https://unpkg.com/vue@3/dist/vue.global.js'
            });

            // Element Plus JS
            const elementJS = E('script', {
                src: 'https://unpkg.com/element-plus'
            });

            // 按顺序加载
            document.head.appendChild(elementCSS);
            document.body.appendChild(vueJS);
            vueJS.onload = () => {
                document.body.appendChild(elementJS);
            };

            return [elementCSS, vueJS, elementJS];
        };

        // 资源加载完成后初始化 Vue
        const initVueApp = () => {
            const {createApp} = Vue;
            const {ElButton, ElNotification} = ElementPlus;

            createApp({
                components: {ElButton},
                data() {
                    return {
                        loading: false,
                        status: null
                    };
                },
                methods: {
                    async checkStatus() {
                        console.log('ucc', ucc)


                        const list = ucc.get('pool', 'third', 'list_option')
                        console.log(list)
                        ucc.set('pool', 'setting', 'enable_feature', '0')
                        ucc.save('pool');
                        this.loading = true;
                        try {
                            const res = await getStatus();
                            this.status = res;
                            ElNotification.success({
                                title: '成功',
                                message: '服务状态获取成功',
                                offset: 50
                            });
                        } catch (error) {
                            ElNotification.error({
                                title: '错误',
                                message: `请求失败: ${error.message}`,
                                offset: 50
                            });
                        } finally {
                            this.loading = false;
                        }
                    }
                },
                template: `
                    <div style="padding: 20px;">
                        <el-button 
                            type="primary" 
                            :loading="loading" 
                            @click="checkStatus"
                            round
                        >
                            {{ loading ? '查询中...' : '获取服务状态' }}
                        </el-button>
                        
                        <div v-if="status" style="margin-top: 20px;">
                            <el-card shadow="hover">
                                <pre>{{ JSON.stringify(status, null, 2) }}</pre>
                            </el-card>
                        </div>
                       
                    </div>
                `
            })
                .use(ElementPlus)
                .mount(root);
        };

        // 启动加载流程
        loadResources();
        const checkReady = setInterval(() => {
            if (window.Vue && window.ElementPlus) {
                clearInterval(checkReady);
                initVueApp();
            }
        }, 100);

        return root;
    }
});