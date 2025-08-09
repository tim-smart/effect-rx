<script setup lang="ts">
import { Atom, useAtomValue } from '@effect-atom/atom-vue';
import { Effect} from 'effect';
import { onUnmounted, ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)

const req = ref({ echo: "initial" })

const result = useAtomValue(() => {
  console.log("Computing Atom:", req.value)
  return Atom.refreshOnWindowFocus(
    Atom.make(() => Effect.gen(function* () {
      return  { echo: req.value.echo, at: new Date()}
    })),
  )
})

const intervalEnabled = ref(false)

const interval = setInterval(() => intervalEnabled.value && (req.value = { echo: `Hello World ${new Date().toLocaleTimeString()}` }), 5_000)
onUnmounted(() => clearInterval(interval))
</script>

<template>
  <h1>{{ msg }}</h1>

  <div v-if="result._tag === 'Initial'">
    Initial    
  </div>
  <div v-else-if="result._tag === 'Failure'">
    <div v-if="result.waiting">Waiting...</div>
    Failure..   {{  result.cause }} 
  </div>
  <div v-else>
    <div v-if="result.waiting">Waiting...</div>
    Success: {{ result.value }}
  </div>

  <button @click="intervalEnabled = !intervalEnabled">
    Toggle interval {{ !intervalEnabled ? 'ON' : 'OFF' }}
  </button>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
