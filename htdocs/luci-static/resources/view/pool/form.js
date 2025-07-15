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
                href: '/luci-static/resources/element-plus.min.css'
            });

            // Vue 3 (本地路径)
            const vueJS = E('script', {
                src: '/luci-static/resources/vue.global.js'
            });

            // Element Plus JS (本地路径)
            const elementJS = E('script', {
                src: '/luci-static/resources/element-plus.min.js'
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
                    async checkStatus() {
                        this.status = null
                        const status = await getStatus(); // 异步获取状态
                        this.status = status?.code || 99
                    },
                    async runSwitch(index) {
                        console.log('runSwitch', index)
                        uci.set('pool', 'setting', 'enable_feature', index ? '1' : '0')
                        uci.save('pool');
                        poolRun(index ? 'start' : 'stop').then(async res => {
                            this.apply()
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            this.checkStatus()
                        })

                    },
                    async test() {
                        this.tableData.forEach()
                    },
                    async batchPingTest() {
                        for (let i = 0; i < this.tableData.length; i++) {
                            this.pingTest(null, this.tableData[i]);
                            await this.sleep(50); // 每次延迟 200ms 可调节
                        }
                    },
                    sleep(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                    },
                    async pingTest(index, row) {
                        const [host, port] = row?.host.split(':');
                        console.log(host, port)
                        row.loading = true
                        rpcPingTest(host, port).then(res => {
                            console.log(res)
                            row.delay = res?.code !== '0' ? 'Error' : res?.delay;
                        }).finally(() => {
                            row.loading = false
                        })

                    },
                    async apply() {
                        uci.apply().then(() => {
                            ElNotification({
                                title: '操作成功',
                                type: 'success'
                            });
                        })
                    },
                    getStatusConfig(code) {
                        console.log('code', code)
                        switch (code) {
                            case 7:
                                return {title: '连接失败', subTitle: code, icon: 'error'}
                            case 97:
                                return {title: 'DNS 解析失败', subTitle: code, icon: 'warning'}
                            default:
                                return {title: '服务已启动', subTitle: code, icon: 'success'}
                        }
                    },
                    getDelayColo(delay) {
                        switch (true) {
                            case delay === 'Error':
                                return 'danger'
                            case delay < 100:
                                return 'success'
                            case delay < 300:
                                return 'primary'
                            case delay < 1000:
                                return 'warning'
                            case delay > 1000:
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
                                              
                                                    :loading="status === null"
                                                    @click="checkStatus"
                                                    >
                                                    <template #icon>
                                                        <svg t="1752482658755" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5056" width="32" height="32"><path d="M393.664871 495.52477c0 11.307533-9.168824 20.466124-20.466124 20.466124l-103.671151 0c-11.307533 0-20.466124-9.15859-20.466124-20.466124 0-11.2973 9.15859-20.466124 20.466124-20.466124l103.671151 0C384.496048 475.058646 393.664871 484.22747 393.664871 495.52477z" p-id="5057"></path><path d="M805.207925 495.52477c0 11.307533-9.15859 20.466124-20.466124 20.466124l-103.671151 0c-11.2973 0-20.466124-9.15859-20.466124-20.466124 0-11.2973 9.168824-20.466124 20.466124-20.466124l103.671151 0C796.049335 475.058646 805.207925 484.22747 805.207925 495.52477z" p-id="5058"></path><path d="M547.600823 237.917668l0 103.671151c0 11.307533-9.15859 20.466124-20.466124 20.466124s-20.466124-9.15859-20.466124-20.466124l0-103.671151c0-11.307533 9.15859-20.466124 20.466124-20.466124C538.442232 217.451544 547.600823 226.610134 547.600823 237.917668z" p-id="5059"></path><path d="M547.600823 649.460722l0 103.681384c0 11.2973-9.15859 20.466124-20.466124 20.466124s-20.466124-9.168824-20.466124-20.466124l0-103.681384c0-11.2973 9.15859-20.466124 20.466124-20.466124C538.442232 628.994598 547.600823 638.163421 547.600823 649.460722z" p-id="5060"></path><path d="M411.562497 428.754041c-3.786233 6.569626-10.673084 10.233062-17.733896 10.233062-3.479241 0-6.999414-0.880043-10.222829-2.742461l-89.774653-51.861158c-9.782807-5.658883-13.129019-18.173918-7.480368-27.956725 5.658883-9.79304 18.173918-13.139252 27.956725-7.490601l89.774653 51.861158C413.864936 406.456199 417.22138 418.971234 411.562497 428.754041z" p-id="5061"></path><path d="M767.918647 634.633015c-3.796466 6.559393-10.673084 10.233062-17.744129 10.233062-3.469008 0-6.989181-0.890276-10.212596-2.752694l-89.774653-51.861158c-9.782807-5.64865-13.139252-18.173918-7.480368-27.956725 5.64865-9.79304 18.173918-13.139252 27.956725-7.480368l89.774653 51.861158C770.221086 612.32494 773.567297 624.850208 767.918647 634.633015z" p-id="5062"></path><path d="M673.723312 282.70778l-51.861158 89.76442c-3.786233 6.559393-10.673084 10.233062-17.744129 10.233062-3.469008 0-6.989181-0.890276-10.212596-2.752694-9.79304-5.64865-13.139252-18.163685-7.480368-27.956725l51.861158-89.76442c5.64865-9.79304 18.163685-13.139252 27.956725-7.490601C676.025751 260.399705 679.382195 272.91474 673.723312 282.70778z" p-id="5063"></path><path d="M467.854571 639.053698l-51.861158 89.774653c-3.796466 6.559393-10.673084 10.233062-17.744129 10.233062-3.479241 0-6.999414-0.890276-10.222829-2.752694-9.782807-5.658883-13.139252-18.173918-7.480368-27.956725l51.861158-89.774653c5.658883-9.782807 18.173918-13.129019 27.956725-7.480368C470.15701 616.755856 473.503221 629.27089 467.854571 639.053698z" p-id="5064"></path><path d="M460.435601 379.911636c-3.213181 1.862417-6.733355 2.742461-10.202363 2.742461-7.081279 0-13.957897-3.673669-17.744129-10.243295l-51.809993-89.795119c-5.64865-9.79304-2.292206-22.308075 7.500834-27.956725 9.79304-5.64865 22.308075-2.292206 27.956725 7.500834l51.79976 89.795119C473.585085 361.747951 470.228641 374.262986 460.435601 379.911636z" p-id="5065"></path><path d="M666.089447 736.400816c-3.223415 1.852184-6.743588 2.742461-10.212596 2.742461-7.071046 0-13.957897-3.673669-17.744129-10.243295l-51.79976-89.805352c-5.64865-9.79304-2.292206-22.308075 7.500834-27.956725 9.782807-5.64865 22.297842-2.281973 27.946492 7.500834l51.809993 89.805352C679.238932 718.237131 675.882488 730.752166 666.089447 736.400816z" p-id="5066"></path><path d="M760.499677 384.526747l-89.795119 51.809993c-3.223415 1.852184-6.743588 2.742461-10.212596 2.742461-7.071046 0-13.957897-3.673669-17.744129-10.243295-5.64865-9.79304-2.292206-22.308075 7.500834-27.956725l89.805352-51.809993c9.782807-5.638417 22.297842-2.281973 27.946492 7.500834C773.649162 366.363062 770.292718 378.878097 760.499677 384.526747z" p-id="5067"></path><path d="M404.02073 590.180594l-89.805352 51.79976c-3.213181 1.862417-6.733355 2.742461-10.202363 2.742461-7.081279 0-13.957897-3.673669-17.744129-10.243295-5.64865-9.79304-2.292206-22.308075 7.500834-27.956725l89.795119-51.79976c9.79304-5.64865 22.308075-2.292206 27.956725 7.500834S413.81377 584.531943 404.02073 590.180594z" p-id="5068"></path></svg>
                                                    </template>
                                                    状态码 {{ getStatusConfig(status)?.subTitle }}
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
<!--                                        <el-table-column prop="host" label="矿池连接地址"/>-->
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