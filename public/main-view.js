window.mainViewComponent = {
  props: {
    playerId: String,
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
      <g class="text-overlay">
        <vector-text
          class="text-timer"
          :text="timerStatus"
          :scale="0.01"
          pos="0,-0.8"
          textAlign="center" />
      </g>
      <g class="ships">
        <ship
          v-for="ship in ships"
          v-bind="ship"
          :isPlayer="ship.id === playerId"
          :key="ship.id"
        />
      </g>
      <g class="asteroids">
        <asteroid
          v-for="asteroid in asteroids"
          v-bind="asteroid"
          :key="asteroid.id"
        />
      </g>
    </svg>
  `
}
