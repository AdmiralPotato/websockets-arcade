window.gameNameEntryComponent = {
  props: {
    ships: Array,
    chars: Array,
    charRadius: Number
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    }
  },
  template: `
    <g class="game-name-entry">
      <vector-text
        text="ENTER YOUR NAME"
        :scale="0.04"
        pos="0,-0.8" />
      <g class="chars">
        <vector-text
          v-for="(item, index) in chars"
          class="text-timer"
          :key="item.char"
          :text="item.char"
          :scale="charRadius"
          :pos="item.x + ',' + item.y" />
      </g>
    </g>
  `
}
