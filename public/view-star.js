window.starComponent = {
  props: {
    id: Number,
    x: Number,
    y: Number,
    radius: Number
  },
  data: function () {
    return {
      alive: true,
      sign: Math.sign(Math.random() - 0.5),
      offset: Math.random() * 1000,
      angle: 0
    }
  },
  created: function () {
    window.requestAnimationFrame(this.animate)
    this.animate(Date.now())
  },
  beforeDestroy: function () { this.alive = false },
  computed: {
    transforms: function () {
      const transforms = [
        'translate(' + this.x + ', ' + this.y + ')',
        'rotate(' + (Math.floor((this.angle / window.tau) * 2) * 45) + ')',
        'scale(' + this.radius + ')'
      ]
      return transforms.join('')
    }
  },
  methods: {
    animate: function (time) {
      if (this.alive) {
        window.requestAnimationFrame(this.animate)
        this.angle = this.sign * ((time + this.offset) / 100)
      }
    }
  },
  template: `
      <g
        class="star"
        :transform="transforms"
      >
        <use xlink:href="#twinkle" />
      </g>
    `
}
