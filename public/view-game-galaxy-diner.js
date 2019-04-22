window.gameGalaxyDinerComponent = {
  shapeMap: {
    '▲': 'triangle',
    '■': 'square',
    '⏺': 'circle',
    '←': 'arrow',
    '❌': 'cross'
  },
  props: {
    mode: String,
    ships: Array,
    startCircle: Object,
    timer: Number,
    parts: Array,
    orders: Array
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-galaxy-diner">
      <g class="mode-intro"
        v-if="mode === 'intro'"
      >
        <countdown-circle
          v-bind="startCircle"
        />
        <vector-text
          text="Galaxy Diner"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="collect ingredients and deliver orders\nto feed hungry space... things"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
      <g class="mode-play"
        v-if="mode === 'play'"
      >
        <vector-text
          class="text-timer"
          :text="timerStatus"
          :scale="0.01"
          pos="0,-0.9" />
      </g>
      
      <g class="mode-play"
        v-if="mode !== 'score'"
      >
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
      <g class="mode-score"
        v-if="mode === 'score'"
      >
        <vector-text
          text="DINER IS CLOSED"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="WHO SERVED THE MOST CALORIES?!?"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
