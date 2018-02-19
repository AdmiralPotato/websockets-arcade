window.tau = Math.PI * 2

window.shipComponent = {
  props: {
    id: String,
    x: Number,
    y: Number,
    angle: Number,
    radius: Number,
    hue: Number,
    isPlayer: Boolean,
    hit: Boolean,
    score: [Number, String]
  },
  computed: {
    shipTransforms: function () {
      const transforms = [
        'rotate(' + ((this.angle / window.tau) * 360) + ')',
        'scale(' + this.radius + ')'
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
      </g>
    `
}
