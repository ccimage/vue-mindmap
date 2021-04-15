<template>
    <el-button :type="disabled ? 'info' : type" plain :icon="icon" size="small" :disabled="disabled">{{
        text
    }}</el-button>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue';
export default defineComponent({
    name: 'StateButton',
    props: {
        type: { type: String, required: true },
        icon: { type: String, required: true },
        disabled: { type: Boolean, required: true },
        text: { type: String, required: false },
    },
});
</script>
