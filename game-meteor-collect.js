const durationScore = 15 * 100 // Score display time = 15s
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
  durationScore: durationScore,
  durationScoreA: 0.95 * durationScore,
  durationScoreB: 0.85 * durationScore,
  durationScoreC: 0.45 * durationScore,
  durationScoreD: 0.4 * durationScore,
  shipStateInitial: [],
  shipStateA: [],
  shipStateC: [],
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
  },
  changeModeToScore: (players, state) => {
    state.mode = 'score'
    state.timer = gameMeteorCollect.durationScore
    state.meteors = []
    let highScore = 0
    let shipCount = state.ships.length
    let scores = []
    state.ships.forEach((ship, index) => {
      highScore = Math.max(highScore, ship.score)
      scores[index] = ship.score
      ship.score = 0
    })
    gameMeteorCollect.shipStateInitial = JSON.parse(JSON.stringify(state.ships))
    gameMeteorCollect.shipStateA = JSON.parse(JSON.stringify(gameMeteorCollect.shipStateInitial))
    gameMeteorCollect.shipStateA.forEach((ship, index) => {
      ship.score = 0
      ship.x = (((index + 0.5) / shipCount) - 0.5) * (0.8 * 2)
      ship.y = 0.8
    })
    gameMeteorCollect.shipStateC = JSON.parse(JSON.stringify(gameMeteorCollect.shipStateA))
    const mapY = (score) => {
      return 0.8 - (score / highScore)
    }
    const yMax = mapY(highScore)
    gameMeteorCollect.shipStateC.forEach((ship, index) => {
      ship.score = scores[index]
      ship.scoreMax = highScore
      ship.y = mapY(ship.score)
      ship.yMax = yMax
    })
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
      state.timer -= 1
      if (state.timer <= 0) {
        // game.startTheGameWithSomeFakePlayersForTesting()
        gameMeteorCollect.changeModeToIntro(players, state)
      } else if (state.timer >= gameMeteorCollect.durationScoreA) {
        let diff = state.timer - gameMeteorCollect.durationScoreA
        let total = gameMeteorCollect.durationScore - gameMeteorCollect.durationScoreA
        let progress = 1 - (diff / total)
        gameMeteorCollect.lerpShips(state, gameMeteorCollect.shipStateInitial, gameMeteorCollect.shipStateA, progress)
      } else if (state.timer >= gameMeteorCollect.durationScoreB) {
        // just a pause
      } else if (state.timer >= gameMeteorCollect.durationScoreC) {
        let diff = state.timer - gameMeteorCollect.durationScoreC
        let total = gameMeteorCollect.durationScoreB - gameMeteorCollect.durationScoreC
        let progress = 1 - (diff / total)
        gameMeteorCollect.lerpShips(state, gameMeteorCollect.shipStateA, gameMeteorCollect.shipStateC, progress)
      } else if (state.timer <= gameMeteorCollect.durationScoreD) {
        const blink = Math.floor((state.timer % 100) / 50) < 1
        state.ships.forEach((ship, index) => {
          const sourceData = gameMeteorCollect.shipStateC[index]
          if (sourceData) {
            const status = sourceData.score === sourceData.scoreMax ? 'Winner!' : 'Loser!'
            ship.score = blink ? status : ''
          }
        })
      }
    }
    return state
  },
  lerpShips: (state, startState, targetState, progress) => {
    state.ships.forEach((ship, index) => {
      const a = startState[index]
      const b = targetState[index]
      if (a !== undefined && b !== undefined) {
        gameMeteorCollect.lerpShip(ship, a, b, progress)
      }
    })
  },
  lerpShip: (target, a, b, progress) => {
    target.x = global.lerp(a.x, b.x, progress)
    if (b.yMax === undefined) {
      target.y = global.lerp(a.y, b.y, progress)
      target.score = Math.floor(global.lerp(a.score, b.score, progress))
    } else {
      target.y = Math.max(b.y, global.lerp(a.y, b.yMax, progress))
      target.score = Math.min(b.score, Math.floor(global.lerp(a.score, b.scoreMax, progress)))
    }
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
