'use strict';
'require form';
'require ui';
'require view';
'require rpc';
'require uci';


const getStatus = rpc.declare({
    object: 'luci.pool', method: 'get_status'
});

const poolRun = rpc.declare({
    object: 'luci.pool', method: 'pool_run'
});

const rpcPingTest = rpc.declare({
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

            const style = E('style', {}, `
    .el-card__body {
      padding: 0px !important;
      background: white !important;
      border-radius: 0 0 8px 8px !important;
    }
    .el-card__header{
    padding: 0.6rem !important;
    }
    .item{
    border-radius: 4px;
    margin: 4px;
    background-color: #f8f8f8;
    }
  `);
            // 按顺序加载

            document.head.appendChild(elementCSS);
            document.body.appendChild(vueJS);
            document.head.appendChild(style);
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
                        enableFeature: uci.get('pool', 'setting', 'enable_feature') === '1' ? 'open' : 'close',
                        status: null,
                        data: uci.get('pool', "third", 'list_option'),
                        tableData: uci.get('pool', "third", 'list_option').map(host => ({host, loading: false})),
                        options: [
                            {
                                label: '关闭',
                                value: 'close',
                            },
                            {
                                label: '开启',
                                value: 'open',
                            }
                        ]
                    };
                },
                async created() {
                    const status = await getStatus(); // 异步获取状态
                    this.status = status?.code || 99
                },
                methods: {
                    async segmented(index) {
                        console.log('segmented',index)
                        uci.set('pool', 'setting', 'enable_feature', index === 'open' ? '1' : '0')
                        uci.save('pool');
                        poolRun(index === 'open' ? 'start':'stop').then(res=>{
                            this.apply()
                        })
                    },
                    async test() {
                        this.tableData.forEach()


                    },
                    async batchPingTest() {
                        // 批量测试所有行
                        await Promise.all(
                            this.tableData.map(row => this.pingTest(null, row))
                        );
                    },
                    async pingTest(index, row) {
                        const [host, port] = row?.host.split(':');
                        console.log(host, port)
                        row.loading = true
                        rpcPingTest(host, port).then(res => {
                            console.log(res)
                            row.delay = res?.time;
                        }).finally(() => {
                            row.loading = false
                        })

                    },
                    async apply() {
                        uci.apply().then(()=>{
                            ElNotification({
                                title: '操作成功',
                                type: 'success'
                            });
                        })
                    },
                    getDelayColo(delay){
                        switch (true) {
                            case delay === '超时':
                                return 'danger'
                            case delay < 100:
                                return 'success'
                            case delay < 300:
                                return 'primary'
                            case delay < 500:
                                return 'warning'
                            case delay > 500:
                                return 'danger'
                            default:
                                return 'success'
                        }
                    }
                },
                template: `
                    <div style="padding: 20px;">
                        <el-config-provider>
                            <el-row class="pa-2" :gutter="20">
                                <el-col :span="8">
                                    <el-card style="max-width: 480px" shadow="never">
                                        <template #header> <span>运行状态</span>
                        
                                        </template>
                                        <el-result icon="success" title="Success Tip" :sub-title="status == null ? '检查中' : status">
                                            <template #extra>
                                                <el-segmented @change="segmented" v-model="enableFeature" :options="options">
                                                    <template #default="scope">
                                                        <div class="flex flex-col items-center gap-2 p-2">
                                                            <div>{{ scope.item.label }}</div>
                                                        </div>
                                                    </template>
                                                </el-segmented>
                                            </template>
                                        </el-result>
                                    </el-card>
                                    <el-card style="max-width: 480px;margin-top: 1rem" shadow="never">
                                        <template #header>
                                            <span>快捷操作</span>
                                        </template>
                                        <el-space wrap style="margin: 0.6rem">
                                         
                                             <el-button @click="apply" >添加测试地址</el-button>
                                        </el-space>
                                    </el-card>
                                    <el-card style="max-width: 480px;margin-top: 1rem" shadow="never">
                                        <template #header>
                                            <span>运行日志</span>
                                        </template>
                                        <el-scrollbar height="200" max-height="200" style="margin: 0.6rem">
                                            <p v-for="item in 20" :key="item" class="scrollbar-demo-item">{{ item }}</p>
                                        </el-scrollbar>
                                    </el-card>
                                </el-col>
                                <el-col :span="16">
                                    <el-table :data="tableData" style="width: 100%" height="700">
                                        <el-table-column prop="host" label="矿池"/>
                                        <el-table-column prop="delay" label="延迟">
                                            <template #default="scope">
                                                <div style="display: flex; align-items: center">
                                                   <el-text class="mx-1" :type="getDelayColo(scope.row.delay)">{{ scope.row.delay }}</el-text>
                                                </div>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="操作">
                                            <template #header>
                                                <el-button type="primary" size="small" @click="batchPingTest()" :loading="tableData.some(row => row.loading)">测试所有矿池</el-button>
                                            </template>
                                            <template #default="scope">
                                                <el-button size="small" type="danger" @click="pingTest(scope.$index, scope.row)">删除</el-button>
                                                <el-button size="small" type="primary" :loading="scope.row.loading" @click="pingTest(scope.$index, scope.row)">测试</el-button>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </el-col>
                            </el-row>
                        </el-config-provider>
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