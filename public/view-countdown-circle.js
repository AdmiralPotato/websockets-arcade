window.countdownCircleComponent = {
  props: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    radius: {
      type: Number,
      required: true
    },
    hue: Number,
    hit: Boolean,
    label: {
      type: [String, Number],
      required: false
    },
    frac: {
      type: Number,
      required: false
    },
    sec: {
      type: [String, Number],
      required: false
    },
    id: {
      type: [String, Number]
    },
    ticks: {
      type: Number,
      default: 96
    }
  },
  computed: {
    color: function () {
      return this.hue !== undefined && this.hue !== null ? `color: hsl(${this.hue}, 100%, 50%);` : ''
    },
    lineId: function () {
      return 'line-' + this.id
    },
    lineHash: function () {
      return '#' + this.lineId
    },
    tickPathData: function () {
      return (new Array(this.ticks)).fill('').map((x, i) => this.tickData(i)).join(' ')
    }
  },
  methods: {
    tickData: function (i) {
      const frac = (i + 1) / this.ticks
      let result
      if (this.frac && frac > this.frac) {
        const innerRadius = 1
        const outerRadius = 1.2
        const angle = (frac * window.tau) - (window.tau / 4)
        const x = Math.cos(angle)
        const y = Math.sin(angle)
        result = [
          `M ${x * innerRadius},${y * innerRadius}`,
          `L ${x * outerRadius},${y * outerRadius}`
        ]
      }
      return result || []
    }
  },
  template: `
    <g
      class="countdown-circle"
      :class="{
        hit: hit
      }"
      :transform="'translate(' + x + ', ' + y + '), scale(' + radius + ')'"
      :style="color"
    >
      <vector-text
        v-if="label"
        :text="label.toString()"
        :scale="0.08"
        pos="0,-1.675"
      />
      <vector-text
        v-if="sec"
        :text="sec.toString()"
        :scale="0.15"
      />
      <path
        class="countdown-tick"
        :d="tickPathData"
      />
      <path-circle :r="1" />
      <path-circle
        v-if="frac"
        :r="1.2"
      />
    </g>
  `
}
