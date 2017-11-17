const arrayRemove = function (array, item) {
  let index
  while ((index = array.indexOf(item)) !== -1) {
    array.splice(index, 1)
  }
  return array
}
const game = {
  playerSockets: [],
  drag: 0.955,
  topSpeed: 1 / 80,
  state: {
    ships: []
  },
  connectWebSockets: (io) => {
    io.on('connection', function (socket) {
      game.addPlayer(socket)
      socket.force = 0
      socket.onTime = null
      socket.on('change', function (moveData) {
        game.controlChange(socket, moveData)
      })
      socket.on('release', function () {
        game.controlRelease(socket)
      })
      socket.on('disconnect', function () {
        game.removePlayer(socket)
      })
    })
    setInterval(
      () => {
        const now = Date.now()
        game.playerSockets.forEach(socket => {
          let ship = socket.ship
          ship.x += ship.xVel
          ship.y += ship.yVel
          ship.x = Math.abs(ship.x) > 1 ? -1 * Math.sign(ship.x) : ship.x
          ship.y = Math.abs(ship.y) > 1 ? -1 * Math.sign(ship.y) : ship.y
          if (socket.onTime !== null) {
            const timeDiff = now - socket.onTime
            const accelerationRampUp = Math.min(1, timeDiff / 1000)

            ship.xVel = Math.cos(ship.angle) * socket.force * accelerationRampUp * game.topSpeed
            ship.yVel = Math.sin(ship.angle) * socket.force * accelerationRampUp * game.topSpeed
          } else {
            ship.xVel *= game.drag
            ship.yVel *= game.drag
          }
        })
        io.emit('state', game.state)
      },
      10
    )
  },
  addPlayer: (socket) => {
    socket.ship = game.createShip(socket)
    game.playerSockets.push(socket)
    game.state.ships.push(socket.ship)
    game.reportPlayerCount(socket)
  },
  createShip: (socket) => {
    const radius = 0.5
    const angle = Math.random() * Math.PI * 2
    return {
      id: socket.id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      xVel: 0,
      yVel: 0,
      angle: 0,
      color: `hsla(${Math.random() * 360}, 100%, 50%, 1)`
    }
  },
  removePlayer: (socket) => {
    arrayRemove(game.playerSockets, socket)
    arrayRemove(game.state.ships, socket.ship)
    game.reportPlayerCount(socket)
  },
  controlChange: (socket, moveData) => {
    if (!socket.onTime) {
      socket.onTime = Date.now()
    }
    socket.force = Math.min(1, moveData.force)
    socket.ship.angle = moveData.angle !== undefined ? -moveData.angle : socket.ship.angle
  },
  controlRelease: (socket) => {
    console.log('player took their finger off pad')
    socket.onTime = null
  },
  reportPlayerCount: (socket) => {
    console.log('Connected players:', game.playerSockets.length)
    socket.server.emit('players', game.playerSockets.length)
    socket.server.emit('state', game.state)
  }
}

module.exports = game
