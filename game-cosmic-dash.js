const inside = require('point-in-polygon')

const game = {
  trackVertRadius: 0.2,
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
          isValid: false
        }
      }
    )
    game.changeModeToIntro(players, state)
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.ships.forEach(ship => {
      ship.score = ''
      players[ship.id].lastActiveTime = now
    })
    game.createRandomTrackVerts(state)
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
  },
  inflateTrack: (state) => {
    const verts = state.track.verts
    const stepSize = game.trackVertRadius / 100
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
    // console.table(comparisons)
    // console.table(velocities)
    game.findTrackVertTangents(state)
    if (!anyCollisions) {
      state.track.isValid = true
      game.putPlayersAtStart(state)
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
  comparePoints: (a, b) => {
    const diffX = a[0] - b[0]
    const diffY = a[1] - b[1]
    const distance = Math.sqrt((diffX * diffX) + (diffY * diffY))
    return {
      hit: distance < (game.trackVertRadius * 2),
      angle: Math.atan2(diffY, diffX)
    }
  },
  tickGame: (now, players, state) => {
    global.tickPlayers(now, players, state)
    if (state.mode === 'intro') {
      if (!state.track.isValid) {
        game.inflateTrack(state)
      } else {
        if (!state.startCircle) {
          state.startCircle = global.createActivityCircle({
            x: state.track.verts[3][0],
            y: state.track.verts[3][1],
            ticksToActivate: 300
          })
        }
        game.checkIfPlayersOutOfBounds(state)
        let startGame = global.circleSelectCountdown(
          now,
          state.startCircle,
          players,
          state,
          true
        )
        if (startGame) {
          delete state.track
          delete state.startCircle
          state.events.emit('end', 'cosmic-dash')
          // game.changeModeToPlay(players, state)
        }
      }
    }
    return state
  },
  checkIfPlayersOutOfBounds (state) {
    state.ships.forEach((ship) => {
      const shipVert = [ship.x, ship.y]
      const insideOuterPoly = inside(shipVert, state.track.outerPoly)
      const outsideInnerPoly = !inside(shipVert, state.track.innerPoly)
      const positionValid = insideOuterPoly && outsideInnerPoly
      if (!positionValid) {
        ship.xVel *= -2
        ship.yVel *= -2
        ship.x += ship.xVel
        ship.y += ship.yVel
        global.wrap(ship)
      }
    })
  },
  putPlayersAtStart: (state) => {
    state.ships.forEach((ship) => {
      ship.x = state.track.verts[3][0]
      ship.y = state.track.verts[3][1]
    })
  },
  putPlayersAtStartBetterForLaterWhenIHaveTimeToFigureOutWhatIDidWrong: (state) => {
    const radius = global.activityCircleDefaults.radius
    const radiusFrac = radius / game.trackVertRadius
    const a = state.track.outerPoly[3]
    const b = state.track.innerPoly[3]
    const abDiff = [
      a[0] - b[0],
      a[1] - b[1]
    ]
    const c = [
      a[0] + (abDiff[0] * (1 - radiusFrac)),
      a[1] + (abDiff[1] * (1 - radiusFrac))
    ]
    const d = [
      a[0] + (abDiff[0] * radiusFrac),
      a[1] + (abDiff[1] * radiusFrac)
    ]
    const cdDiff = [
      c[0] - d[0],
      c[1] - d[1]
    ]
    state.ships.forEach((ship, index) => {
      const frac = state.ships.length / index
      ship.x = c[0] + (cdDiff[0] * frac)
      ship.y = c[1] + (cdDiff[1] * frac)
    })
  }
}

module.exports = game
