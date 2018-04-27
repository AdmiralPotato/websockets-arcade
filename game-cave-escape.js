const inside = require('point-in-polygon')

const game = {
  segmentsPerScreenWidth: 5,
  segmentsPerSecond: 1,
  caveHeightMin: -0.7,
  caveHeightMax: 0.7,
  caveRadiusMin: 0.2,
  caveRadiusMax: 0.5,
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
        meta: {
          tick: 0,
          verts: [],
          radii: [],
          walls: [],
          scroll: [0, 0],
          wholeTrack: []
        }
      }
    )
    game.changeModeToIntro(players, state)
    game.populateInitialStars(state)
  },
  populateInitialStars: (state) => {
    while (state.stars.length < game.starMin) {
      state.stars.push(game.createStar())
    }
  },
  createStar: () => {
    const radius = global.rangeRand(
      game.starMinRadius,
      game.starMaxRadius
    )
    return {
      id: 0,
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
      ship.score = 0
      players[ship.id].lastActiveTime = now
    })
    state.startCircle = global.createActivityCircle({
      label: 'Start',
      radius: 0.2,
      ticksToActivate: 3 * global.ticksPerSecond
    })
    game.createRandomTrackVerts(state)
  },
  changeModeToPlay: (players, state) => {
    delete state.startCircle
    state.mode = 'play'
    state.timer = game.durationPlay
    state.ships.forEach(ship => {
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
  tickGame: (now, players, state) => {
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
      global.tickPlayers(now, players, state, {noWrap: true})
      game.testPlayersAgainstTrackBounds(state)
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
  testPlayersAgainstTrackBounds (state) {
    state.ships.forEach((ship) => {
      const shipVert = [ship.x, ship.y]
      const insideTrackPoly = inside(shipVert, state.track.walls)
      if (!insideTrackPoly) {
        if (!ship.outCount) {
          ship.xVel *= -1
          ship.yVel *= -1
          ship.x += ship.xVel
          ship.y += ship.yVel
          ship.hit = true
          ship.outCount = (ship.outCount || 0) + 1
        } else {
          ship.x = state.track.verts[3][0]
          ship.y = state.track.verts[3][1]
          ship.xVel = 0
          ship.yVel = 0
        }
      } else {
        delete ship.outCount
      }
    })
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
