const game = {
  map: {
    // 'select': 'SELECT SCREEN',
    'meteor-collect': 'Meteor Collect',
    'galaxy-diner': 'Galaxy Diner',
    'cosmic-dash': 'Cosmic Dash',
    'wave-rider': 'Wave Rider',
    'slurp': 'Slurp'
  },
  starMin: 30,
  starMinRadius: 0.005,
  starMaxRadius: 0.05,
  activate: (players, state) => {
    const games = Object.entries(game.map)
    const chunk = 1 / games.length
    const angleChunk = global.tau * chunk
    const angleOffset = global.tau * -0.25
    const gameMenuRadius = 0.5
    Object.assign(
      state,
      {
        stars: [],
        startCircles: games.map(([id, label], index, list) => {
          const angle = (index * angleChunk) + angleOffset
          return global.createActivityCircle({
            id,
            label,
            x: (Math.cos(angle) * gameMenuRadius),
            y: (Math.sin(angle) * gameMenuRadius) + 0.3,
            ticksToActivate: 3 * global.ticksPerSecond
          })
        })
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
      yVel: radius * -0.05,
      xVel: 0,
      radius: radius
    }
  },
  tickGame: (now, players, state) => {
    global.tickPlayers(now, players, state)
    game.tickStars(now, state)
    state.startCircles.forEach(item => {
      let startGame = global.circleSelectCountdown(
        now,
        item,
        players,
        state,
        true
      )
      if (startGame) {
        delete state.startCircles
        delete state.stars
        state.events.emit('end', item.id)
      }
    })
    return state
  },
  tickStars: (now, state) => {
    state.stars.forEach(item => {
      item.x += item.xVel
      item.y += item.yVel
      global.wrap(item)
    })
  }
}

module.exports = game
