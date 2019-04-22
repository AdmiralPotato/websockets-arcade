const game = {
  meteorRadiusMin: 1 / 100,
  meteorRadiusMax: 1 / 10,
  meteorRadiusConsumable: 1 / 50,
  meteorMinSpeed: 1 / 8000,
  meteorMaxSpeed: 1 / 700,
  meteorVolumeMax: 0.5,
  meteorCooldownDefault: 25,
  meteorCooldown: 25,
  meteorLastId: 0,
  meteorStartCount: 10,
  pointsSplit: 2,
  pointsCollect: 5,
  durationPlay: 30 * global.ticksPerSecond, // ticks are every 10ms
  activate: (players, state) => {
    Object.assign(
      state,
      {
        timer: 0,
        startCircle: null,
        meteors: []
      }
    )
    game.changeModeToIntro(players, state)
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.timer = game.durationPlay
    state.startCircle = global.createActivityCircle({
      label: 'Start',
      y: 0.8
    })
    game.populateInitialMeteors(state)
    state.ships.forEach(ship => {
      ship.score = 0
      players[ship.id].lastActiveTime = now
    })
  },
  changeModeToPlay: (players, state) => {
    state.mode = 'play'
    state.startCircle = undefined
    game.populateInitialMeteors(state)
    state.ships.forEach(ship => {
      ship.score = 0
    })
    state.events.emit('start')
  },
  changeModeToScore: (players, state) => {
    state.meteors = []
    global.totalPlayerScores(players, state)
  },
  tickGame: (now, players, state) => {
    if (state.mode !== 'score') {
      global.tickPlayers(now, players, state)
      game.tickMeteors(now, state)
    }
    if (state.mode === 'intro') {
      let startGame = global.circleSelectCountdown(
        now,
        state.startCircle,
        players,
        state,
        true
      )
      if (startGame) {
        game.changeModeToPlay(players, state)
      }
    }
    if (state.mode === 'play') {
      state.timer -= 1
      if (state.timer <= 0) {
        game.changeModeToScore(players, state)
      }
    }
    if (state.mode === 'score') {
      global.animatePlayerScores(players, state)
    }
    return state
  },
  tickMeteors: (now, state) => {
    state.ships.forEach(ship => {
      ship.hit = false
    })
    state.meteors.forEach(meteor => {
      meteor.x += meteor.xVel
      meteor.y += meteor.yVel
      meteor.angle += meteor.rotationSpeed
      global.wrap(meteor)
      if (meteor.invincible > 0) {
        meteor.invincible -= 1
      } else {
        game.detectMeteorCollisions(state, meteor)
      }
    })
    state.meteors = state.meteors.filter((meteor) => { return !meteor.expired })
    game.generateMeteors(state)
  },
  detectMeteorCollisions: (state, meteor) => {
    state.ships.forEach(ship => {
      const hit = global.detectCollision(ship, meteor)
      if (hit) {
        ship.hit = ship.hit || hit
        meteor.expired = meteor.expired || hit
        if (meteor.consumable) {
          ship.score += game.pointsCollect
        } else {
          ship.score += game.pointsSplit
        }
      }
    })
    if (meteor.expired && !meteor.consumable) {
      game.splitMeteor(state, meteor)
    }
  },
  populateInitialMeteors: (state) => {
    state.meteors = []
    while (state.meteors.length < game.meteorStartCount) {
      state.meteors.push(
        game.createMeteor()
      )
    }
  },
  generateMeteors: (state) => {
    if (game.currentMeteorVolume(state) < game.meteorVolumeMax && game.meteorCooldown <= 0) {
      state.meteors.push(game.createMeteor())
      game.meteorCooldown = game.meteorCooldownDefault
    } else {
      game.meteorCooldown -= 1
    }
  },
  currentMeteorVolume: (state) => {
    let volume = 0
    state.meteors.forEach(meteor => {
      volume += meteor.radius
    })
    return volume
  },
  createMeteor: (
    x = null,
    y = null,
    radius = global.rangeRand(game.meteorRadiusMin, game.meteorRadiusMax)
  ) => {
    const angle = Math.random() * global.tau
    const speed = global.rangeRand(game.meteorMinSpeed, game.meteorMaxSpeed)
    const id = game.meteorLastId += 1
    if (x === null || y === null) {
      const edgePosition = global.randomEdgePosition()
      x = edgePosition.x
      y = edgePosition.y
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
      consumable: radius <= game.meteorRadiusConsumable
    }
  },
  splitMeteor: (state, meteor) => {
    const x = meteor.x
    const y = meteor.y
    const radius = meteor.radius / 2
    state.meteors.push(
      game.createMeteor(x, y, radius),
      game.createMeteor(x, y, radius)
    )
  }
}

module.exports = game
