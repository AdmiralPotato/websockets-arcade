// Based on certain concepts from: https://github.com/luser/gamepadtest

const gamepadSampler = {
  controllers: {},
  sample: function () {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : [])
    let gamepadsSampled = 0
    Object.entries(gamepads).forEach(([index, gamepad]) => {
      if (gamepad && gamepad.mapping === 'standard') {
        gamepadsSampled += 1
        const lastSample = gamepadSampler.controllers[gamepad.index]
        const currentSample = {
          index: gamepad.index,
          axes: gamepad.axes,
          buttons: gamepad.buttons.map((buttons) => { return buttons.value })
        }
        currentSample.string = JSON.stringify(currentSample)
        if (!lastSample || currentSample.string !== lastSample.string) {
          gamepadEvents.fire('change', currentSample)
        }
        gamepadSampler.controllers[gamepad.index] = currentSample
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
  state: {
    x: 0,
    y: 0
  },
  listenerMap: {
    change: [],
    move: [],
    end: []
  },
  fire (eventName, data) {
    gamepadEvents.listenerMap[eventName].forEach((listener) => { listener(data) })
  },
  addEventListener (eventName, listener) {
    gamepadEvents.listenerMap[eventName].push(listener)
  }
}

const deadzone = 0.001
gamepadEvents.addEventListener('change', (event) => {
  let centered = (
    Math.abs(event.axes[0]) < deadzone &&
    Math.abs(event.axes[1]) < deadzone
  )
  if (
    gamepadEvents.state.x !== event.axes[0] ||
    gamepadEvents.state.y !== event.axes[1]
  ) {
    gamepadEvents.state.x = event.axes[0]
    gamepadEvents.state.y = event.axes[1]
    if (centered) {
      gamepadEvents.fire('end')
    } else {
      gamepadEvents.fire('move', gamepadEvents.state)
    }
  }
})

window.attachGamepadInputToSocket = (socket) => {
  gamepadSampler.init()

  gamepadEvents.addEventListener('move', (moveEvent) => {
    const distance = Math.sqrt((moveEvent.x * moveEvent.x) + (moveEvent.y * moveEvent.y))
    socket.emit(
      'change',
      {
        force: Math.min(1, distance * distance),
        angle: Math.atan2(-moveEvent.y, moveEvent.x)
      }
    )
  })

  gamepadEvents.addEventListener('end', () => {
    socket.emit('release')
  })
}
