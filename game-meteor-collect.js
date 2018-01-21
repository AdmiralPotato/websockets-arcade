const tau = Math.PI * 2
const arrayRemove = function (array, item) {
  let index
  while ((index = array.indexOf(item)) !== -1) {
    array.splice(index, 1)
  }
  return array
}
const durationScore = 15 * 100 // Score display time = 15s
const game = {
  drag: 0.955,
  topSpeed: 1 / 80,
  shipRadius: 1 / 40,
  asteroidRadiusMin: 1 / 100,
  asteroidRadiusMax: 1 / 10,
  asteroidRadiusConsumable: 1 / 50,
  asteroidVolumeMax: 0.5,
  asteroidCooldownDefault: 25,
  asteroidCooldown: 25,
  asteroidCount: 0,
  pointsSplit: 2,
  pointsCollect: 5,
  durationPlay: 30 * 100, // ticks are every 10ms
  durationScore: durationScore,
  durationScoreA: 0.95 * durationScore,
  durationScoreB: 0.85 * durationScore,
  durationScoreC: 0.45 * durationScore,
  durationScoreD: 0.4 * durationScore,
  durationInactivityBoot: 10 * 1000, // time in ms
  interval: null,
  io: null,
  players: {},
  state: {
    serverStart: Date.now(),
    mode: 'intro',
    startCircle: null,
    timer: 0,
    ships: [],
    asteroids: []
  },
  shipStateInitial: [],
  shipStateA: [],
  shipStateC: [],
  connectWebSockets: (io) => {
    game.io = io
    game.io.on('connection', function (socket) {
      socket.players = {}
      socket.on('connectPlayer', function (player) {
        game.addPlayer(socket, player)
      })
      socket.on('change', function (moveData) {
        game.controlChange(socket, moveData)
      })
      socket.on('release', function (releaseData) {
        game.controlRelease(socket, releaseData)
      })
      socket.on('disconnectPlayer', function (disconnectPlayerData) {
        const player = socket.players[disconnectPlayerData.id]
        if (player) {
          game.removePlayer(player)
        } else {
          console.error('Cheating! Someone is trying to disconnect a player that is not on their socket!')
        }
      })
      socket.on('disconnect', function () {
        Object.values(socket.players).forEach((player) => {
          game.removePlayer(player)
        })
      })
    })
    game.changeModeToIntro()
    // game.startTheGameWithSomeFakePlayersForTesting()
  },
  startTheGameWithSomeFakePlayersForTesting: function () {
    game.changeModeToPlay()
    let fakeSocket = {id: 'fakeSocket', players: {}, emit () {}}
    for (let i = 0; i < 8; i++) {
      const id = i.toFixed(2)
      if (!game.players[id]) {
        game.addPlayer(fakeSocket, {hue: i * 45, id: id})
      }
    }
    game.state.ships.forEach((ship, index) => {
      ship.score = index * 5
    })
    game.state.ships.sort(() => (Math.random() - 0.5)).sort(() => (Math.random() - 0.5))
  },
  changeModeToIntro: () => {
    const now = Date.now()
    game.state.mode = 'intro'
    game.state.timer = game.durationPlay
    game.state.startCircle = {
      x: 0,
      y: 0.8,
      radius: 1 / 8
    }
    game.populateInitialAsteroids()
    game.state.ships.forEach(ship => {
      ship.score = 0
      game.players[ship.id].lastActiveTime = now
    })
    clearInterval(game.interval)
    game.interval = setInterval(
      game.tickGame,
      10
    )
  },
  changeModeToPlay: () => {
    game.state.mode = 'play'
    game.state.startCircle = undefined
    game.populateInitialAsteroids()
    game.state.ships.forEach(ship => {
      ship.score = 0
    })
  },
  changeModeToScore: () => {
    game.state.mode = 'score'
    game.state.timer = game.durationScore
    game.state.asteroids = []
    let highScore = 0
    let shipCount = game.state.ships.length
    let scores = []
    game.state.ships.forEach((ship, index) => {
      highScore = Math.max(highScore, ship.score)
      scores[index] = ship.score
      ship.score = 0
    })
    game.shipStateInitial = JSON.parse(JSON.stringify(game.state.ships))
    game.shipStateA = JSON.parse(JSON.stringify(game.shipStateInitial))
    game.shipStateA.forEach((ship, index) => {
      ship.score = 0
      ship.x = (((index + 0.5) / shipCount) - 0.5) * (0.8 * 2)
      ship.y = 0.8
    })
    game.shipStateC = JSON.parse(JSON.stringify(game.shipStateA))
    const mapY = (score) => {
      return 0.8 - (score / highScore)
    }
    const yMax = mapY(highScore)
    game.shipStateC.forEach((ship, index) => {
      ship.score = scores[index]
      ship.scoreMax = highScore
      ship.y = mapY(ship.score)
      ship.yMax = yMax
    })
  },
  tickGame: () => {
    const now = Date.now()
    if (game.state.mode !== 'score') {
      game.tickPlayers(now)
      game.tickAsteroids(now)
      game.state.asteroids = game.state.asteroids.filter((asteroid) => { return !asteroid.expired })
    }
    if (game.state.mode === 'intro') {
      if (game.areAllShipsInStartCircle()) {
        game.changeModeToPlay()
      }
    }
    if (game.state.mode === 'play') {
      game.state.timer -= 1
      if (game.state.timer <= 0) {
        game.changeModeToScore()
      }
    }
    if (game.state.mode === 'score') {
      game.state.timer -= 1
      if (game.state.timer <= 0) {
        // game.startTheGameWithSomeFakePlayersForTesting()
        game.changeModeToIntro()
      } else if (game.state.timer >= game.durationScoreA) {
        let diff = game.state.timer - game.durationScoreA
        let total = game.durationScore - game.durationScoreA
        let progress = 1 - (diff / total)
        game.lerpShips(game.shipStateInitial, game.shipStateA, progress)
      } else if (game.state.timer >= game.durationScoreB) {
        // just a pause
      } else if (game.state.timer >= game.durationScoreC) {
        let diff = game.state.timer - game.durationScoreC
        let total = game.durationScoreB - game.durationScoreC
        let progress = 1 - (diff / total)
        game.lerpShips(game.shipStateA, game.shipStateC, progress)
      } else if (game.state.timer <= game.durationScoreD) {
        const blink = Math.floor((game.state.timer % 100) / 50) < 1
        game.state.ships.forEach((ship, index) => {
          const sourceData = game.shipStateC[index]
          if (sourceData) {
            const status = sourceData.score === sourceData.scoreMax ? 'Winner!' : 'Loser!'
            ship.score = blink ? status : ''
          }
        })
      }
    }
    const filteredGameState = game.filterStateDataForClientSide()
    game.io.emit('state', filteredGameState)
  },
  filterProps: [
    'xVel',
    'yVel',
    'rotationSpeed'
  ],
  filterStateDataForClientSide: () => {
    const result = JSON.parse(JSON.stringify(game.state, (key, value) => {
      if (game.filterProps.includes(key)) {
        value = undefined
      } else if (key !== 'serverStart' && typeof value === 'number') {
        value = parseFloat(value.toFixed(5))
      }
      return value
    }))
    return result
  },
  lerpShips: (startState, targetState, progress) => {
    game.state.ships.forEach((ship, index) => {
      const a = startState[index]
      const b = targetState[index]
      if (a !== undefined && b !== undefined) {
        game.lerpShip(ship, a, b, progress)
      }
    })
  },
  lerpShip: (target, a, b, progress) => {
    target.x = game.lerp(a.x, b.x, progress)
    if (b.yMax === undefined) {
      target.y = game.lerp(a.y, b.y, progress)
      target.score = Math.floor(game.lerp(a.score, b.score, progress))
    } else {
      target.y = Math.max(b.y, game.lerp(a.y, b.yMax, progress))
      target.score = Math.min(b.score, Math.floor(game.lerp(a.score, b.scoreMax, progress)))
    }
  },
  lerp: (a, b, progress) => {
    return a + ((b - a) * progress)
  },
  tickPlayers: (now) => {
    game.state.ships.forEach(ship => {
      let player = game.players[ship.id]
      ship.x += ship.xVel
      ship.y += ship.yVel
      game.wrap(ship)

      if (player.onTime !== null) {
        const timeDiff = now - player.onTime
        const accelerationRampUp = Math.min(1, timeDiff / 1000)
        ship.xVel = Math.cos(ship.angle) * player.force * accelerationRampUp * game.topSpeed
        ship.yVel = Math.sin(ship.angle) * player.force * accelerationRampUp * game.topSpeed
      } else {
        ship.xVel *= game.drag
        ship.yVel *= game.drag
      }
    })
  },
  tickAsteroids: (now) => {
    game.state.ships.forEach(ship => {
      ship.hit = false
    })
    game.state.asteroids.forEach(asteroid => {
      asteroid.x += asteroid.xVel
      asteroid.y += asteroid.yVel
      asteroid.angle += asteroid.rotationSpeed
      game.wrap(asteroid)
      if (asteroid.invincible > 0) {
        asteroid.invincible -= 1
      } else {
        game.detectAsteroidCollisions(asteroid)
      }
    })
    game.generateAsteroids()
  },
  areAllShipsInStartCircle: () => {
    const now = Date.now()
    let readyPlayerCount = 0
    game.state.ships.forEach((ship) => {
      const ready = game.detectCollision(ship, game.state.startCircle)
      const player = game.players[ship.id]
      if (ready) {
        readyPlayerCount += 1
      } else if (now - player.lastActiveTime > game.durationInactivityBoot) {
        game.bootPlayer(player)
      }
    })
    return readyPlayerCount > 0 && readyPlayerCount === game.state.ships.length
  },
  detectAsteroidCollisions: (asteroid) => {
    game.state.ships.forEach(ship => {
      const hit = game.detectCollision(ship, asteroid)
      if (hit) {
        ship.hit = ship.hit || hit
        asteroid.expired = asteroid.expired || hit
        if (asteroid.consumable) {
          ship.score += game.pointsCollect
        } else {
          ship.score += game.pointsSplit
        }
      }
    })
    if (asteroid.expired && !asteroid.consumable) {
      game.splitAsteroid(asteroid)
    }
  },
  populateInitialAsteroids: () => {
    game.state.asteroids = []
    while (game.state.asteroids.length < 10) {
      game.state.asteroids.push(
        game.createAsteroid()
      )
    }
  },
  wrap: (target) => {
    target.x = (Math.abs(target.x) > 1 ? -1 * Math.sign(target.x) : target.x) || 0
    target.y = (Math.abs(target.y) > 1 ? -1 * Math.sign(target.y) : target.y) || 0
  },
  detectCollision: (a, b) => {
    const diffX = a.x - b.x
    const diffY = a.y - b.y
    const distance = Math.sqrt((diffX * diffX) + (diffY * diffY))
    return distance < a.radius + b.radius
  },
  addPlayer: (socket, player) => {
    if (!game.players[player.id]) {
      player.force = 0
      player.onTime = null
      player.ship = game.createShip(player)
      player.socket = socket
      player.lastActiveTime = Date.now()
      socket.players[player.id] = player
      game.players[player.id] = player
      game.state.ships.push(player.ship)
      socket.emit('connectPlayer', player.id)
      game.reportPlayerCount(game.io)
      console.log(`Connecting player:${player.id} to socket:${socket.id}`)
    } else {
      console.error('Cheating! Someone is trying to become another connected player!')
    }
  },
  createShip: (player) => {
    const radius = 0.5
    const angle = Math.random() * Math.PI * 2
    return {
      id: player.id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      xVel: 0,
      yVel: 0,
      angle: 0,
      radius: game.shipRadius,
      hue: player.hue,
      hit: false,
      score: 0
    }
  },
  generateAsteroids: () => {
    if (game.currentAsteroidVolume() < game.asteroidVolumeMax && game.asteroidCooldown <= 0) {
      game.state.asteroids.push(game.createAsteroid())
      game.asteroidCooldown = game.asteroidCooldownDefault
    } else {
      game.asteroidCooldown -= 1
    }
  },
  currentAsteroidVolume: () => {
    let volume = 0
    game.state.asteroids.forEach(asteroid => {
      volume += asteroid.radius
    })
    return volume
  },
  createAsteroid: (
    x = null,
    y = null,
    radius = Math.max(game.asteroidRadiusMax * Math.random(), game.asteroidRadiusMin)
  ) => {
    const angle = Math.random() * tau
    const speed = Math.min((1 / 800), Math.random() * (1 / 600))
    const id = game.asteroidCount += 1
    if (x === null || y === null) {
      const edgePostion = game.randomEdgePosition()
      x = edgePostion.x
      y = edgePostion.y
    }
    return {
      id,
      x,
      y,
      xVel: Math.cos(angle) * speed,
      yVel: Math.sin(angle) * speed,
      rotationSpeed: speed * Math.sign(Math.random() - 0.5),
      radius,
      angle,
      invincible: 100,
      consumable: radius <= game.asteroidRadiusConsumable
    }
  },
  randomEdgePosition: () => {
    const angle = Math.random() * tau
    const radius = 2
    return {
      x: game.bound(-1, 1, Math.cos(angle) * radius),
      y: game.bound(-1, 1, Math.sin(angle) * radius)
    }
  },
  bound: (min, max, value) => {
    return Math.min(max, Math.max(min, value))
  },
  splitAsteroid: (asteroid) => {
    const x = asteroid.x
    const y = asteroid.y
    const radius = asteroid.radius / 2
    game.state.asteroids.push(
      game.createAsteroid(x, y, radius),
      game.createAsteroid(x, y, radius)
    )
  },
  removePlayer: (player) => {
    delete player.socket.players[player.id]
    delete player.socket
    delete game.players[player.id]
    arrayRemove(game.state.ships, player.ship)
    game.reportPlayerCount()
  },
  bootPlayer: (player) => {
    player.socket.emit('removePlayer', player.id)
    game.removePlayer(player)
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
  },
  reportPlayerCount: () => {
    const connectedPlayers = Object.values(game.players).length
    console.log('Connected players:', connectedPlayers)
    game.io.emit('players', connectedPlayers)
    game.io.emit('state', game.state)
  }
}

module.exports = game
