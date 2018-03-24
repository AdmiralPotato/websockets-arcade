window.gameCosmicDashComponent = {
  props: {
    mode: String,
    timer: Number,
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
    <g class="game-race">
      <g
        v-if="track"
        class="track"
      >
        <path :d="tangents" class="tangents" />
        <polygon :points="track.innerPoly.toString()" class="bounds inner" />
        <polygon :points="track.outerPoly.toString()" class="bounds outer" />
        <polygon :points="track.verts.toString()" class="center" />
      </g>
      <g class="mode-intro"
        v-if="mode === 'intro'"
      >
        <countdown-circle
          v-bind="startCircle"
        />
        <g
          v-if="!track.isValid"
          class="verts"
        >
          <vert 
            v-for="(item, index) in track.verts"
            :pos="item"
            :key="index"
            :radius="track.radius"
          />
        </g>
        <vector-text
          text="COSMIC DASH"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="Move along the race track quickly without touching the edges"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
      <g class="mode-intro"
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
          text="RACE IS NOW OVER"
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
