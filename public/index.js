window.Vue.component('vector-text-defs', window.vectorTextDefsComponent)
window.Vue.component('vector-text', window.vectorTextComponent)
window.Vue.component('countdown-circle', window.countdownCircleComponent)
window.Vue.component('star', window.starComponent)
window.Vue.component('ship', window.shipComponent)
window.Vue.component('meteor', window.meteorComponent)
window.Vue.component('vert', window.vertComponent)
window.Vue.component('color-picker', window.colorPickerComponent)
window.Vue.component('shape-defs', window.shapeDefsComponent)
window.Vue.component('game-meteor-collect', window.gameMeteorCollectComponent)
window.Vue.component('game-cosmic-dash', window.gameCosmicDashComponent)
window.Vue.component('game-cave-escape', window.gameCaveEscapeComponent)
window.Vue.component('game-slurp', window.gameSlurpComponent)
window.Vue.component('game-select', window.gameSelectComponent)
window.Vue.component('main-view', window.mainViewComponent)

window.app = {
  data: {
    localPlayers: {},
    state: {}
  },
  randomHash: function () { return parseInt((Math.random() * 1e15).toFixed(0), 10).toString(36) },
  createLocalPlayer: function (controller) {
    const id = window.app.randomHash()
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
  getPlayerById: function (id) {
    return Object.values(window.app.data.localPlayers).filter((player) => { return player.id === id }).pop()
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
  removePlayer: function (player) {
    player.disconnectController()
    window.Vue.delete(window.app.data.localPlayers, player.controller)
    if (player.controller === 'touch') {
      initTouch()
    }
    console.log(`Removed player:${player.id} with controller:${player.controller}`)
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
      :state="state"
      :localPlayers="localPlayers"
      @selectColor="selectColor"
    />
  `
})

socket.on('connectPlayer', (id) => {
  const player = window.app.getPlayerById(id)
  if (player) {
    player.connected = true
    if (player.controller === 'touch') {
      window.attachTouchInputToPlayer(socket, player)
    }
  } else {
    console.error('Umm... the server asked us to connect a local player that we do not have.', id)
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

const handleTouch = function (event) {
  event.preventDefault()
  event.stopImmediatePropagation()
  window.app.createLocalPlayer('touch')
  document.body.removeEventListener('mousedown', handleTouch, true)
  document.body.removeEventListener('touchstart', handleTouch, true)
}
const initTouch = function () {
  document.body.addEventListener('mousedown', handleTouch, true)
  document.body.addEventListener('touchstart', handleTouch, true)
}
initTouch()

const initGamepad = function (event) {
  const controller = event.id
  const player = window.app.data.localPlayers[controller]
  if (!player) {
    window.app.createLocalPlayer(controller)
  }
}

socket.on('removePlayer', function (playerId) {
  let player = window.app.getPlayerById(playerId)
  if (player) {
    window.app.removePlayer(player)
  } else {
    console.error('Umm... the server asked us to disconect a player that we do not have.', playerId)
  }
})

window.gamepadEvents.addEventListener('start', initGamepad)
