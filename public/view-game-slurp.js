window.gameSlurpComponent = {
  props: {
    mode: String,
    startCircle: Object,
    timer: Number,
    bubbles: Array
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-slurp">
      <g class="bubbles">
        <countdown-circle
          v-for="bubble in bubbles"
          v-bind="bubble"
          :key="bubble.id"
        />
      </g>
      <g class="mode-intro"
        v-if="mode === 'intro'"
      >
        <countdown-circle
          v-bind="startCircle"
        />
        <vector-text
          text="SLURP"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="keep pace with the bubbles to slurp them down for points"
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
          pos="0,-0.8" />
      </g>
      <g class="mode-score"
        v-if="mode === 'score'"
      >
        <vector-text
          text="WHO SLURP MOST?"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="LET'S SEE WHO LOST MOST BEST!"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
