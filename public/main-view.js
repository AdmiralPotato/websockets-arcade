window.mainViewComponent = {
  props: {
    ships: Array
  },
  template: `
    <svg viewBox="-1 -1 2 2">
      <rect class="bounding-rect" x="-1" y="-1" width="2" height="2" />
      <ship
        v-for="ship in ships"
        v-bind="ship"
        :key="ship.id"
        ></ship>
    </svg>
  `
}
