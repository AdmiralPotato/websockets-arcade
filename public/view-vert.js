window.vertComponent = {
  props: {
    pos: Array,
    radius: Number
  },
  template: `
    <use
      xlink:href="#vert"
      :transform="'translate(' + pos[0] + ', ' + pos[1] + ') scale(' + radius + ')'"
    />
  `
}
