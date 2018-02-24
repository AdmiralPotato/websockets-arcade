const hues = [0, 45, 90, 135, 180, 225, 270, 315]

window.colorPickerComponent = {
  data: function () {
    return {
      angle: 0
    }
  },
  props: {
    total: {
      type: Number,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    localPlayer: {
      type: Object,
      required: true
    }
  },
  created: function () {
    this.hues = hues
  },
  computed: {
    instructions: function () {
      return 'Pick a color;\n' + (this.localPlayer.controller === 'touch' ? 'Touch ship ' : 'Press start') + ' to begin'
    },
    selectedHue: function () {
      const angle = this.localPlayer.angle || this.angle
      const hue = Math.round(Math.round(angle / 45) * 45) % 360
      this.localPlayer.hue = hue
      return hue
    },
    transform: function () {
      const frac = (1 / this.total)
      const fracSquared = frac * frac
      const scale = this.total > 1 ? 0.25 + frac : 1
      const angle = (1 / this.total) * this.index * Math.PI * 2 + (this.total % 2 ? Math.PI / 2 : 0)
      const spread = this.total > 1 ? 0.475 : 0
      const offset = this.total > 1 ? 0.2 - fracSquared : 0
      const x = Math.cos(angle) * spread
      const y = (Math.sin(angle) * spread) + offset
      return `translate(${[x, y].join()}) scale(${scale})`
    }
  },
  methods: {
    getColorStyle: function (hue) {
      return 'color: hsla(' + hue + ', 100%, 50%, 1)'
    },
    clickPetal: function (hue) {
      console.log('clicked petal: ', hue)
      this.angle = hue
    },
    selectColor: function () {
      this.$emit('selectColor', this.localPlayer)
    }
  },
  template: `
      <g
        class="color-picker"
        :transform="transform"
      >
        <vector-text
          :text="instructions"
          :scale="0.015"
          pos="0,0.5"
        />
        <g
          class="petals"
          transform="scale(0.4)"
        >
          <use
            v-for="hue in hues"
            :style="getColorStyle(hue)"
            :transform="'rotate(' + hue + ')'"
            class="ship"
            :class="{filled: hue === selectedHue}"
            @click="clickPetal(hue)"
            xlink:href="#petal"
          />
        </g>
        <g
          class="ship filled"
          :transform="'scale(0.1) rotate(' + (localPlayer.angle || angle) + ')'"
          :style="getColorStyle(selectedHue)"
          @click="selectColor"
        >
          <circle r="1.25" style="fill: none; stroke: none;"/>
          <use xlink:href="#ship" />
        </g>
      </g>
    `
}
