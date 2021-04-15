<template>
    <div class="row">
        <StateButton type="primary" icon="el-icon-finished" :disabled="false" @click="resetLayout()" text="重新排序" />

        <StateButton
            type="success"
            icon="el-icon-share"
            :disabled="isRootNode || !isSelected"
            text="增加同级节点"
            @click="addSblingNodeClick()"
        />
        <StateButton
            type="success"
            icon="el-icon-plus"
            :disabled="!isSelected"
            text="增加下级节点"
            @click="addNextNodeClick()"
        />

        <StateButton type="primary" icon="el-icon-arrow-up" :disabled="isRootNode || !isSelected" @click="moveUp()" />
        <StateButton
            type="primary"
            icon="el-icon-arrow-down"
            :disabled="isRootNode || !isSelected"
            @click="moveDown()"
        />

        <StateButton type="primary" icon="el-icon-edit-outline" :disabled="!isSelected" @click="enterEditMode()" />
        <StateButton type="danger" icon="el-icon-delete" :disabled="isRootNode || !isSelected" @click="removeNode()" />
        <StateButton type="primary" icon="el-icon-download" @click="exportJson()" />
        <StateButton type="primary" icon="el-icon-upload2" @click="dialogVisible = true" />
    </div>
    <div>
        <el-dialog
        title="导入json数据"
        v-model="dialogVisible"
        :before-close="handleClose">
        <span>请粘贴json内容</span>
        <el-input type="textarea" v-model="importJsonText" placeholder="Please input" @keydown="captureInput"></el-input>
        <template #footer>
            <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="importJson()">导入</el-button>
            </span>
        </template>
        </el-dialog>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import StateButton from './StateButton.vue';
export default defineComponent({
    name: 'ControlPanel',
    components: {
        StateButton,
    },
    props: {
        selectedLevel: { type: Number, required: true },
        eventChange: { type: String, required: false },
    },
    data() {
        return {
            dialogVisible: false,
            importJsonText: ''
        }
    },
    computed: {
        isRootNode() {
            return this.selectedLevel === 0;
        },
        isSelected() {
            return this.selectedLevel >= 0;
        },
    },
    watch: {
        eventChange: function (val) {
            if (val === 'Edit') {
                this.enterEditMode();
            }
        },
    },
    methods: {
        addNextNodeClick: function () {
            window.km.execCommand('AppendChildNode', '新建节点');
            setTimeout(() => {
                this.enterEditMode();
            }, 500);
        },
        addSblingNodeClick: function () {
            window.km.execCommand('AppendSiblingNode', '兄弟节点');
            setTimeout(() => {
                this.enterEditMode();
            }, 500);
        },
        removeNode: function () {
            window.km.execCommand('RemoveNode');
        },
        moveUp: function () {
            window.km.execCommand('ArrangeUp');
        },
        moveDown: function () {
            window.km.execCommand('ArrangeDown');
        },
        resetLayout: function () {
            window.km.execCommand('resetlayout');
        },
        enterEditMode: function () {
            var node = window.km.getSelectedNode();
            if (!node) {
                return;
            }
            var textContainer = window.receiver.element;
            textContainer.innerText = '';
            if (node.getData('font-weight') === 'bold') {
                var b = document.createElement('b');
                textContainer.appendChild(b);
                textContainer = b;
            }
            if (node.getData('font-style') === 'italic') {
                var i = document.createElement('i');
                textContainer.appendChild(i);
                textContainer = i;
            }
            textContainer.innerText = window.km.queryCommandValue('text');
            window.receiver.selectAll();
            this.selectInputControl(node);
            this.updatePosition(node);
        },
        selectInputControl: function (node) {
            if (node) {
                var receiverElement = window.receiver.element;
                var fontSize = node.getData('font-size') || node.getStyle('font-size');
                receiverElement.style.fontSize = fontSize + 'px';
                receiverElement.style.minWidth = 0;
                receiverElement.style.minWidth = receiverElement.clientWidth + 'px';
                receiverElement.style.fontWeight = node.getData('font-weight') || '';
                receiverElement.style.fontStyle = node.getData('font-style') || '';
                receiverElement.classList.add('input');
                receiverElement.focus();
            }
        },
        updatePosition: function (focusNode) {
            var planed = this.updatePosition;
            if (!focusNode) return;

            if (!planed.timer) {
                planed.timer = setTimeout(function () {
                    var receiverElement = window.receiver.element;
                    var box = focusNode.getRenderBox('TextRenderer');
                    receiverElement.style.left = Math.round(box.x) + 'px';
                    receiverElement.style.top = Math.round(box.y) + 'px';
                    //receiverElement.focus();
                    planed.timer = 0;
                });
            }
        },
        exportJson: function() {
            const jsondata = window.km.exportJson();
            downloadJson(jsondata);
        },
        importJson: function() {
            var text = this.importJsonText;
            if (!text) return;
            try {
                window.km.importJson(JSON.parse(text));
            } catch (error) {
                alert(error.message);
            }
            this.dialogVisible = false;
        },
        handleClose: function() {
            this.dialogVisible = false;
        },
        captureInput: function(evt) {
            evt.stopPropagation();
        }
    },
});
</script>
<style>
.receiver {
    position: absolute;
    background: #fff;
    outline: 0;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    left: 0;
    top: 0;
    padding: 3px 5px;
    margin-left: -3px;
    margin-top: -5px;
    max-width: 300px;
    width: auto;
    font-size: 14px;
    line-height: 1.4em;
    min-height: 1.4em;
    box-sizing: border-box;
    overflow: hidden;
    border: none;
    -webkit-user-select: text;
    pointer-events: none;
    opacity: 0;
    z-index: -1000;
}
.receiver.input {
    pointer-events: all;
    opacity: 1;
    z-index: 999;
    background: #fff;
    outline: 0;
}
</style>
