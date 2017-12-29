window.Vue.component('vector-text-defs', window.vectorTextDefsComponent)
window.Vue.component('vector-text', window.vectorTextComponent)
window.Vue.component('ship', window.shipComponent)
window.Vue.component('asteroid', window.asteroidComponent)
window.Vue.component('main-view', window.mainViewComponent)
window.Vue.component('color-picker', window.colorPickerComponent)

window.app = {
  data: {
    playerId: '',
    showColorPicker: false,
    state: {}
  },
  lastServerState: {}
}

const pickColor = function () {
  window.app.data.showColorPicker = true
  document.body.removeEventListener('click', pickColor, true)
}
document.body.addEventListener('click', pickColor, true)

const socket = window.io.connect('//')

window.app.vue = new window.Vue({
  el: '#appTarget',
  data: window.app.data,
  methods: {
    selectColor: function (hue) {
      socket.emit(
        'playerConnect',
        {
          hue: hue
        }
      )
      window.app.data.showColorPicker = false
    }
  },
  template: `
    <main-view
      v-bind="state"
      :playerId="playerId"
      :showColorPicker="showColorPicker"
      @selectColor="selectColor"
    />
  `
})

socket.on('playerConnect', () => {
  window.app.data.playerId = socket.id
  window.attachTouchInputToSocket(socket)
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

window.attachGamepadInputToSocket(socket)
