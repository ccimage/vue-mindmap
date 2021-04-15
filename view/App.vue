<template>
    <el-container>
        <el-header style="text-align: left; font-size: 12px; height: 48px">
            <ControlPanel :selectedLevel="selectedLevel" :eventChange="eventChange" />
        </el-header>
        <MindmapContainer />
    </el-container>
</template>

<script>
import { ref, defineComponent } from 'vue';
import MindmapContainer from './components/MindmapContainer.vue';
import ControlPanel from './components/ControlPanel.vue';
import KeyCheck from './utils/keycheck';
export default defineComponent({
    name: 'App',
    components: {
        MindmapContainer,
        ControlPanel,
    },
    mounted() {
        const kityminder = window.kityminder;
        // 创建 km 实例
        /* global kityminder */
        var km = (window.km = new kityminder.Minder());
        km.setup('#minder-view');
        //km.disable();
        //km.execCommand('hand');
        this.invokeReciever();
        this.bindEvent();
        document.querySelector('#minder-view')?.addEventListener('click', () => {
            const sn = km.getSelectedNode();
            if (!sn) {
                this.selectedLevel = -1;
            } else if (!sn.parent) {
                this.selectedLevel = 0;
            } else {
                this.selectedLevel = 1;
            }
        });
    },
    setup: () => {
        const selectedLevel = ref(-1);
        const eventChange = ref('');
        return { selectedLevel, eventChange };
    },
    watch: {
        selectedLevel: function () {
            this.exitInputMode();
        },
    },
    methods: {
        invokeReciever: function () {
            var _this = this;
            var key = new KeyCheck();
            // 接收事件的 div
            var element = document.createElement('div');
            element.contentEditable = false;
            /**
             * @Desc: 增加tabindex属性使得element的contenteditable不管是trur还是false都能有focus和blur事件
             * @Editor: Naixor
             * @Date: 2015.09.14
             */
            element.setAttribute('tabindex', -1);
            element.classList.add('receiver');
            element.onkeydown = element.onkeypress = element.onkeyup = dispatchKeyEvent;
            element.addEventListener('compositionstart', dispatchKeyEvent);
            // element.addEventListener('compositionend', dispatchKeyEvent);
            document.querySelector('#minder-view').appendChild(element);

            // receiver 对象
            var receiver = {
                element: element,
                selectAll: function () {
                    // 保证有被选中的
                    if (!element.innerHTML) element.innerHTML = '&nbsp;';
                    var range = document.createRange();
                    var selection = window.getSelection();
                    range.selectNodeContents(element);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    element.focus();
                },
                /**
                 * @Desc: 增加enable和disable方法用于解决热核态的输入法屏蔽问题
                 * @Editor: Naixor
                 * @Date: 2015.09.14
                 */
                enable: function () {
                    element.setAttribute('contenteditable', true);
                },
                disable: function () {
                    element.setAttribute('contenteditable', false);
                },
                /**
                 * @Desc: hack FF下div contenteditable的光标丢失BUG
                 * @Editor: Naixor
                 * @Date: 2015.10.15
                 */
                fixFFCaretDisappeared: function () {
                    element.removeAttribute('contenteditable');
                    element.setAttribute('contenteditable', 'true');
                    element.blur();
                    element.focus();
                },
                /**
                 * 以此事件代替通过mouse事件来判断receiver丢失焦点的事件
                 * @editor Naixor
                 * @Date 2015-12-2
                 */
                onblur: function (handler) {
                    element.onblur = handler;
                },
            };
            receiver.selectAll();
            const minder = window.km;
            minder.on('beforemousedown', receiver.selectAll);
            minder.on('receiverfocus', receiver.selectAll);
            minder.on('readonly', function () {
                // 屏蔽minder的事件接受，删除receiver和hotbox
                minder.disable();
                editor.receiver.element.parentElement.removeChild(editor.receiver.element);
                editor.hotbox.$container.removeChild(editor.hotbox.$element);
            });
            minder.on('dblclick', function () {
                _this.eventChange = '';
                if (minder.getSelectedNode() && minder._status !== 'readonly') {
                    _this.eventChange = 'Edit';
                }
            });

            // 侦听器，接收到的事件会派发给所有侦听器
            var listeners = [];

            // 侦听指定状态下的事件，如果不传 state，侦听所有状态
            receiver.listen = function (state, listener) {
                if (arguments.length == 1) {
                    listener = state;
                    state = '*';
                }
                listener.notifyState = state;
                listeners.push(listener);
            };

            function dispatchKeyEvent(e) {
                e.is = function (keyExpression) {
                    var subs = keyExpression.split('|');
                    for (var i = 0; i < subs.length; i++) {
                        if (key.is(this, subs[i])) return true;
                    }
                    return false;
                };
                var listener;
                for (var i = 0; i < listeners.length; i++) {
                    listener = listeners[i];
                    if (listener.call(null, e)) {
                        return;
                    }
                }
            }
            receiver.onblur(function () {
                _this.commitInputResult();
            });
            window.receiver = receiver;
        },
        bindEvent: function () {
            const _this = this;
            window.receiver.listen('input', function (e) {
                window.receiver.enable();
                if (e.type == 'keydown') {
                    if (e.is('Enter')) {
                        _this.commitInputResult();
                    }
                    if (e.is('Esc')) {
                        _this.exitInputMode();
                    }
                    if (e.is('F2')) {
                        _this.eventChange = 'Edit';
                    }
                } else if (e.type == 'keyup' && e.is('Esc')) {
                }
            });
        },

        /**
         * 判断节点的文本信息是否是
         * @Desc: 从其他节点复制文字到另一个节点时部分浏览器(chrome)会自动包裹一个span标签，这样使用以下逻辑出来的就不是text节点二是span节点因此导致undefined的情况发生
         * @Notice: 此处逻辑应该拆分到 kityminder-core/core/data中去，单独增加一个对某个节点importJson的事件
         * @Editor: Naixor
         * @Date: 2015.9.16
         */
        commitInputNode: function (node, text) {
            var minder = window.km;
            try {
                minder.decodeData('text', text).then(function (json) {
                    function importText(node, json, minder) {
                        var data = json.data;

                        node.setText(data.text || '');

                        var childrenTreeData = json.children || [];
                        for (var i = 0; i < childrenTreeData.length; i++) {
                            var childNode = minder.createNode(null, node);
                            importText(childNode, childrenTreeData[i], minder);
                        }
                        return node;
                    }
                    importText(node, json, minder);
                    minder.fire('contentchange');
                    minder.getRoot().renderTree();
                    minder.layout(300);
                    window.receiver.element.innerText = '';
                });
            } catch (e) {
                minder.fire('contentchange');
                minder.getRoot().renderTree();

                // 无法被转换成脑图节点则不处理
                if (e.toString() !== 'Error: Invalid local format') {
                    throw e;
                }
            }
        },

        commitInputResult: function () {
            if (!window.receiver.element.classList.contains('input')) {
                window.receiver.element.innerText = '';
                return;
            }
            this.exitInputMode();
            var text = window.receiver.element.innerText;
            if (!text) {
                return;
            }
            var node = window.km.getSelectedNode();
            if (!node) {
                return;
            }
            this.commitInputNode(node, text);

            if (node.type == 'root') {
                var rootText = window.km.getRoot().getText();
                window.km.fire('initChangeRoot', { text: rootText });
            }
        },

        exitInputMode: function () {
            window.receiver.element.classList.remove('input');
            window.receiver.selectAll();
            this.eventChange = '';
            window.receiver.disable();
        },
    },
});
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin: 0 auto;
    height: 100%;
}
#minder-view {
    right: 0;
    position: absolute;
    bottom: 0;
    overflow: hidden;
    z-index: 2;
    top: 48px;
    left: 0;
}
.km-view .km-receiver {
    position: absolute;
    left: -99999px;
    top: -99999px;
    width: 20px;
    height: 20px;
    outline: 0;
    margin: 0;
}
</style>
