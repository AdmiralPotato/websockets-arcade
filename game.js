const tau = Math.PI * 2
const arrayRemove = function (array, item) {
  let index
  while ((index = array.indexOf(item)) !== -1) {
    array.splice(index, 1)
  }
  return array
}
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
  durationPlay: 10 * 100, // match play time = 2:00; ticks are every 10ms
  durationScore: 10 * 100, // Score display time = 10s
  durationScoreA: 8 * 100, // Score display time = 10s
  durationScoreB: 6 * 100, // Score display time = 10s
  durationScoreC: 2 * 100, // Score display time = 10s
  interval: null,
  io: null,
  playerSockets: [],
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
    game.changeModeToIntro()
  },
  changeModeToIntro: () => {
    game.state.mode = 'intro'
    game.state.timer = game.durationPlay
    game.state.startCircle = {
      x: 0,
      y: 0.8,
      radius: 1 / 8
    }
    game.populateInitialAsteroids()
    game.playerSockets.forEach(socket => {
      socket.ship.score = 0
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
    game.playerSockets.forEach(socket => {
      socket.ship.score = 0
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
    game.shipStateC.forEach((ship, index) => {
      ship.score = scores[index]
      ship.y = 0.8 - ((ship.score / highScore) * 0.8)
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
      if (game.haveAllPlayersGroupedUp()) {
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
      }
    }
    game.io.emit('state', game.state)
  },
  lerpShips: (startState, targetState, progress) => {
    game.state.ships.forEach((ship, index) => {
      game.lerpShip(ship, startState[index], targetState[index], progress)
    })
  },
  lerpShip: (target, a, b, progress) => {
    target.x = game.lerp(a.x, b.x, progress)
    target.y = game.lerp(a.y, b.y, progress)
    target.score = Math.floor(game.lerp(a.score, b.score, progress))
  },
  lerp: (a, b, progress) => {
    return a + ((b - a) * progress)
  },
  tickPlayers: (now) => {
    game.playerSockets.forEach(socket => {
      let ship = socket.ship
      ship.x += ship.xVel
      ship.y += ship.yVel
      game.wrap(ship)

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
  haveAllPlayersGroupedUp: () => {
    let readyPlayerCount = 0
    for (let i = 0; i < game.state.ships.length; i++) {
      let ship = game.state.ships[i]
      let ready = game.detectCollision(ship, game.state.startCircle)
      if (ready) {
        readyPlayerCount += 1
      } else {
        break
      }
    }
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
    target.x = Math.abs(target.x) > 1 ? -1 * Math.sign(target.x) : target.x
    target.y = Math.abs(target.y) > 1 ? -1 * Math.sign(target.y) : target.y
  },
  detectCollision: (a, b) => {
    const diffX = a.x - b.x
    const diffY = a.y - b.y
    const distance = Math.sqrt((diffX * diffX) + (diffY * diffY))
    return distance < a.radius + b.radius
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
      radius: game.shipRadius,
      color: `hsla(${Math.random() * 360}, 100%, 50%, 1)`,
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
    socket.onTime = null
  },
  reportPlayerCount: (socket) => {
    console.log('Connected players:', game.playerSockets.length)
    socket.server.emit('players', game.playerSockets.length)
    socket.server.emit('state', game.state)
  }
}

module.exports = game
