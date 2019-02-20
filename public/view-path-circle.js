window.pathCircleComponent = {
  props: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    },
    r: {
      type: Number,
      default: 1
    }
  },
  computed: {
    transforms: function () {
      const transforms = [
        'translate(' + this.x + ', ' + this.y + ')',
        'scale(' + this.r + ')'
      ]
      return transforms.join('')
    }
  },
  template: `
    <use
      :transform="transforms"
      xlink:href="#path-circle"
    />
  `
}
