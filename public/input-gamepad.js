// Based on certain concepts from: https://github.com/luser/gamepadtest

const gamepadSampler = {
  controllers: {},
  sample: function () {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [])
    let gamepadsSampled = 0
    Object.entries(gamepads).forEach(([index, gamepad]) => {
      if (gamepad && gamepad.mapping === 'standard') {
        gamepadsSampled += 1
        const id = 'gamepad-' + gamepad.index + '-' + gamepad.id
        const lastSample = gamepadSampler.controllers[id]
        const currentSample = {
          id: id,
          axes: gamepad.axes,
          buttons: gamepad.buttons.map((buttons) => { return buttons.value })
        }
        currentSample.string = JSON.stringify(currentSample)
        if (!lastSample || currentSample.string !== lastSample.string) {
          gamepadEvents.fire('change', currentSample)
        }
        gamepadSampler.controllers[id] = currentSample
      }
    })
    setTimeout(
      gamepadSampler.sample,
      gamepadsSampled > 0 ? 1 : 500
    )
  },
  browserSupportsStandardEvents: 'GamepadEvent' in window,
  browserSupportsWebkitEvents: 'WebKitGamepadEvent' in window,
  init () {
    if (gamepadSampler.browserSupportsStandardEvents || gamepadSampler.browserSupportsWebkitEvents) {
      gamepadSampler.sample()
      console.log('Gamepad support detected. Enabling active Gamepad sampling.')
    } else {
      console.warn('No Gamepad support detected. Not enabling active Gamepad sampling')
    }
  }
}

const gamepadEvents = {
  controllers: {},
  listenerMap: {
    change: [],
    start: [],
    move: [],
    end: []
  },
  fire (eventName, data) {
    gamepadEvents.listenerMap[eventName].forEach((listener) => { listener(data) })
  },
  addEventListener (eventName, listener) {
    gamepadEvents.listenerMap[eventName].push(listener)
  },
  removeEventListener (eventName, outgoingListener) {
    gamepadEvents.listenerMap[eventName] = gamepadEvents.listenerMap[eventName].filter((listener) => {
      return listener !== outgoingListener
    })
  }
}

const deadzone = 0.001
gamepadEvents.addEventListener('change', (event) => {
  const controller = gamepadEvents.controllers[event.id] = gamepadEvents.controllers[event.id] || {
    id: event.id,
    x: 0,
    y: 0,
    start: false
  }
  let centered = (
    Math.abs(event.axes[0]) < deadzone &&
    Math.abs(event.axes[1]) < deadzone
  )
  if (
    controller.x !== event.axes[0] ||
    controller.y !== event.axes[1]
  ) {
    controller.x = event.axes[0]
    controller.y = event.axes[1]
    if (centered) {
      gamepadEvents.fire('end', controller)
    } else {
      gamepadEvents.fire('move', controller)
    }
  }
  if (!controller.start && event.buttons[9]) {
    controller.start = true
    gamepadEvents.fire('start', controller)
  }
  controller.start = event.buttons[9]
})

gamepadSampler.init()

const tau = Math.PI * 2
const deg = tau / 360
window.attachGamepadInputToPlayer = (socket, player) => {
  const startListener = (event) => {
    if (event.id !== player.controller) { return }
    if (!player.connected) {
      window.app.connectPlayer(player)
    } else {
      disconnectGamepad()
      window.app.disconnectPlayer(player)
    }
  }
  const moveListener = (event) => {
    if (event.id !== player.controller) { return }
    let angle = Math.atan2(-event.y, event.x)
    if (!player.connected) {
      window.Vue.set(player, 'angle', ((-angle + tau) % tau) / deg)
    } else {
      const distance = Math.sqrt((event.x * event.x) + (event.y * event.y))
      socket.emit(
        'change',
        {
          id: player.id,
          force: Math.min(1, distance * distance),
          angle: angle
        }
      )
    }
  }
  const endListener = (event) => {
    if (event.id !== player.controller || !player.connected) { return }
    socket.emit('release', {id: player.id})
  }
  const disconnectGamepad = function () {
    gamepadEvents.removeEventListener('start', startListener)
    gamepadEvents.removeEventListener('move', moveListener)
    gamepadEvents.removeEventListener('end', endListener)
  }

  gamepadEvents.addEventListener('start', startListener)
  gamepadEvents.addEventListener('move', moveListener)
  gamepadEvents.addEventListener('end', endListener)
}

window.gamepadEvents = gamepadEvents
