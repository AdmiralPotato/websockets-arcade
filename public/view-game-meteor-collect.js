window.gameMeteorCollectComponent = {
  props: {
    mode: String,
    startCircle: Object,
    timer: Number,
    meteors: Array
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-meteor-collect">
      <g class="meteors">
        <meteor
          v-for="meteor in meteors"
          v-bind="meteor"
          :key="meteor.id"
        />
      </g>
      <g class="mode-intro"
        v-if="mode === 'intro'"
      >
        <countdown-circle
          v-bind="startCircle"
        />
        <vector-text
          text="METEOR COLLECT"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="collect meteors with your ship! white: 2pts, green: 5pts"
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
      <g class="mode-score"
        v-if="mode === 'score'"
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
          text="LET'S SEE WHO LOST MOST BEST!"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
