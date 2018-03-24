const game = {
  bubbleCountMin: 6,
  bubbleRadiusMin: 1 / 10,
  bubbleRadiusMax: 1 / 5,
  bubbleRadiusPop: 1 / 100,
  bubbleMinSpeed: global.playerMaxSpeed / 3,
  bubbleMaxSpeed: global.playerMaxSpeed / 2,
  bubbleConsumptionRate: 1 / 10 / 500,
  bubbleLastId: 0,
  pointsSlurp: 1 / 10,
  durationPlay: 30 * 100, // ticks are every 10ms
  activate: (players, state) => {
    Object.assign(
      state,
      {
        timer: 0,
        startCircle: null,
        bubbles: []
      }
    )
    game.changeModeToIntro(players, state)
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.timer = game.durationPlay
    state.startCircle = global.createActivityCircle({y: 0.8})
    game.populateInitialBubbles(state)
    state.ships.forEach(ship => {
      ship.score = 0
      players[ship.id].lastActiveTime = now
    })
  },
  changeModeToPlay: (players, state) => {
    state.mode = 'play'
    state.startCircle = undefined
    game.populateInitialBubbles(state)
    state.ships.forEach(ship => {
      ship.score = 0
    })
    state.events.emit('start')
  },
  changeModeToScore: (players, state) => {
    delete state.bubbles
    global.totalPlayerScores(players, state)
  },
  tickGame: (now, players, state) => {
    if (state.mode !== 'score') {
      global.tickPlayers(now, players, state)
      game.tickBubbles(now, players, state)
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
        game.changeModeToPlay(players, state)
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
  tickBubbles: (now, players, state) => {
    state.bubbles.forEach(bubble => {
      bubble.x += bubble.xVel
      bubble.y += bubble.yVel
      bubble.hue = null
      bubble.hit = false
      global.wrap(bubble)
      let playerBubbleIntersection = global.playersInCircle(bubble, players, state)
      if (playerBubbleIntersection.in.length) {
        playerBubbleIntersection.in.forEach((player) => {
          player.ship.score += game.pointsSlurp
          bubble.radius -= game.bubbleConsumptionRate
          bubble.hue = player.ship.hue
        })
        if (playerBubbleIntersection.in.length > 1) {
          bubble.hue = null
          bubble.hit = true
        }
        const speed = global.mapRange(
          game.bubbleRadiusMin,
          game.bubbleRadiusMax,
          game.bubbleMinSpeed,
          game.bubbleMaxSpeed,
          bubble.radius
        )
        bubble.xVel = Math.cos(bubble.angle) * speed
        bubble.yVel = Math.sin(bubble.angle) * speed
        if (bubble.radius <= game.bubbleRadiusPop) {
          bubble.expired = true
        }
      }
    })
    state.bubbles = state.bubbles.filter((bubble) => { return !bubble.expired })
    game.generateBubbles(state)
  },
  populateInitialBubbles: (state) => {
    state.bubbles = []
    game.generateBubbles(state)
  },
  generateBubbles: (state) => {
    while (state.bubbles.length < game.bubbleCountMin) {
      state.bubbles.push(game.createBubble())
    }
  },
  createBubble: (
    x = null,
    y = null,
    radius = global.rangeRand(game.bubbleRadiusMin, game.bubbleRadiusMax)
  ) => {
    const angle = Math.random() * global.tau
    const speed = global.mapRange(
      game.bubbleRadiusMin,
      game.bubbleRadiusMax,
      game.bubbleMinSpeed,
      game.bubbleMaxSpeed,
      radius
    )
    const id = game.bubbleLastId += 1
    if (x === null || y === null) {
      const edgePosition = global.randomEdgePosition()
      x = edgePosition.x
      y = edgePosition.y
    }
    return global.createActivityCircle({
      id,
      x,
      y,
      xVel: Math.cos(angle) * speed,
      yVel: Math.sin(angle) * speed,
      angle,
      radius,
      hue: null
    })
  }
}

module.exports = game
