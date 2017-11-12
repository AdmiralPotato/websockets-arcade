const arrayRemove = function (array, item) {
  let index
  while ((index = array.indexOf(item)) !== -1) {
    array.splice(index, 1)
  }
  return array
}
const game = {
  playerSockets: [],
  state: {
    ships: []
  },
  connectWebSockets: (io) => {
    io.on('connection', function (socket) {
      game.addPlayer(socket)
      socket.on('move', function (moveData) {
        game.movePlayer(socket, moveData)
      })
      socket.on('disconnect', function () {
        game.removePlayer(socket)
      })
    })
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
      angle: 0,
      color: `hsla(${Math.random() * 360}, 100%, 50%, 1)`
    }
  },
  removePlayer: (socket) => {
    arrayRemove(game.playerSockets, socket)
    arrayRemove(game.state.ships, socket.ship)
    game.reportPlayerCount(socket)
  },
  movePlayer: (socket, moveData) => {
    const angle = moveData.angle !== undefined ? -moveData.angle : socket.ship.angle
    socket.ship.angle = angle
    socket.ship.x = Math.cos(angle) * moveData.force
    socket.ship.y = Math.sin(angle) * moveData.force
    socket.server.emit('state', game.state)
  },
  reportPlayerCount: (socket) => {
    console.log('Connected players:', game.playerSockets.length)
    socket.server.emit('players', game.playerSockets.length)
    socket.server.emit('state', game.state)
  }
}

module.exports = game
