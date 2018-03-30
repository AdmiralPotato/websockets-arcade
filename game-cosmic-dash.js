const inside = require('point-in-polygon')

const game = {
  trackVertRadius: 0.2,
  durationPlay: 3000,
  activate: (players, state) => {
    Object.assign(
      state,
      {
        track: {
          radius: game.trackVertRadius,
          verts: [],
          innerPoly: [],
          outerPoly: [],
          tangentPoints: [],
          isValid: false,
          meta: {
            quads: [],
            playerQuadBooleanStates: {}
          }
        }
      }
    )
    game.changeModeToIntro(players, state)
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
      radius: game.trackVertRadius,
      ticksToActivate: 300
    })
    game.createRandomTrackVerts(state)
  },
  changeModeToPlay: (players, state) => {
    delete state.startCircle
    state.mode = 'play'
    state.track.meta.playerQuadBooleanStates = {}
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
    const count = 12
    const verts = []
    while (verts.length < count) {
      const angle = (verts.length / count) * global.tau
      const radius = global.rangeRand(
        0.2,
        1 - (game.trackVertRadius * 1.5)
      )
      verts.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ])
    }
    state.track.verts = verts
    game.centerTrackVerts(state)
  },
  centerTrackVerts: (state) => {
    const verts = state.track.verts
    const bounds = {
      xMin: verts[0][0],
      yMin: verts[0][0],
      xMax: verts[0][1],
      yMax: verts[0][1]
    }
    verts.forEach((a) => {
      bounds.xMin = Math.min(a[0], bounds.xMin)
      bounds.xMax = Math.max(a[0], bounds.xMax)
      bounds.yMin = Math.min(a[1], bounds.yMin)
      bounds.yMax = Math.max(a[1], bounds.yMax)
    })
    const centerX = 0 - global.lerp(bounds.xMin, bounds.xMax, 0.5)
    const centerY = 0 - global.lerp(bounds.yMin, bounds.yMax, 0.5)
    state.track.verts = verts.map((a) => {
      return [
        a[0] + centerX,
        a[1] + centerY
      ]
    })
  },
  inflateTrack: (state) => {
    const verts = state.track.verts
    const stepSize = game.trackVertRadius / 200
    const allButLast = verts.slice(0, -1)
    const velocities = verts.map(() => [0, 0])
    let anyCollisions = false
    allButLast.forEach((a, indexA) => {
      const subset = verts.slice(indexA + 1)
      subset.forEach((b, offset) => {
        const indexB = indexA + 1 + offset
        const comparison = game.comparePoints(a, b)
        if (comparison.hit) {
          anyCollisions = true
          const velocity = [
            Math.cos(comparison.angle) * stepSize,
            Math.sin(comparison.angle) * stepSize
          ]
          velocities[indexA][0] += velocity[0]
          velocities[indexA][1] += velocity[1]
          velocities[indexB][0] += -velocity[0]
          velocities[indexB][1] += -velocity[1]
        }
      })
    })
    state.track.verts = verts.map((a, index) => {
      return [
        a[0] + velocities[index][0],
        a[1] + velocities[index][1]
      ]
    })
    game.centerTrackVerts(state)
    game.findTrackVertTangents(state)
    if (!anyCollisions) {
      state.track.isValid = true
      game.createQuads(state)
      game.putShipsAtStart(state)
    }
  },
  findTrackVertTangents: (state) => {
    const track = state.track
    const innerPoly = []
    const outerPoly = []
    const length = track.verts.length
    track.verts.forEach((b, index, array) => {
      const set = [
        (index + length - 1) % length,
        index,
        (index + length + 1) % length
      ]
      const a = array[set[0]]
      const c = array[set[2]]
      const abAngle = Math.atan2(
        b[1] - a[1],
        b[0] - a[0]
      )
      const cbAngle = Math.atan2(
        b[1] - c[1],
        b[0] - c[0]
      )
      const tangentAngle = ((((cbAngle - abAngle) * 0.5) + abAngle) + global.tau) % global.tau
      const tangentVert = [
        Math.cos(tangentAngle) * game.trackVertRadius,
        Math.sin(tangentAngle) * game.trackVertRadius
      ]

      const tangentVertA = [
        b[0] + tangentVert[0],
        b[1] + tangentVert[1]
      ]
      const tangentVertB = [
        b[0] - tangentVert[0],
        b[1] - tangentVert[1]
      ]
      let vA = tangentVertA
      let vB = tangentVertB
      if (inside(tangentVertA, track.verts)) {
        vA = tangentVertB
        vB = tangentVertA
      }
      outerPoly.push(vA)
      innerPoly.push(vB)
    })
    state.track.innerPoly = innerPoly
    state.track.outerPoly = outerPoly
  },
  createQuads: (state) => {
    state.track.meta.quads = state.track.verts.map((vert, index) => {
      return game.createQuadByIndices(
        index,
        (index + 1) % state.track.verts.length,
        state
      )
    })
  },
  createQuadByIndices: (indexA, indexB, state) => {
    return [
      state.track.innerPoly[indexA],
      state.track.innerPoly[indexB],
      state.track.outerPoly[indexB],
      state.track.outerPoly[indexA]
    ]
  },
  comparePoints: (a, b) => {
    const diffX = a[0] - b[0]
    const diffY = a[1] - b[1]
    const distance = global.getLength(diffX, diffY)
    return {
      hit: distance < (game.trackVertRadius * 2),
      angle: Math.atan2(diffY, diffX)
    }
  },
  tickGame: (now, players, state) => {
    if (state.mode === 'intro') {
      if (!state.track.isValid) {
        game.inflateTrack(state)
        state.startCircle.x = state.track.verts[3][0]
        state.startCircle.y = state.track.verts[3][1]
      } else {
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
    }
    if (state.mode !== 'score') {
      global.tickPlayers(now, players, state)
      game.testPlayersAgainstTrackBounds(state)
      if (state.track.isValid) {
        game.testPlayersAgainstTrackQuads(state)
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
  testPlayersAgainstTrackBounds (state) {
    state.ships.forEach((ship) => {
      const shipVert = [ship.x, ship.y]
      const insideOuterPoly = inside(shipVert, state.track.outerPoly)
      const outsideInnerPoly = !inside(shipVert, state.track.innerPoly)
      const positionValid = insideOuterPoly && outsideInnerPoly
      if (!positionValid) {
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
  testPlayersAgainstTrackQuads: (state) => {
    const quads = state.track.meta.quads
    const quadPlayerMap = state.track.meta.playerQuadBooleanStates
    state.ships.forEach((ship) => {
      let playerState = (
        quadPlayerMap[ship.id] ||
        quads.map(() => false)
      )
      let pointsThisLap = 0
      let lastQuad = 0
      playerState.forEach((playerHasBeenToThisQuadThisLap, index) => {
        if (
          !playerHasBeenToThisQuadThisLap &&
          inside([ship.x, ship.y], quads[index])
        ) {
          playerHasBeenToThisQuadThisLap = playerState[index] = true
          ship.score += 1
          lastQuad = index
        }
        if (playerHasBeenToThisQuadThisLap) {
          pointsThisLap += 1
        }
      })
      if (pointsThisLap === quads.length) {
        playerState = quads.map(() => false)
        playerState[lastQuad] = true
      }
      quadPlayerMap[ship.id] = playerState
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
