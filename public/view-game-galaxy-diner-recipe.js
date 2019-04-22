window.gameGalaxyDinerRecipeComponent = {
  shapeMap: {
    '▲': 'triangle',
    '■': 'square',
    '⏺': 'circle'
  },
  props: {
    recipe: {
      type: String,
      default: ''
    }
  },
  computed: {
    parts: function () {
      const shapeMap = this.$options.shapeMap
      const parts = this.recipe.split('')
      const n = parts.length
      const center = (n - 1) / 2
      const partSpacing = 0.25
      return parts.map(function (item, index) {
        return {
          x: ((index - center) * partSpacing) * 2,
          part: '#path-' + shapeMap[item]
        }
      })
    }
  },
  template: `
    <g class="galaxy-diner-recipe">
      <use
        class="part"
        v-for="item in parts"
        :transform="'translate(' + item.x + ', 0), scale(0.2, 0.2)'"
        :xlink:href="item.part"
      />
    </g>
  `
}
