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

const touchInput = window.nipplejs.create(joystickOptions)

window.attachTouchInputToSocket = (socket) => {
  touchInput.on('move', (allJoystickValues, currentJoystickValues) => {
    socket.emit(
      'change',
      {
        force: currentJoystickValues.force,
        angle: currentJoystickValues.angle.radian
      }
    )
  })

  touchInput.on('end', () => {
    socket.emit('release')
  })
}
