window.Vue.component('ship', window.shipComponent)
window.Vue.component('main-view', window.mainViewComponent)

window.app = {
  data: {
    ships: [
      {
        id: 0,
        x: 0.5,
        y: 0,
        angle: 0,
        color: 'hsla(0, 100%, 50%, 1)'
      },
      {
        id: 1,
        x: -0.5,
        y: 0,
        angle: 180,
        color: 'hsla(180, 100%, 50%, 1)'
      },
      {
        id: 2,
        x: 0,
        y: 0.5,
        angle: 90,
        color: 'hsla(90, 100%, 50%, 1)'
      },
      {
        id: 3,
        x: 0,
        y: -0.5,
        angle: -90,
        color: 'hsla(-90, 100%, 50%, 1)'
      }
    ]
  }
}

window.app.vue = new window.Vue({
  el: '#appTarget',
  data: window.app.data,
  template: `
    <main-view :ships="ships"></main-view>
  `
})
