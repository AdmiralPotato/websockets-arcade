window.gameCosmicDashComponent = {
  props: {
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
      <countdown-circle
        v-if="startCircle"
        v-bind="startCircle"
      />
      <g class="track">
        <polygon :points="track.innerPoly.toString()" class="bounds inner" />
        <polygon :points="track.outerPoly.toString()" class="bounds outer" />
        <polygon :points="track.verts.toString()" class="center" />
        <path :d="tangents" class="tangents" />
      </g>
      <g class="mode-intro">
        <g
          v-if="!track.isValid"
          class="track-verts"
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
          text="Move along the race track without crashing"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
