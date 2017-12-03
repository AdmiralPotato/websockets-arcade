window.tau = Math.PI * 2

window.asteroidComponent = {
  props: {
    id: Number,
    x: Number,
    y: Number,
    angle: Number,
    radius: Number,
    invincible: Number
  },
  computed: {
    transforms: function () {
      const transforms = [
        'translate(' + this.x + ', ' + this.y + ')',
        'rotate(' + ((this.angle / window.tau) * 360) + ')',
        'scale(' + this.radius + ')'
      ]
      return transforms.join('')
    }
  },
  template: `
      <g
        class="asteroid"
        :class="{hit: invincible, consumable: radius <= 1/45}"
        :transform="transforms"
      >
        <polygon points="1,0 -1,0 -1,-1 1,1 -0.5,0 -1,1"/>
      </g>
    `
}
