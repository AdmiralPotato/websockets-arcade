require('./game-globals')
const gameMeteorCollect = require('./game-meteor-collect.js')

const manager = {
  interval: null,
  io: null,
  players: {},
  shipRadius: 1 / 40,
  state: {
    serverStart: Date.now(),
    game: 'meteor-collect',
    mode: 'intro',
    startCircle: null,
    timer: 0,
    ships: [],
    meteors: []
  },
  currentGame: gameMeteorCollect,
  connectWebSockets: (io) => {
    manager.io = io
    manager.io.on('connection', function (socket) {
      socket.players = {}
      socket.on('connectPlayer', function (player) {
        manager.addPlayer(socket, player)
      })
      socket.on('change', function (moveData) {
        manager.controlChange(socket, moveData)
      })
      socket.on('release', function (releaseData) {
        manager.controlRelease(socket, releaseData)
      })
      socket.on('disconnectPlayer', function (disconnectPlayerData) {
        const player = socket.players[disconnectPlayerData.id]
        if (player) {
          manager.removePlayer(player)
        } else {
          console.error('Cheating! Someone is trying to disconnect a player that is not on their socket!')
        }
      })
      socket.on('disconnect', function () {
        Object.values(socket.players).forEach((player) => {
          manager.removePlayer(player)
        })
      })
    })
    clearInterval(manager.interval)
    manager.interval = setInterval(
      manager.tickGame,
      10
    )
    manager.currentGame.changeModeToIntro(manager.players, manager.state)
    // game.startTheGameWithSomeFakePlayersForTesting()
  },
  startTheGameWithSomeFakePlayersForTesting: function () {
    manager.currentGame.changeModeToPlay(manager.players, manager.state)
    let fakeSocket = {id: 'fakeSocket', players: {}, emit () {}}
    for (let i = 0; i < 8; i++) {
      const id = i.toFixed(2)
      if (!manager.players[id]) {
        manager.addPlayer(fakeSocket, {hue: i * 45, id: id})
      }
    }
    manager.state.ships.forEach((ship, index) => {
      ship.score = index * 5
    })
    manager.state.ships.sort(() => (Math.random() - 0.5)).sort(() => (Math.random() - 0.5))
  },
  tickGame: () => {
    const now = Date.now()
    const newState = manager.currentGame.tickGame(now, manager.players, manager.state)
    const filteredGameState = manager.filterStateDataForClientSide(newState)
    manager.io.emit('state', filteredGameState)
    manager.bootPlayersThatNeedBooting(manager.players)
  },
  filterProps: [
    'xVel',
    'yVel',
    'rotationSpeed',
    'tick',
    'ticksToActivate'
  ],
  filterStateDataForClientSide: (state) => {
    const result = JSON.parse(JSON.stringify(state, (key, value) => {
      if (manager.filterProps.includes(key)) {
        value = undefined
      } else if (key !== 'serverStart' && typeof value === 'number') {
        value = parseFloat(value.toFixed(5))
      }
      return value
    }))
    return result
  },
  addPlayer: (socket, player) => {
    if (!manager.players[player.id]) {
      player.force = 0
      player.onTime = null
      player.ship = manager.createShip(player)
      player.socket = socket
      player.lastActiveTime = Date.now()
      socket.players[player.id] = player
      manager.players[player.id] = player
      manager.state.ships.push(player.ship)
      socket.emit('connectPlayer', player.id)
      manager.reportPlayerCount(manager.io)
      console.log(`Connecting player:${player.id} to socket:${socket.id}`)
    } else {
      console.error('Cheating! Someone is trying to become another connected player!')
    }
  },
  createShip: (player, shipRadius) => {
    const placementRadius = 0.5
    const angle = Math.random() * Math.PI * 2
    return {
      id: player.id,
      x: Math.cos(angle) * placementRadius,
      y: Math.sin(angle) * placementRadius,
      xVel: 0,
      yVel: 0,
      angle: 0,
      radius: manager.shipRadius,
      hue: player.hue,
      hit: false,
      score: 0
    }
  },
  removePlayer: (player) => {
    delete player.socket.players[player.id]
    delete player.socket
    delete manager.players[player.id]
    global.arrayRemove(manager.state.ships, player.ship)
    manager.reportPlayerCount()
  },
  bootPlayer: (player) => {
    player.socket.emit('removePlayer', player.id)
    manager.removePlayer(player)
  },
  bootPlayersThatNeedBooting: (players) => {
    Object.values(players).forEach((player) => {
      if (player.needsBooting) {
        manager.bootPlayer(player)
      }
    })
  },
  reportPlayerCount: () => {
    const connectedPlayers = Object.values(manager.players).length
    console.log('Connected players:', connectedPlayers)
    manager.io.emit('players', connectedPlayers)
    manager.io.emit('state', manager.state)
  },
  controlChange: (socket, moveData) => {
    const player = socket.players[moveData.id]
    if (player) {
      if (!player.onTime) {
        player.onTime = Date.now()
      }
      player.lastActiveTime = Date.now()
      player.force = Math.min(1, moveData.force)
      player.ship.angle = (moveData.angle !== undefined ? -moveData.angle : player.ship.angle)
    } else {
      console.error('Cheating! Someone is trying to control a ship that is not on their socket!')
    }
  },
  controlRelease: (socket, releaseData) => {
    const player = socket.players[releaseData.id]
    if (player) {
      player.onTime = null
      player.lastActiveTime = Date.now()
    } else {
      console.error('Cheating! Someone is trying to stop a ship that is not on their socket!')
    }
  }
}

module.exports = manager
