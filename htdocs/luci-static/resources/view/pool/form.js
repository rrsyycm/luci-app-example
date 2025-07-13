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
    .el-result__extra{
    margin-top:0.6rem !important;
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
                        enable: uci.get('pool', 'setting', 'enable_feature') === '1' ? true : false,
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
                    this.checkStatus()
                },
                methods: {
                    async checkStatus(){
                        this.status = null
                        const status = await getStatus(); // 异步获取状态
                        this.status = status?.code || 99
                    },
                    async runSwitch(index) {
                        console.log('runSwitch',index)
                        uci.set('pool', 'setting', 'enable_feature', index  ? '1' : '0')
                        uci.save('pool');
                        poolRun(index ? 'start':'stop').then(async res => {
                            this.apply()
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            this.checkStatus()
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
                    getStatusConfig(code){
                        console.log('code',code)
                        switch (code) {
                            case 7:
                                return {title:'连接失败',subTitle:code,icon:'error'}
                            case 97:
                                return {title:'DNS 解析失败',subTitle:code,icon:'warning'}
                            default:
                                return {title:'服务已启动',subTitle:code,icon:'success'}
                        }
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
                                        <el-result :icon="getStatusConfig(status)?.icon" :title="getStatusConfig(status)?.title" >
                                            <template #extra>
                                                <el-switch
                                                    v-model="enable"
                                                    class="ml-2"
                                                    active-text="开启"
                                                    inactive-text="关闭"
                                                    @change="runSwitch"
                                                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                                                />
                                                
                                            </template>
                                            <template #sub-title>
                                                <el-button
                                                    link
                                                    :loading="status === null"
                                                    @click="checkStatus"
                                                    >
                                                    <svg v-if="getStatusConfig(status)?.subTitle" t="1752422449210" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1514" width="16" height="16"><path d="M1016.057791 124.92321l-22.64677 221.938351a28.081995 28.081995 0 0 1-30.799608 25.364383l-221.938351-22.646771a28.081995 28.081995 0 0 1-14.946869-49.822895l76.546085-62.505086a394.053807 394.053807 0 1 0-45.293541 588.816034 58.881603 58.881603 0 1 1 70.657924 94.210565 511.817014 511.817014 0 1 1 65.675634-757.760942l76.99902-62.505087a28.081995 28.081995 0 0 1 45.746476 24.911448z" fill="#3E2AD1" p-id="1515"></path></svg>
                                                    {{ getStatusConfig(status)?.subTitle }}
                                                </el-button>
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