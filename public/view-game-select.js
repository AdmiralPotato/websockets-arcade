window.gameSelectComponent = {
  props: {
    stars: Array,
    startCircles: Array
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-select">
      <g class="stars hit">
        <star
          v-for="item in stars"
          v-bind="item"
          :key="item.id"
        />
      </g>
      <g class="select-circles">
        <countdown-circle
          v-for="circle in startCircles"
          v-bind="circle"
          :key="circle.id"
        />
      </g>
      <g class="mode-intro">
        <vector-text
          text="Select a Game"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="move all ships one red circle to select game"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
