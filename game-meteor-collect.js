const gameMeteorCollect = {
  drag: 0.955,
  topSpeed: 1 / 80,
  meteorRadiusMin: 1 / 100,
  meteorRadiusMax: 1 / 10,
  meteorRadiusConsumable: 1 / 50,
  meteorVolumeMax: 0.5,
  meteorCooldownDefault: 25,
  meteorCooldown: 25,
  meteorCount: 0,
  pointsSplit: 2,
  pointsCollect: 5,
  durationPlay: 30 * 100, // ticks are every 10ms
  activate: (players, state) => {
    Object.assign(
      state,
      {
        timer: 0,
        startCircle: null,
        meteors: []
      }
    )
    gameMeteorCollect.changeModeToIntro(players, state)
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.timer = gameMeteorCollect.durationPlay
    state.startCircle = global.activityCircle({y: 0.8})
    gameMeteorCollect.populateInitialMeteors(state)
    state.ships.forEach(ship => {
      ship.score = 0
      players[ship.id].lastActiveTime = now
    })
  },
  changeModeToPlay: (players, state) => {
    state.mode = 'play'
    state.startCircle = undefined
    gameMeteorCollect.populateInitialMeteors(state)
    state.ships.forEach(ship => {
      ship.score = 0
    })
    state.events.emit('start')
  },
  changeModeToScore: (players, state) => {
    global.totalPlayerScores(players, state)
  },
  tickGame: (now, players, state) => {
    if (state.mode !== 'score') {
      gameMeteorCollect.tickPlayers(now, players, state)
      gameMeteorCollect.tickMeteors(now, state)
      state.meteors = state.meteors.filter((meteor) => { return !meteor.expired })
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
        gameMeteorCollect.changeModeToPlay(players, state)
      }
    }
    if (state.mode === 'play') {
      state.timer -= 1
      if (state.timer <= 0) {
        gameMeteorCollect.changeModeToScore(players, state)
      }
    }
    if (state.mode === 'score') {
      global.animatePlayerScores(players, state)
    }
    return state
  },
  tickPlayers: (now, players, state) => {
    state.ships.forEach(ship => {
      let player = players[ship.id]
      ship.x += ship.xVel
      ship.y += ship.yVel
      global.wrap(ship)

      if (player.onTime !== null) {
        const timeDiff = now - player.onTime
        const accelerationRampUp = Math.min(1, timeDiff / 1000)
        ship.xVel = Math.cos(ship.angle) * player.force * accelerationRampUp * gameMeteorCollect.topSpeed
        ship.yVel = Math.sin(ship.angle) * player.force * accelerationRampUp * gameMeteorCollect.topSpeed
      } else {
        ship.xVel *= gameMeteorCollect.drag
        ship.yVel *= gameMeteorCollect.drag
      }
    })
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
        gameMeteorCollect.detectMeteorCollisions(state, meteor)
      }
    })
    gameMeteorCollect.generateMeteors(state)
  },
  detectMeteorCollisions: (state, meteor) => {
    state.ships.forEach(ship => {
      const hit = global.detectCollision(ship, meteor)
      if (hit) {
        ship.hit = ship.hit || hit
        meteor.expired = meteor.expired || hit
        if (meteor.consumable) {
          ship.score += gameMeteorCollect.pointsCollect
        } else {
          ship.score += gameMeteorCollect.pointsSplit
        }
      }
    })
    if (meteor.expired && !meteor.consumable) {
      gameMeteorCollect.splitMeteor(state, meteor)
    }
  },
  populateInitialMeteors: (state) => {
    state.meteors = []
    while (state.meteors.length < 10) {
      state.meteors.push(
        gameMeteorCollect.createMeteor()
      )
    }
  },
  generateMeteors: (state) => {
    if (gameMeteorCollect.currentMeteorVolume(state) < gameMeteorCollect.meteorVolumeMax && gameMeteorCollect.meteorCooldown <= 0) {
      state.meteors.push(gameMeteorCollect.createMeteor())
      gameMeteorCollect.meteorCooldown = gameMeteorCollect.meteorCooldownDefault
    } else {
      gameMeteorCollect.meteorCooldown -= 1
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
    radius = Math.max(gameMeteorCollect.meteorRadiusMax * Math.random(), gameMeteorCollect.meteorRadiusMin)
  ) => {
    const angle = Math.random() * global.tau
    const speed = Math.min((1 / 800), Math.random() * (1 / 600))
    const id = gameMeteorCollect.meteorCount += 1
    if (x === null || y === null) {
      const edgePostion = global.randomEdgePosition()
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
      consumable: radius <= gameMeteorCollect.meteorRadiusConsumable
    }
  },
  splitMeteor: (state, meteor) => {
    const x = meteor.x
    const y = meteor.y
    const radius = meteor.radius / 2
    state.meteors.push(
      gameMeteorCollect.createMeteor(x, y, radius),
      gameMeteorCollect.createMeteor(x, y, radius)
    )
  }
}

module.exports = gameMeteorCollect
