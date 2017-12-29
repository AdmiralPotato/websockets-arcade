window.mainViewComponent = {
  props: {
    playerId: String,
    showColorPicker: Boolean,
    mode: String,
    startCircle: Object,
    timer: Number,
    ships: Array,
    asteroids: Array
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <svg viewBox="-1 -1 2 2">
      <rect class="bounding-rect" x="-1" y="-1" width="2" height="2" />
      <vector-text-defs />
      <defs>
        <polygon id="ship" points="1,0 -1,-1 -0.5,0 -1,1"/>
        <path 
          id="petal" 
          transform="translate(-1,-1)" 
          d="M2,1a1.01269,1.01269,0,0,1-.00516.10224.99969.99969,0,0,1-.01516.09929l-.00935.04123a.0535.0535,0,0,1-.06776.03827L1.526,1.16377a.0537.0537,0,0,1-.03622-.06251l.0001-.00049a.50384.50384,0,0,0,0-.20154L1.48974.89874A.0537.0537,0,0,1,1.526.83623L1.90257.719a.0535.0535,0,0,1,.06776.03827l.00935.04123a.99969.99969,0,0,1,.01516.09929A1.01269,1.01269,0,0,1,2,1Z"
        />
      </defs>
      <g class="asteroids">
        <asteroid
          v-for="asteroid in asteroids"
          v-bind="asteroid"
          :key="asteroid.id"
        />
      </g>
      <g class="ships">
        <ship
          v-for="ship in ships"
          v-bind="ship"
          :isPlayer="ship.id === playerId"
          :key="ship.id"
        />
      </g>
      <g
        v-if="mode === 'intro'"
        class="mode-intro"
      >
        <circle
          :r="startCircle.radius"
          :cx="startCircle.x"
          :cy="startCircle.y"
          style="color: #f00;"
          />
        <vector-text
          text="WELCOME TO GAME"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="move all ships to red circle to start"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
      <g
        v-if="mode === 'play'"
        class="mode-play"
      >
        <vector-text
          class="text-timer"
          :text="timerStatus"
          :scale="0.01"
          pos="0,-0.8" />
      </g>
      <g
        v-if="mode === 'score'"
        class="mode-intro"
      >
        <vector-text
          text="GAME IS NOW OVER"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="YOU HAVE FAILED MISERABLY"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
      <g 
        v-if="showColorPicker"
        class="color-pickers"
      >
        <color-picker @selectColor="$emit('selectColor', $event)"/>
      </g>
    </svg>
  `
}
