<template>
    <div>
        <v-btn variant="outlined" icon="mdi-microphone" @click="toggle"></v-btn>
        <div> {{ lastCommand }}</div>

        <p><img style="height: 200px;" src="https://media.gq.com.mx/photos/620e915c43f71a078a35533f/16:9/w_1600,c_limit/playa.jpg" alt="" srcset=""></p>
        
        


    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { toggle, initSpeechRecognize, isListening, lastCommand } from '@/components/Speech/commands'

onMounted(() => {
    initSpeechRecognize();
})

watch(isListening, (newVal) => {
    console.log('isListening', newVal)
})
</script>
<style scoped></style>