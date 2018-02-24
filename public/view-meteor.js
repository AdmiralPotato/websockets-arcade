window.tau = Math.PI * 2

window.meteorComponent = {
  props: {
    id: Number,
    x: Number,
    y: Number,
    angle: Number,
    radius: Number,
    invincible: Number,
    hue: Number,
    consumable: Boolean
  },
  computed: {
    color: function () {
      return this.consumable && this.hue !== undefined && this.hue !== null ? `color: hsl(${this.hue}, 100%, 50%);` : ''
    },
    transforms: function () {
      const transforms = [
        'translate(' + this.x + ', ' + this.y + ')',
        'rotate(' + ((this.angle / window.tau) * 360) + ')',
        'scale(' + this.radius + ')'
      ]
      return transforms.join('')
    }
  },
  data: function () {
    const points = []
    const segments = 10 + Math.round(Math.random() * 5)
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * window.tau
      const radius = 0.75 + (Math.random() * 0.5)
      const point = [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ]
      points.push(point.join(','))
    }
    return {
      points: points.join(' ')
    }
  },
  template: `
      <g
        class="meteor"
        :class="{hit: invincible}"
        :style="color"
        :transform="transforms"
      >
        <polygon :points="points"/>
      </g>
    `
}
