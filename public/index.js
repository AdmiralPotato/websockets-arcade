window.Vue.component('vector-text-defs', window.vectorTextDefsComponent)
window.Vue.component('vector-text', window.vectorTextComponent)
window.Vue.component('ship', window.shipComponent)
window.Vue.component('asteroid', window.asteroidComponent)
window.Vue.component('main-view', window.mainViewComponent)

window.app = {
  data: {
    playerId: '',
    state: {}
  },
  lastServerState: {}
}

window.app.vue = new window.Vue({
  el: '#appTarget',
  data: window.app.data,
  template: `
    <main-view
      v-bind="state"
      :playerId="playerId"
    />
  `
})

const socket = window.io.connect('//')

socket.on('connect', () => {
  window.app.data.playerId = socket.id
})

socket.on('players', function (data) {
  console.log('Players online:', data)
})

socket.on('state', function (data) {
  const lastStart = window.app.lastServerState.serverStart
  if (lastStart && lastStart !== data.serverStart) {
    socket.close()
    window.location.reload(true)
  }
  window.app.lastServerState = data
})

const gameRenderLoop = () => {
  window.requestAnimationFrame(gameRenderLoop)
  window.app.data.state = window.app.lastServerState
}

window.requestAnimationFrame(gameRenderLoop)

window.attachTouchInputToSocket(socket)
window.attachGamepadInputToSocket(socket)
