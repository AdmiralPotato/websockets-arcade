const charString = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`
const chars = [
  ...charString,
  ' ',
  'bksp',
  'done'
].map((char, index) => {
  return {
    x: ((index % 10) / 6) + (1 / 4) - 1,
    y: ((Math.floor(index / 10)) / 6) + (1 / 2.5) - 1,
    char
  }
})
const charRadius = 0.01
const appChars = chars.map((item) => {
  return {
    ...item,
    radius: charRadius
  }
})
const game = {
  charRadius,
  activate: (players, state) => {
    Object.assign(
      state,
      {
        charRadius,
        chars
      }
    )
    game.changeModeToIntro(players, state)
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.ships.forEach(ship => {
      ship.score = '___'
      players[ship.id].lastActiveTime = now
    })
  },
  tickGame: (now, players, state) => {
    global.tickPlayers(now, players, state)
    game.checkCharCollision(now, players, state)
    return state
  },
  checkCharCollision: (now, players, state) => {
    state.ships.forEach(ship => {
      for (let i = 0; i < appChars.length; i++) {
        const item = appChars[i]
        const collision = global.detectCollision(item, ship)
        if (collision) {
          ship.score = item.char
          break
        }
      }
    })
  }
}

module.exports = game
