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
      type: [String, Number],
      default: function () { return window.app.randomHash() }
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
    outerCircleRadius: function () {
      return this.radius + 0.025
    },
    tickList: function () {
      return (new Array(this.ticks)).fill('').map((x, i) => this.tickData(i))
    }
  },
  methods: {
    tickData: function (i) {
      const frac = (i + 1) / this.ticks
      return {
        hash: this.lineHash,
        on: this.frac && frac > this.frac,
        transform: `rotate(${(360 * frac) - 90})`
      }
    }
  },
  template: `
    <g
      class="countdown-circle"
      :class="{
        hit: hit
      }"
      :transform="'translate(' + x + ', ' + y + ')'"
      :style="color"
    >
      <defs>
        <line
          :id="lineId"
          :x1="radius"
          y1="0"
          :x2="outerCircleRadius"
          y2="0"
          class="countdown-tick"
        />
      </defs>
      <vector-text
        v-if="label"
        :text="label.toString()"
        :scale="0.01"
        :pos="'0,' + (-0.06 - outerCircleRadius)"
      />
      <vector-text
        v-if="sec"
        :text="sec.toString()"
        :scale="0.02"
      />
      <g class="ticks">
        <use
          v-for="tick in tickList"
          v-if="tick.on"
          :xlink:href="tick.hash"
          :transform="tick.transform"
        />
      </g>
      <circle
        :r="radius"
      />
      <circle
        v-if="frac"
        :r="outerCircleRadius"
      />
    </g>
  `
}
