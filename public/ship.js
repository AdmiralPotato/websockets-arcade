window.shipComponent = {
  props: {
    id: Number,
    x: Number,
    y: Number,
    angle: Number,
    color: String
  },
  computed: {
    transforms: function () {
      const transforms = [
        'translate(' + this.x + ', ' + this.y + ')',
        'rotate(' + this.angle + ')',
        'scale(0.015625)'
      ]
      return transforms.join('')
    }
  },
  template: `
      <g class="ship" :transform="transforms" :stroke="color">
        <polygon points="4,0 -4,-4 -2,0 -4,4"/>
      </g>
    `
}
