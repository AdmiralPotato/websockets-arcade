const game = {
  map: {
    // 'select': 'SELECT SCREEN',
    'meteor-collect': 'Meteor Collect',
    'slurp': 'Slurp'
  },
  starMin: 30,
  starMinRadius: 0.005,
  starMaxRadius: 0.05,
  activate: (players, state) => {
    Object.assign(
      state,
      {
        stars: [],
        startCircles: Object.entries(game.map).map(([id, label], index, list) => {
          return global.createActivityCircle({
            id,
            label,
            x: (((index + 0.5) / list.length) - 0.5) * (0.8 * 2),
            y: 0.8,
            ticksToActivate: 300
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
