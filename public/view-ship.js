window.shipComponent = {
  props: {
    id: String,
    x: Number,
    y: Number,
    angle: Number,
    playerAngle: Number,
    radius: Number,
    hue: Number,
    isPlayer: Boolean,
    hit: Boolean,
    score: [Number, String]
  },
  computed: {
    shipTransforms: function () {
      const transforms = [
        'scale(' + this.radius + ')',
        'rotate(' + ((this.angle / window.tau) * 360) + ')'
      ]
      return transforms.join(',')
    },
    playerAngleTransforms: function () {
      const transforms = [
        'rotate(' + ((this.playerAngle / window.tau) * 360) + ')',
        'translate(' + (this.radius + (this.radius * 0.75)) + ')',
        'scale(' + (this.radius * 0.2) + ')'
      ]
      return transforms.join(',')
    },
    scoreDisplay: function () {
      return this.score ? this.score.toLocaleString() : ''
    }
  },
  template: `
      <g
        class="ship"
        :class="{
          playerShip: isPlayer,
          hit: hit
        }"
        :transform="'translate(' + x + ', ' + y + ')'"
        :style="'color: hsla(' + hue + ', 100%, 50%, 1);'"
      >
        <vector-text
          :text="scoreDisplay"
          :scale="0.01"
          pos="0,-0.07"
        />
        <g :transform="shipTransforms">
          <use xlink:href="#ship" />
        </g>
        <g :transform="playerAngleTransforms">
          <use xlink:href="#ship" />
        </g>
      </g>
    `
}
