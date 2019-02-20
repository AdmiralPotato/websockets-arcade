// const charString = `!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~`
const charString = `
ABCDEFG
HIJKLMN
OPQRSTU
VWXYZ
`

const game = {
  activate: (players, state) => {
    let chars = []
    let input = [
      ...charString.split('\n')
    ]
    input.shift()
    const gridWidth = 1.95
    const gridOffset = gridWidth / 2
    let charSpacing = gridWidth / input[0].length
    let charOffset = charSpacing / 2
    input.forEach((line, y) => {
      [...line].forEach((char, x) => {
        chars.push({
          x: (x * charSpacing) - gridOffset + charOffset,
          y: (y * charSpacing) - 0.55,
          radius: 0.04,
          char
        })
      })
    })

    const charRadius = 0.0125
    chars.push({
      x: -0.4,
      y: 0.8,
      radius: charRadius * 8,
      char: 'bksp'
    })
    chars.push({
      x: 0.4,
      y: 0.8,
      radius: charRadius * 8,
      char: 'done'
    })
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
    state.chars.forEach((item) => {
      delete item.hit
    })
    state.ships.forEach(ship => {
      let hitThisFrame = false
      if (!ship.meta.done) {
        for (let i = 0; i < state.chars.length; i++) {
          const item = state.chars[i]
          if (
            global.detectCollision(item, ship)
          ) {
            hitThisFrame = true
            item.hit = true
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
