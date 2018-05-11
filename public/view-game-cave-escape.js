window.gameCaveEscapeComponent = {
  props: {
    mode: String,
    timer: Number,
    stars: Array,
    lavaWave: Array,
    track: Object,
    startCircle: Object
  },
  computed: {
    tangents: function () {
      const result = this.track.innerPoly.map((a, index) => {
        const b = this.track.outerPoly[index]
        return `M${a.join(',')}L${b.join(',')}Z`
      })
      return result.join(' ')
    },
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-cave-escape">
      <g
        v-if="track"
        class="track"
      >
        <defs>
          <polygon id="track" :points="track.walls.toString()" class="bounds outer" />
          <use id="track-background" xlink:href="#track" transform="scale(0.8)" />
          <use id="track-foreground" xlink:href="#track" transform="scale(1.2)" />
          <clipPath id="clipping-track-foreground">
            <use xlink:href="#track" transform="scale(1.2)" />
          </clipPath>
        </defs>
        <g clip-path="url(#clipping-track-foreground)">
          <g class="stars hit">
            <star
              v-for="item in stars"
              v-bind="item"
              :key="item.id"
            />
          </g>
        </g>
        <use xlink:href="#track-background" class="track cave" />
        <use xlink:href="#track" class="bounds inner" />
        <use xlink:href="#track-foreground" class="track cave" />
        <polygon :points="lavaWave.toString()" class="lava" />
      </g>
      <g class="mode-intro"
        v-if="mode === 'intro'"
      >
        <countdown-circle
          v-bind="startCircle"
        />
        <vector-text
          text="CAVE ESCAPE"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="escape the lava filling the cave without touching the edges"
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
          text="CAVE ESCAPED!"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="LET'S SEE WHO BURNED LEAST!"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
