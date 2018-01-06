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

window.attachTouchInputToPlayer = (socket, player) => {
  const touchInput = window.nipplejs.create(joystickOptions)
  const moveListener = (allJoystickValues, currentJoystickValues) => {
    socket.emit(
      'change',
      {
        id: player.id,
        force: currentJoystickValues.force,
        angle: currentJoystickValues.angle.radian
      }
    )
  }

  const endListener = () => {
    socket.emit('release', {id: player.id})
  }

  const disconnectTouch = () => {
    touchInput.destroy()
  }

  player.disconnectController = disconnectTouch

  touchInput.on('move', moveListener)
  touchInput.on('end', endListener)
}
