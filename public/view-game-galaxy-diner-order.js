window.gameGalaxyDinerOrderComponent = {
  props: {
    order: Object
  },
  computed: {
    patienceBar: function () {
      return [
        `M -1, 0.5`,
        `L ${-1 + ((1 - this.order.time) * 2)}, 0.5`
      ].join(' ')
    }
  },
  template: `
    <g
      class="galaxy-diner-order"
      :transform="'translate(' + order.x + ', ' + order.y + '), scale(' + order.radius + ',' + order.radius + ')'"
    >
      <rect
        class="outline"
        width="2"
        height="2"
        x="-1"
        y="-1"
      />
      <path
        class="separator"
        d="M -1 0 L 1 0"
      />
      <path
        class="patienceBar"
        :d="patienceBar"
      />
      <galaxy-diner-recipe
        transform="translate(0, -0.5)"
        :recipe="order.recipe"
      />
    </g>
  `
}
