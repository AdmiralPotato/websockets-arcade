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
  window.app.lastServerState = data
})

const gameRenderLoop = () => {
  window.requestAnimationFrame(gameRenderLoop)
  window.app.data.state = window.app.lastServerState
}

window.requestAnimationFrame(gameRenderLoop)

const joystickOptions = {
  zone: document.body,
  color: '#fff',
  size: Math.min(window.innerWidth, window.innerHeight) * 0.25,
  threshold: 0.1,
  multitouch: false,
  maxNumberOfNipples: 1,
  dataOnly: false,
  mode: 'semi',
  restOpacity: 0.125
}

window.joystickManager = window.nipplejs.create(joystickOptions)

window.joystickManager.on('move', (allJoystickValues, currentJoystickValues) => {
  socket.emit(
    'change',
    {
      force: currentJoystickValues.force,
      angle: currentJoystickValues.angle.radian
    }
  )
})

window.joystickManager.on('end', () => {
  socket.emit('release')
})
