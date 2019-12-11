const inside = require('point-in-polygon')

const game = {
  durationPlay: 45 * global.ticksPerSecond, // ticks are every 10ms
  treasures: ['▲', '■', '⏺'],
  maxIngredients: 1,
  trackVertRadius: 0.20,
  trackVertCount: 12,
  trackObstacleSize: 1,
  treasureVertRadius: 0.3,
  maxPushSteps: 200,
  dragonVert: [0, 0.125],
  activate: (players, state) => {
    state.dragonOrder = {
      recipe: game.makeRandomRecipe(),
      time: 1,
      timer: -Math.floor(Math.random() * 100),
      state: 'in',
      x: game.dragonVert[0],
      y: game.dragonVert[1],
      radius: game.treasureVertRadius
    }
    state.track = {
      radius: game.trackVertRadius,
      staticRadius: game.treasureVertRadius,
      verts: [],
      innerPoly: [],
      outerPoly: [],
      polygons: [],
      isValid: false,
      meta: {
        quads: [],
        playerQuadBooleanStates: {},
        pushSteps: game.maxPushSteps
      }
    }
    game.changeModeToIntro(players, state)
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.timer = game.durationPlay
    state.startCircle = global.createActivityCircle({
      label: 'Start',
      y: 0,
      x: 0
    })
    state.ships.forEach(ship => {
      ship.score = 0
      ship.recipe = ''
      players[ship.id].lastActiveTime = now
    })

    game.createRandomTrackVerts(state)
  },
  createRandomTrackVerts: (state) => {
    const verts = []
    while (verts.length < game.trackVertCount) {
      const angle = (verts.length / game.trackVertCount) * global.tau
      const radius = global.rangeRand(
        0.2,
        1 - (game.trackVertRadius * 1.5)
      )
      verts.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ])
    }
    const treasureVerts = []
    while (treasureVerts.length < game.treasures.length) {
      const edgeVert = global.randomEdgePosition()
      treasureVerts.push([
        edgeVert.x,
        edgeVert.y
      ])
    }
    state.track.verts = verts
    state.track.treasureVerts = treasureVerts
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
  repelVertsFromEachother: (verts, velocities, radius, stepSize) => {
    const allButLast = verts.slice(0, -1)
    let anyCollisions = false
    allButLast.forEach((a, indexA) => {
      const subset = verts.slice(indexA + 1)
      subset.forEach((b, offset) => {
        const indexB = indexA + 1 + offset
        const comparison = game.comparePoints(a, b, radius)
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
    return anyCollisions
  },
  inflateTrack: (state) => {
    const stepSize = game.trackVertRadius / 100
    const verts = state.track.verts
    const treasureVerts = state.track.treasureVerts
    const pointVsTreasureVertRadius = game.trackVertRadius + game.treasureVertRadius
    const velocities = verts.map(() => [0, 0])
    const treasureVelocities = verts.map(() => [0, 0])
    let anyCollisions = false
    // move the points away from each other first
    anyCollisions = game.repelVertsFromEachother(
      verts,
      velocities,
      game.trackVertRadius * 2,
      stepSize
    ) || anyCollisions
    // move the treasures away from each other next
    anyCollisions = game.repelVertsFromEachother(
      treasureVerts,
      treasureVelocities,
      game.treasureVertRadius * 2,
      0.2
    ) || anyCollisions
    // now move the points away from the treasureVerts
    const bigVerts = treasureVerts.slice()
    bigVerts.push(game.dragonVert)
    bigVerts.forEach((treasureVert, offset) => {
      verts.forEach((vert, offset) => {
        const comparison = game.comparePoints(
          vert,
          treasureVert,
          pointVsTreasureVertRadius
        )
        if (comparison.hit) {
          anyCollisions = true
          const velocity = [
            Math.cos(comparison.angle) * stepSize * 2,
            Math.sin(comparison.angle) * stepSize * 2
          ]
          velocities[offset][0] += velocity[0]
          velocities[offset][1] += velocity[1]
        }
      })
    })
    const boundMin = -1 + game.trackVertRadius
    const boundMax = 1 - game.trackVertRadius
    state.track.verts = verts.map((a, index) => {
      return [
        global.bound(
          boundMin,
          boundMax,
          a[0] + velocities[index][0]
        ),
        global.bound(
          boundMin,
          boundMax,
          a[1] + velocities[index][1]
        )
      ]
    })
    state.track.treasureVerts = treasureVerts.map((a, index) => {
      return [
        global.bound(
          -1,
          1,
          a[0] + treasureVelocities[index][0]
        ),
        global.bound(
          -1,
          1,
          a[1] + treasureVelocities[index][1]
        )
      ]
    })
    game.centerTrackVerts(state)
    game.findTrackVertTangents(state)
    if (state.track.meta.pushSteps > 1) {
      state.track.meta.pushSteps -= 0.5
    } else {
      anyCollisions = false
    }
    if (!anyCollisions) {
      state.track.isValid = true
      game.putShipsAtStart(state)
      game.makeObstacles(state)
      game.populateTreasures(state)
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
  makeObstacles: (state) => {
    for (
      let i = 0;
      i < (state.track.innerPoly.length - game.trackObstacleSize);
      i += game.trackObstacleSize + 1
    ) {
      let poly = []
      for (let j = 0; j < game.trackObstacleSize + 1; j += 1) {
        poly.push(state.track.innerPoly[i + j])
        poly.unshift(state.track.outerPoly[i + j])
      }
      state.track.polygons.push(poly)
    }
    delete state.track.innerPoly
    delete state.track.outerPoly
  },
  changeModeToPlay: (players, state) => {
    state.mode = 'play'
    state.startCircle = undefined
    state.ships.forEach(ship => {
      ship.score = 0
      ship.recipe = ''
    })
    state.events.emit('start')
  },
  populateTreasures (state) {
    let radius = 0.05
    state.parts = state.track.treasureVerts.map((vert, index) => {
      return {
        type: game.treasures[index],
        x: vert[0],
        y: vert[1],
        radius
      }
    })
  },
  changeModeToScore: (players, state) => {
    delete state.parts
    delete state.track
    delete state.dragonOrder
    state.ships.forEach(ship => {
      delete ship.recipe
    })
    global.totalPlayerScores(players, state)
  },
  comparePoints: (a, b, radius) => {
    const diffX = a[0] - b[0]
    const diffY = a[1] - b[1]
    const distance = global.getLength(diffX, diffY)
    return {
      hit: distance < radius,
      angle: Math.atan2(diffY, diffX)
    }
  },
  tickGame: (now, players, state) => {
    if (state.mode === 'intro') {
      if (!state.track.isValid) {
        game.inflateTrack(state)
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
    if (
      state.mode !== 'score' &&
      state.track.isValid
    ) {
      global.tickPlayers(now, players, state)
      game.tickOrders(now, players, state)
      game.testPlayersAgainstTrackPolygons(state)
      game.checkCollisions(now, players, state)
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
  testPlayersAgainstTrackPolygons (state) {
    state.ships.forEach((ship) => {
      const shipVert = [ship.x, ship.y]
      let positionValid = true
      state.track.polygons.forEach((poly) => {
        positionValid = positionValid && !inside(shipVert, poly)
      })
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
  makeRandomRecipe: () => {
    const index = Math.floor(global.rangeRand(0, game.treasures.length))
    return game.treasures[index]
  },
  orderChangeTime: 50,
  orderWaitTime: 2000,
  orderYIn: -0.25,
  orderYOut: -1.25,
  dragonStateHandlerMap: {
    in: (order) => {
      const frac = order.timer / game.orderChangeTime
      order.y = global.lerp(game.orderYOut, game.orderYIn, frac)
      if (order.timer > game.orderChangeTime) {
        order.state = 'waiting'
        order.timer = 0
        order.time = 1
      } else {
        order.timer += 1
      }
    },
    out: (order) => {
      const frac = order.timer / game.orderChangeTime
      order.y = global.lerp(game.orderYIn, game.orderYOut, frac)
      if (order.timer > game.orderChangeTime) {
        order.state = 'in'
        order.timer = Math.floor(global.rangeRand(-300, 0))
        order.time = 1
        order.served = false
        order.recipe = game.makeRandomRecipe()
      } else {
        order.timer += 1
      }
    },
    waiting: (order) => {
      const wait = game.orderWaitTime * order.recipe.length
      order.time = order.timer / wait
      if (
        order.served ||
        order.timer > wait
      ) {
        order.state = 'out'
        order.timer = 0
      } else {
        order.timer += 1
      }
    }
  },
  tickOrders (now, players, state) {
    game.dragonStateHandlerMap[state.dragonOrder.state](state.dragonOrder)
  },
  checkCollisions: (now, players, state) => {
    state.parts.forEach((item) => {
      delete item.hit
    })
    state.ships.forEach(ship => {
      let hitThisFrame = false
      if (!ship.recipe) {
        ship.recipe = ''
      }
      // test collision with ingredients
      for (let i = 0; !hitThisFrame && (i < state.parts.length); i++) {
        const ingredient = state.parts[i]
        if (
          global.detectCollision(ingredient, ship)
        ) {
          hitThisFrame = true
          ingredient.hit = true
          if (!ship.meta.ingredientHit) {
            ship.recipe = ingredient.type
          }
        }
      }
      // test collision with orders
      if (
        !hitThisFrame &&
        ship.recipe.length > 0
      ) {
        const order = state.dragonOrder
        if (
          order.state === 'waiting' &&
          ship.recipe === order.recipe &&
          global.detectCollision(order, ship)
        ) {
          ship.recipe = ''
          ship.score += order.recipe.length
          hitThisFrame = true
        }
      }
      ship.meta.ingredientHit = hitThisFrame
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
