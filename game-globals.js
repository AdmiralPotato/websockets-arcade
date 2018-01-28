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
