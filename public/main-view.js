window.mainViewComponent = {
  props: {
    state: Object,
    localPlayers: Object,
    showColorPicker: Boolean
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
    <svg class="main-view" viewBox="-1 -1 2 2">
      <shape-defs />
      <g clip-path="url(#clipping-rect)">
        <component
          v-if="state.game"
          v-bind="state"
          :is="'game-' + state.game"
        />
        <g class="ships">
          <ship
            v-for="ship in state.ships"
            v-bind="ship"
            :isPlayer="isLocalPlayer(ship)"
            :key="ship.id"
          />
        </g>
      </g>
      <use xlink:href="#bounding-rect" class="bounding-rect" />
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
