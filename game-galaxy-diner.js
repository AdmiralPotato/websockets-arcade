const game = {
  symbols: ['▲', '■', '⏺'],
  maxIngredients: 4,
  activate: (players, state) => {
    let radius = 0.05
    let y = 0.3333
    const served = false
    state.parts = [ // AKA: ingredients
      {
        type: '▲',
        x: -0.5,
        y,
        radius
      },
      {
        type: '■',
        x: 0,
        y,
        radius
      },
      {
        type: '⏺',
        x: 0.5,
        y,
        radius
      },
      {
        type: '←',
        x: -0.25,
        y: 0.75,
        radius
      },
      {
        type: '❌',
        x: 0.25,
        y: 0.75,
        radius
      }
    ]
    y = -1.25
    radius = 0.15
    state.orders = []
    for (let i = 0; i < 4; i++) {
      const recipe = game.makeRandomRecipe()
      state.orders.push({
        recipe,
        time: 1,
        timer: -Math.floor(Math.random() * 100),
        state: 'in',
        served,
        x: -0.75 + (i * 0.5),
        y,
        radius
      })
    }
    game.changeModeToIntro(players, state)
  },
  changeModeToIntro: (players, state) => {
    const now = Date.now()
    state.mode = 'intro'
    state.ships.forEach(ship => {
      ship.score = 0
      ship.recipe = ''
      players[ship.id].lastActiveTime = now
    })
  },
  tickGame: (now, players, state) => {
    global.tickPlayers(now, players, state)
    game.tickOrders(now, players, state)
    game.checkCollisions(now, players, state)
    return state
  },
  makeRandomRecipe: () => {
    let result = ''
    const recipeComplexity = Math.floor(
      global.rangeRand(1, game.maxIngredients + 1)
    )
    for (let i = 0; i < recipeComplexity; i++) {
      const index = Math.floor(global.rangeRand(0, game.symbols.length))
      const ingredient = game.symbols[index]
      result += ingredient
    }
    return result
  },
  orderChangeTime: 50,
  orderWaitTime: 500,
  orderYIn: -0.25,
  orderYOut: -1.25,
  orderStateHandlerMap: {
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
    state.orders.forEach((order) => {
      game.orderStateHandlerMap[order.state](order)
    })
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
            if (ingredient.type === '←') {
              let shipIngredients = [...ship.recipe]
              shipIngredients.pop()
              ship.recipe = shipIngredients.join('')
            } else if (ingredient.type === '❌') {
              ship.recipe = ''
            } else if (
              ship.recipe.length < game.maxIngredients
            ) {
              ship.recipe += ingredient.type
            }
          }
        }
      }
      // test collision with orders
      if (
        !hitThisFrame &&
        ship.recipe.length > 0
      ) {
        for (let i = 0; !hitThisFrame && (i < state.orders.length); i++) {
          const order = state.orders[i]
          if (
            order.state === 'waiting' &&
            ship.recipe === order.recipe &&
            global.detectCollision(order, ship)
          ) {
            order.served = true
            ship.recipe = ''
            ship.score += order.recipe.length
            hitThisFrame = true
            order.hit = true
          }
        }
      }
      ship.meta.ingredientHit = hitThisFrame
    })
  }
}

module.exports = game
