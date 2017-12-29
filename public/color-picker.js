const hues = [0, 45, 90, 135, 180, 225, 270, 315]

window.colorPickerComponent = {
  data: function () {
    return {
      angle: 0
    }
  },
  created: function () {
    this.hues = hues
  },
  computed: {
    selectedHue: function () {
      return this.angle
    }
  },
  methods: {
    getColorStyle: function (hue) {
      return 'color: hsla(' + hue + ', 100%, 50%, 1)'
    },
    clickPetal: function (hue) {
      console.log('clicked petal: ', hue)
      this.angle = hue
    }
  },
  template: `
      <g class="color-picker">
        <vector-text
          text="Pick a color"
          :scale="0.01"
          pos="0,0"
        />
        <g 
          class="petals"
          transform="scale(0.5)"
        >
          <use 
            v-for="hue in hues"
            :style="getColorStyle(hue)"
            :transform="'rotate(' + hue + ')'"
            class="ship"
            :class="{playerShip: hue === selectedHue}"
            @click="clickPetal(hue)"
            xlink:href="#petal"
          />
        </g>
        <g 
          class="ship playerShip"
          :transform="'scale(0.1) rotate(' + angle + ')'"
          :style="getColorStyle(selectedHue)"
        >
          <use 
            xlink:href="#ship" 
            @click="$emit('selectColor', selectedHue)"
          />
        </g>
      </g>
    `
}
