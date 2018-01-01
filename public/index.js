window.Vue.component('vector-text-defs', window.vectorTextDefsComponent)
window.Vue.component('vector-text', window.vectorTextComponent)
window.Vue.component('ship', window.shipComponent)
window.Vue.component('asteroid', window.asteroidComponent)
window.Vue.component('main-view', window.mainViewComponent)
window.Vue.component('color-picker', window.colorPickerComponent)

window.app = {
  data: {
    localPlayers: {},
    state: {}
  },
  createLocalPlayer: function (controller) {
    const id = parseInt((Math.random() * 1e15).toFixed(0), 10).toString(36)
    const player = {
      controller: controller,
      id: id,
      connected: false
    }
    window.Vue.set(window.app.data.localPlayers, controller, player)
    if (controller !== 'touch') {
      window.attachGamepadInputToPlayer(socket, player)
    }
    console.log(`Created player:${player.id} with controller:${controller}`)
  },
  connectPlayer: function (player) {
    socket.emit(
      'connectPlayer',
      {
        id: player.id,
        hue: player.hue
      }
    )
  },
  disconnectPlayer: function (player) {
    socket.emit('disconnectPlayer', {id: player.id})
    window.Vue.delete(window.app.data.localPlayers, player.controller)
    console.log(`Disconnected player:${player.id} with controller:${player.controller}`)
  },
  lastServerState: {}
}

const socket = window.io.connect('//')

window.app.vue = new window.Vue({
  el: '#appTarget',
  data: window.app.data,
  methods: {
    selectColor: function (player) {
      window.app.connectPlayer(player)
    }
  },
  template: `
    <main-view
      v-bind="state"
      :localPlayers="localPlayers"
      @selectColor="selectColor"
    />
  `
})

socket.on('connectPlayer', (id) => {
  const player = Object.values(window.app.data.localPlayers).filter((player) => { return player.id === id }).pop()
  if (player) {
    player.connected = true
    if (player.controller === 'touch') {
      window.attachTouchInputToPlayer(socket, player)
    }
  } else {
    console.error('Umm... the server seems to think we have a local player that we do not.', id)
  }
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

const initTouch = function () {
  window.app.createLocalPlayer('touch')
  document.body.removeEventListener('click', initTouch, true)
}
document.body.addEventListener('click', initTouch, true)

const initGamepad = function (event) {
  const controller = event.id
  const player = window.app.data.localPlayers[controller]
  if (!player) {
    window.app.createLocalPlayer(controller)
  }
}
window.gamepadEvents.addEventListener('start', initGamepad)
