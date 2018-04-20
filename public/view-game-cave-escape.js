window.gameCaveEscapeComponent = {
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
      <g
        class="verts"
      >
        <vert 
          v-for="(item, index) in track.verts"
          :pos="item"
          :key="index"
          :radius="track.radii[index]"
        />
      </g>
        <polygon :points="track.verts.toString()" class="center" />
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
          text="YOU HAVE ESCAPED THE CAVE FOR NOW"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="LET'S SEE BURNED LEAST!"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
