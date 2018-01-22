window.mainViewComponent = {
  props: {
    state: Object,
    game: String,
    localPlayers: Object,
    showColorPicker: Boolean,
    ships: Array
  },
  computed: {
    localPlayerIds: function () {
      return Object.values(this.localPlayers).map((player) => { return player.id })
    },
    localPlayersThatNeedToPickColor: function () {
      return Object.values(this.localPlayers).filter((player) => { return !player.connected })
    }
  },
  methods: {
    isLocalPlayer: function (ship) {
      return this.localPlayerIds.includes(ship.id)
    }
  },
  template: `
    <svg viewBox="-1 -1 2 2">
      <rect class="bounding-rect" x="-1" y="-1" width="2" height="2" />
      <shape-defs />
      <component
        v-if="game"
        v-bind="state"
        :is="'game-' + game"
      />
      <g class="ships">
        <ship
          v-for="ship in ships"
          v-bind="ship"
          :isPlayer="isLocalPlayer(ship)"
          :key="ship.id"
        />
      </g>
      <g class="color-pickers"
        v-if="localPlayersThatNeedToPickColor.length"
      >
        <color-picker
          v-for="(localPlayer, index) in localPlayersThatNeedToPickColor"
          :total="localPlayersThatNeedToPickColor.length"
          :key="localPlayer.id"
          :index="index"
          :localPlayer="localPlayer"
          @selectColor="$emit('selectColor', $event)"
        />
      </g>
    </svg>
  `
}
