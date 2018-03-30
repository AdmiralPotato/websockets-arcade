global.tau = Math.PI * 2
global.arrayRemove = function (array, item) {
  let index
  while ((index = array.indexOf(item)) !== -1) {
    array.splice(index, 1)
  }
  return array
}
global.rangeRand = (min, max) => {
  const diff = max - min
  return min + (diff * Math.random())
}
global.mapRange = (a, b, x, y, valueAB) => {
  const diff0 = a - b
  const diff1 = x - y
  const valueDiff = (valueAB - b) / diff0
  return y + (valueDiff * diff1)
}
global.bound = (min, max, value) => {
  return Math.min(max, Math.max(min, value))
}
global.detectCollision = (a, b) => {
  return global.getDistance(a, b) < a.radius + b.radius
}
global.getDistance = (a, b) => {
  const diffX = a.x - b.x
  const diffY = a.y - b.y
  return global.getLength(diffX, diffY)
}
global.getLength = (x, y) => { return Math.sqrt((x * x) + (y * y)) }
global.wrap = (target) => {
  target.x = (Math.abs(target.x) > 1 ? -1 * Math.sign(target.x) : target.x) || 0
  target.y = (Math.abs(target.y) > 1 ? -1 * Math.sign(target.y) : target.y) || 0
}
global.randomEdgePosition = () => {
  const angle = Math.random() * global.tau
  const radius = 2
  return {
    x: global.bound(-1, 1, Math.cos(angle) * radius),
    y: global.bound(-1, 1, Math.sin(angle) * radius)
  }
}
global.lerp = (a, b, progress) => {
  return a + ((b - a) * progress)
}
global.shipDrag = 0.955
global.shipMaxSpeed = 1 / 80
global.playerMaxForceAddedPerFrame = 1 / 2000
global.tickPlayers = (now, players, state) => {
  state.ships.forEach(ship => {
    let player = players[ship.id]

    ship.xVel *= global.shipDrag
    ship.yVel *= global.shipDrag

    if (player.onTime !== null && !ship.hit) {
      const timeDiff = now - player.onTime
      const accelerationRampUp = Math.min(1, timeDiff / 1000)
      const playerAddedForce = player.force * accelerationRampUp * global.playerMaxForceAddedPerFrame
      const xVel = ship.xVel + Math.cos(player.angle) * playerAddedForce
      const yVel = ship.yVel + Math.sin(player.angle) * playerAddedForce
      ship.angle = Math.atan2(yVel, xVel)
      ship.force = Math.min(global.getLength(xVel, yVel), global.shipMaxSpeed)
      ship.xVel = Math.cos(ship.angle) * ship.force
      ship.yVel = Math.sin(ship.angle) * ship.force
    } else {
      ship.force = global.getLength(ship.xVel, ship.yVel)
      if (ship.hit && (ship.force < 0.001)) {
        if (player.onTime !== null) {
          player.onTime = now
        }
        delete ship.hit
      }
    }

    ship.x += ship.xVel
    ship.y += ship.yVel
    global.wrap(ship)
  })
}
global.activityCircleDefaults = {
  x: 0,
  y: 0,
  frac: 0,
  radius: 1 / 8,
  hue: 0,
  sec: 0,
  tick: 0,
  ticksToActivate: 300
}
global.createActivityCircle = (config) => {
  return Object.assign({}, global.activityCircleDefaults, config)
}
global.playersInCircle = (circle, players, state) => {
  const result = {
    in: [],
    out: []
  }
  state.ships.forEach((ship) => {
    const inCircle = global.detectCollision(ship, circle)
    const player = players[ship.id]
    const destination = inCircle ? 'in' : 'out'
    result[destination].push(player)
  })
  return result
}
global.durationInactivityBoot = 10 * 1000 // time in ms
global.circleSelectCountdown = (now, circle, players, state, bootIfInactive) => {
  const playerCircleStates = global.playersInCircle(circle, players, state)
  const readyPlayerCount = playerCircleStates.in.length
  const allPlayersReady = readyPlayerCount && readyPlayerCount === state.ships.length
  let activate = false
  if (!allPlayersReady && bootIfInactive) {
    playerCircleStates.out.forEach((player) => {
      if (now - player.lastActiveTime > global.durationInactivityBoot) {
        player.needsBooting = true
      }
    })
  }
  if (allPlayersReady) {
    global.tickCircle(circle, circle.tick + 1)
    activate = circle.tick >= circle.ticksToActivate
    if (activate) {
      setTimeout(() => { global.tickCircle(circle, 0) }, 200)
    }
  } else {
    global.tickCircle(circle, Math.max(0, circle.tick - 1))
  }
  return activate
}
global.tickCircle = (circle, tick = circle.tick) => {
  circle.tick = tick
  circle.frac = circle.tick / circle.ticksToActivate
  circle.sec = circle.frac ? parseFloat(((circle.ticksToActivate / 100) * (1 - circle.frac)).toPrecision(2)).toFixed(1) : undefined
}
global.totalPlayerScores = (players, state) => {
  const snapshots = {
    shipStateInitial: [],
    shipStateA: [],
    shipStateC: []
  }
  state.mode = 'score'
  state.timer = global.durationScore
  let highScore = 0
  let shipCount = state.ships.length
  let scores = []
  state.ships.forEach((ship, index) => {
    highScore = Math.max(highScore, ship.score)
    scores[index] = ship.score
    ship.score = 0
    ship.hit = false
  })
  highScore = highScore || 1 // protect against division by 0 if all players score 0
  snapshots.shipStateInitial = JSON.parse(JSON.stringify(state.ships))
  snapshots.shipStateA = JSON.parse(JSON.stringify(snapshots.shipStateInitial))
  snapshots.shipStateA.forEach((ship, index) => {
    ship.score = 0
    ship.x = (((index + 0.5) / shipCount) - 0.5) * (0.8 * 2)
    ship.y = 0.8
    ship.angle = global.tau * 0.75
  })
  snapshots.shipStateC = JSON.parse(JSON.stringify(snapshots.shipStateA))
  const mapY = (score) => {
    return 0.8 - (score / highScore)
  }
  const yMax = mapY(highScore)
  snapshots.shipStateC.forEach((ship, index) => {
    ship.score = scores[index]
    ship.scoreMax = highScore
    ship.y = mapY(ship.score)
    ship.yMax = yMax
  })
  state.scoreSnapshots = snapshots
}
global.durationScore = 10 * 100 // Score display time = 15s,
global.durationScoreA = 0.95 * global.durationScore
global.durationScoreB = 0.85 * global.durationScore
global.durationScoreC = 0.45 * global.durationScore
global.durationScoreD = 0.4 * global.durationScore
global.animatePlayerScores = (players, state) => {
  const snapshots = state.scoreSnapshots
  let proceedToNextState = false
  state.timer -= 1
  if (state.timer <= 0) {
    proceedToNextState = true
  } else if (state.timer >= global.durationScoreA) {
    let diff = state.timer - global.durationScoreA
    let total = global.durationScore - global.durationScoreA
    let progress = 1 - (diff / total)
    global.lerpShips(state, snapshots.shipStateInitial, snapshots.shipStateA, progress)
  } else if (state.timer >= global.durationScoreB) {
    // just a pause
  } else if (state.timer >= global.durationScoreC) {
    let diff = state.timer - global.durationScoreC
    let total = global.durationScoreB - global.durationScoreC
    let progress = 1 - (diff / total)
    global.lerpShips(state, snapshots.shipStateA, snapshots.shipStateC, progress)
  } else if (state.timer <= global.durationScoreD) {
    const blink = Math.floor((state.timer % 100) / 50) < 1
    state.ships.forEach((ship, index) => {
      const sourceData = snapshots.shipStateC[index]
      if (sourceData) {
        const status = sourceData.score === sourceData.scoreMax ? 'Winner!' : 'Loser!'
        ship.score = blink ? status : ''
      }
    })
  }
  if (proceedToNextState) {
    state.events.emit('end')
  }
}
global.lerpShips = (state, startState, targetState, progress) => {
  state.ships.forEach((ship, index) => {
    const a = startState[index]
    const b = targetState[index]
    if (a !== undefined && b !== undefined) {
      global.lerpShip(ship, a, b, progress)
    }
  })
}
global.lerpShip = (target, a, b, progress) => {
  target.x = global.lerp(a.x, b.x, progress)
  target.angle = global.lerp(a.angle, b.angle, progress)
  if (b.yMax === undefined) {
    target.y = global.lerp(a.y, b.y, progress)
    target.score = Math.floor(global.lerp(a.score, b.score, progress))
  } else {
    target.y = Math.max(b.y, global.lerp(a.y, b.yMax, progress))
    target.score = Math.min(b.score, Math.floor(global.lerp(a.score, b.scoreMax, progress)))
  }
}
