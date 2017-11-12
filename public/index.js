window.Vue.component('ship', window.shipComponent)
window.Vue.component('main-view', window.mainViewComponent)

window.app = {
  data: {
    playerId: '',
    ships: []
  }
}

window.app.vue = new window.Vue({
  el: '#appTarget',
  data: window.app.data,
  template: `
    <main-view :ships="ships" :playerId="playerId"></main-view>
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
  console.log('Game state:', data)
  window.app.data.ships = data.ships
})
