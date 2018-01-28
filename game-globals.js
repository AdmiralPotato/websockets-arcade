global.tau = Math.PI * 2
global.arrayRemove = function (array, item) {
  let index
  while ((index = array.indexOf(item)) !== -1) {
    array.splice(index, 1)
  }
  return array
}
global.bound = (min, max, value) => {
  return Math.min(max, Math.max(min, value))
}
global.detectCollision = (a, b) => {
  const diffX = a.x - b.x
  const diffY = a.y - b.y
  const distance = Math.sqrt((diffX * diffX) + (diffY * diffY))
  return distance < a.radius + b.radius
}
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
global.activityCircle = (config) => {
  return Object.assign(global.activityCircleDefaults, config)
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
  const states = global.playersInCircle(circle, players, state)
  const readyPlayerCount = states.in.length
  const allPlayersReady = readyPlayerCount && readyPlayerCount === state.ships.length
  let activate = false
  if (!allPlayersReady && bootIfInactive) {
    states.out.forEach((player) => {
      if (now - player.lastActiveTime > global.durationInactivityBoot) {
        player.needsBooting = true
      }
    })
  }
  if (allPlayersReady) {
    circle.tick += 1
    global.tickCircle(circle)
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
  circle.sec = parseFloat(((circle.ticksToActivate / 100) * (1 - circle.frac)).toPrecision(2)).toFixed(1)
}
global.totalPlayerScores = (players, state) => {
  const snapshots = {
    shipStateInitial: [],
    shipStateA: [],
    shipStateC: []
  }
  state.mode = 'score'
  state.timer = global.durationScore
  state.meteors = []
  let highScore = 0
  let shipCount = state.ships.length
  let scores = []
  state.ships.forEach((ship, index) => {
    highScore = Math.max(highScore, ship.score)
    scores[index] = ship.score
    ship.score = 0
  })
  highScore = highScore || 1 // protect against division by 0 if all players score 0
  snapshots.shipStateInitial = JSON.parse(JSON.stringify(state.ships))
  snapshots.shipStateA = JSON.parse(JSON.stringify(snapshots.shipStateInitial))
  snapshots.shipStateA.forEach((ship, index) => {
    ship.score = 0
    ship.x = (((index + 0.5) / shipCount) - 0.5) * (0.8 * 2)
    ship.y = 0.8
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
global.durationScore = 15 * 100 // Score display time = 15s,
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
  if (b.yMax === undefined) {
    target.y = global.lerp(a.y, b.y, progress)
    target.score = Math.floor(global.lerp(a.score, b.score, progress))
  } else {
    target.y = Math.max(b.y, global.lerp(a.y, b.yMax, progress))
    target.score = Math.min(b.score, Math.floor(global.lerp(a.score, b.scoreMax, progress)))
  }
}
