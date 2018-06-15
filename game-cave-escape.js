const inside = require('point-in-polygon')

const game = {
  segmentsPerScreenWidth: 5,
  segmentsPerSecond: 1,
  caveHeightMin: -0.7,
  caveHeightMax: 0.7,
  caveRadiusMin: 0.2,
  caveRadiusMax: 0.5,
  lavaWaveVertCount: 20,
  lavaWaveFreq: 0.75 * global.tau,
  lavaWaveFreq2: 1.5 * global.tau,
  lavaWaveFreq3: 3 * global.tau,
  lavaWaveSpeed: -1000,
  lavaWaveDepth: 0.1,
  lavaWaveOffset: -0.6,
  distanceToLavaWaveScoreMultiplier: 0.2,
  distanceToLavaWaveScoreFalloff: 1.2,
  starMin: 30,
  starMinRadius: 0.005,
  starMaxRadius: 0.01,
  durationPlay: 30 * global.ticksPerSecond, // ticks are every 10ms
  activate: (players, state) => {
    Object.assign(
      state,
      {
        stars: [],
        track: {
          walls: []
        },
        lavaWave: [],
        meta: {
          tick: 0,
          verts: [],
          radii: [],
          walls: [],
          scroll: [0, 0],
          wholeTrack: [],
          lavaWaveVerts: [],
          lavaWaveBackPoints: [
            [-1, 1],
            [-1, -1]
          ]
        }
      }
    )
    game.changeModeToIntro(players, state)
    game.populateInitialStars(state)
  },
  populateInitialStars: (state) => {
    while (state.stars.length < game.starMin) {
      state.stars.push(game.createStar(state))
    }
  },
  createStar: (state) => {
    const radius = global.rangeRand(
      game.starMinRadius,
      game.starMaxRadius
    )
    return {
      id: state.stars.length,
      x: global.rangeRand(-1, 1),
      y: global.rangeRand(-1, 1),
      yVel: 0,
      xVel: radius * -0.4,
      radius: radius
    }
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.ships.forEach(ship => {
      ship.meta.score = 0
      ship.score = 0
      players[ship.id].lastActiveTime = now
    })
    state.startCircle = global.createActivityCircle({
      label: 'Start',
      radius: 0.2,
      ticksToActivate: 3 * global.ticksPerSecond
    })
    game.createRandomTrackVerts(state)
    game.createLavaWave(state)
  },
  changeModeToPlay: (players, state) => {
    delete state.startCircle
    state.mode = 'play'
    state.timer = game.durationPlay
    state.ships.forEach(ship => {
      ship.meta.score = 0
      ship.score = 0
    })
    state.events.emit('start')
  },
  changeModeToScore: (players, state) => {
    delete state.track
    global.totalPlayerScores(players, state)
  },
  createRandomTrackVerts: (state) => {
    const segmentSpacing = global.screenWidth / game.segmentsPerScreenWidth
    const secondsOfPlay = game.durationPlay / global.ticksPerSecond
    const countSegmentsScreenWillPanOver = game.segmentsPerSecond * secondsOfPlay
    const count = countSegmentsScreenWillPanOver + game.segmentsPerScreenWidth
    let verts = []
    let radii = []
    while (verts.length < count) {
      const i = verts.length
      const radius = global.rangeRand(game.caveRadiusMin, game.caveRadiusMax)
      const minYForThisRadius = game.caveHeightMin + radius
      const maxYForThisRadius = game.caveHeightMax - radius
      const x = segmentSpacing * i
      verts.push([
        x,
        global.rangeRand(minYForThisRadius, maxYForThisRadius)
      ])
      radii.push(radius)
    }
    state.meta.verts = verts
    state.meta.radii = radii
    game.makeCaveWallsFromVerts(state)
  },
  makeCaveWallsFromVerts: (state) => {
    let verts = state.meta.verts.slice()
    let radii = state.meta.radii.slice()
    const topWall = verts.map((item, index) => {
      const radius = radii[index]
      return [
        item[0],
        item[1] - radius
      ]
    })
    radii = radii.reverse()
    const bottomWall = verts.reverse().map((item, index) => {
      const radius = radii[index]
      return [
        item[0],
        item[1] + radius
      ]
    })
    state.meta.walls = [].concat(topWall, bottomWall)
  },
  createLavaWave: (state) => {
    while (state.meta.lavaWaveVerts.length <= game.lavaWaveVertCount) {
      const frac = state.meta.lavaWaveVerts.length / game.lavaWaveVertCount
      const y = global.mapRange(0, 1, -1, 1, frac)
      const x = game.getLavaWaveXFromYAndTick(y, state.meta.tick)
      state.meta.lavaWaveVerts.push([x, y])
    }
  },
  getLavaWaveXFromYAndTick: (y, tick) => {
    const frac = global.mapRange(-1, 1, 0, 1, y)
    return ((
      Math.sin((frac + (tick / game.lavaWaveSpeed)) * game.lavaWaveFreq) +
      Math.sin((frac + (tick / game.lavaWaveSpeed)) * game.lavaWaveFreq2) +
      Math.sin((frac + (tick / game.lavaWaveSpeed)) * game.lavaWaveFreq3)
    ) * game.lavaWaveDepth) + game.lavaWaveOffset
  },
  tickGame: (now, players, state) => {
    if (state.mode === 'intro') {
      const startGame = global.circleSelectCountdown(
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
    if (state.mode !== 'score') {
      game.tickCameraScroll(now, players, state)
      game.tickLavaWave(now, players, state)
      global.tickPlayers(now, players, state, {noWrap: true})
      game.tickPlayerScores(now, players, state)
      game.testPlayersAgainstCaveBounds(state)
      game.testPlayersAgainstLavaBounds(state)
      game.tickStars(now, state)
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
    state.meta.tick += 1
    if (state.meta.tick >= game.durationPlay) {
      state.meta.tick = 0
    }
    return state
  },
  tickCameraScroll: (now, players, state) => {
    const segmentSpacing = global.screenWidth / game.segmentsPerScreenWidth
    const seconds = state.meta.tick / global.ticksPerSecond
    const shipPushback = (segmentSpacing / global.ticksPerSecond) * game.segmentsPerSecond
    state.meta.scroll[0] = -segmentSpacing * seconds * game.segmentsPerSecond
    state.track.verts = state.meta.verts.map((item) => {
      return [
        item[0] + state.meta.scroll[0],
        item[1] + state.meta.scroll[1]
      ]
    })
    state.track.walls = state.meta.walls.map((item) => {
      return [
        item[0] + state.meta.scroll[0],
        item[1] + state.meta.scroll[1]
      ]
    })
    state.ships.forEach(ship => {
      ship.x -= shipPushback
    })
  },
  tickLavaWave: (now, players, state) => {
    state.meta.lavaWaveVerts.forEach((item) => {
      item[0] = game.getLavaWaveXFromYAndTick(
        item[1],
        state.meta.tick
      )
    })
    state.lavaWave = state.meta.lavaWaveVerts.concat(state.meta.lavaWaveBackPoints)
  },
  tickPlayerScores: (now, players, state) => {
    state.ships.forEach((ship) => {
      if (!ship.hit) {
        const lavaWavePositionAtShipY = game.getLavaWaveXFromYAndTick(
          ship.y,
          state.meta.tick
        )
        const distanceFromLavaWave = Math.abs(ship.x - lavaWavePositionAtShipY)
        const scoreFrac = global.mapRange(0, game.distanceToLavaWaveScoreFalloff, 1, 0, distanceFromLavaWave)
        ship.meta.score += scoreFrac * game.distanceToLavaWaveScoreMultiplier
        ship.score = ship.meta.score.toFixed(1)
      }
    })
  },
  testPlayersAgainstCaveBounds: (state) => {
    state.ships.forEach((ship) => {
      const shipVert = [ship.x, ship.y]
      const isShipInsideCavePoly = inside(shipVert, state.track.walls)
      if (!isShipInsideCavePoly) {
        if (!ship.outCount) {
          ship.xVel *= -1
          ship.yVel *= -1
          ship.x += ship.xVel
          ship.y += ship.yVel
          ship.hit = true
          ship.outCount = (ship.outCount || 0) + 1
        } else {
          const safePoint = game.findSafePoint(state)
          ship.x = safePoint[0]
          ship.y = safePoint[1]
          ship.xVel = 0
          ship.yVel = 0
        }
      } else {
        delete ship.outCount
      }
    })
  },
  testPlayersAgainstLavaBounds: (state) => {
    state.ships.forEach((ship) => {
      const shipVert = [ship.x, ship.y]
      const isShipInsideLavaPoly = inside(shipVert, state.lavaWave)
      if (isShipInsideLavaPoly) {
        ship.xVel = 0.05
        ship.yVel *= -1
        ship.x += ship.xVel
        ship.y += ship.yVel
        ship.hit = true
        ship.outCount = (ship.outCount || 0) + 1
      }
    })
  },
  findSafePoint: (state) => {
    const scrollX = (0 - state.meta.scroll[0]) + 0.5
    let smallestDistance = state.meta.verts[state.meta.verts.length - 1][0]
    let closestXIndex = 0
    state.meta.verts.forEach((item, index) => {
      const x = item[0]
      const distance = Math.abs(scrollX - x)
      if (distance < smallestDistance) {
        smallestDistance = distance
        closestXIndex = index
      }
    })
    return state.track.verts[closestXIndex]
  },
  tickStars: (now, state) => {
    state.stars.forEach(item => {
      item.x += item.xVel
      item.y += item.yVel
      global.wrap(item)
    })
  },
  putShipsAtStart: (state) => {
    const a = state.track.outerPoly[3]
    const b = state.track.innerPoly[3]
    state.ships.forEach((ship, index) => {
      const frac = (index + 0.5) / state.ships.length
      const closer = global.mapRange(0, 1, 0.2, 0.8, frac)
      ship.x = global.lerp(a[0], b[0], closer) - 0.05
      ship.y = global.lerp(a[1], b[1], closer)
    })
  }
}

module.exports = game
