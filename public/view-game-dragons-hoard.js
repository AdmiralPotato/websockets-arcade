window.gameDragonsHoardComponent = {
  shapeMap: {
    '▲': 'triangle',
    '■': 'square',
    '⏺': 'circle'
  },
  props: {
    mode: String,
    ships: Array,
    startCircle: Object,
    timer: Number,
    parts: Array,
    orders: Array,
    track: Object
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-dragons-hoard">
      <g
        v-if="track"
        class="track"
      >
        <polygon
          v-if="track.innerPoly"
          :points="track.innerPoly.toString()"
          class="bounds inner"
        />
        <polygon
          v-if="track.outerPoly"
          :points="track.outerPoly.toString()"
          class="bounds outer"
        />
        <polygon
          v-for="(poly, index) in track.polygons"
          :key="index"
          :points="poly.toString()"
          class="bounds inner"
        />
        <polygon :points="track.verts.toString()" class="center" />
        <g
          v-if="true || !track.isValid"
          class="verts"
        >
          <vert
            v-for="(item, index) in track.verts"
            :pos="item"
            :key="'a' + index"
            :radius="track.radius"
          />
          <vert
            v-for="(item, index) in track.treasureVerts"
            :pos="item"
            :key="'b' + index"
            :radius="track.staticRadius"
          />
        </g>
      </g>
      <g class="mode-intro"
        v-if="mode === 'intro'"
      >
        <countdown-circle
          v-bind="startCircle"
        />
        <vector-text
          text="Dragon's Hoard"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="Help the Dragon build the perfect Hoard\nwith shapes of its choosing!"
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
          class="dragon"
        >
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
          text="HOARD IS COMPLETE"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="WHO IS DRAGON'S FAVORITE?!?"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
