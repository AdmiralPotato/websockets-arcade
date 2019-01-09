// const charString = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`
const charString = `
!$*-.?@^_~
0123456789
ABCDEFGHIJ
KLMNOPQRST
UVWXYZ`
let chars = []
const input = [
  ...charString.split('\n')
]
input.forEach((line, y) => {
  [...line].forEach((char, x) => {
    if (char !== '\n') {
      chars.push({
        x: (x / 5.5) + (1 / 5.5) - 1,
        y: (y / 5.5) + (1 / 2.5) - 1,
        char
      })
    }
  })
})

chars.push({
  x: -0.4,
  y: 0.65,
  char: 'bksp'
})
chars.push({
  x: 0.4,
  y: 0.65,
  char: 'done'
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
      ship.meta.done = false
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
      let hitThisFrame = false
      if (!ship.meta.done) {
        for (let i = 0; i < appChars.length; i++) {
          const item = appChars[i]
          if (
            global.detectCollision(item, ship)
          ) {
            hitThisFrame = true
            if (!ship.meta.charHit) {
              if (
                ship.meta.name.length &&
                item.char === 'done'
              ) {
                ship.meta.done = true
              } else if (item.char === 'bksp') {
                let shipChars = [...ship.meta.name]
                shipChars.pop()
                ship.meta.name = shipChars.join('')
              } else if (
                item.char !== 'done' &&
                ship.meta.name.length < 10
              ) {
                ship.meta.name += item.char
              }
              ship.score = ship.meta.name
            }
            break
          }
        }
      } else {
        ship.meta.timer -= 1
        if (ship.meta.timer < 1) {
          ship.meta.timer = 50
          if (ship.score === ship.meta.name) {
            ship.score = '' + ship.meta.score
          } else {
            ship.score = ship.meta.name
          }
        }
      }
      ship.meta.charHit = hitThisFrame
    })
  }
}

module.exports = game
