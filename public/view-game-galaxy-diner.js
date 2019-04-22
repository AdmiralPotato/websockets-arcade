window.gameGalaxyDinerComponent = {
  shapeMap: {
    '▲': 'triangle',
    '■': 'square',
    '⏺': 'circle',
    '←': 'arrow',
    '❌': 'cross'
  },
  props: {
    ships: Array,
    parts: Array,
    orders: Array,
    timer: Number
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-galaxy-diner">
      <vector-text
        text="Galaxy Diner"
        :scale="0.04"
        pos="0,-0.8"
      />
      <defs
        class="ship-overlays"
      >
        <galaxy-diner-recipe
          v-for="(item, index) in ships"
          transform="translate(0, 0.06), scale(0.1, 0.1)"
          :id="'ship-overlay-' + item.id"
          :key="item.id"
          :recipe="item.recipe"
        />
      </defs>
      <g
        class="orders"
      >
        <galaxy-diner-order
          v-for="(item, index) in orders"
          :key="item.char"
          :order="item"
        />
      </g>
      <g class="parts">
        <g
          v-for="(item, index) in parts"
          :key="item.char"
          :transform="'translate(' + item.x + ', ' + item.y + '), scale(' + item.radius + ',' + item.radius + ')'"
          :class="{hit: !item.hit}"
        >
          <use
            :xlink:href="'#path-' + $options.shapeMap[item.type]"
          />
          <path-circle :r="1.5" />
        </g>
      </g>
    </g>
  `
}
