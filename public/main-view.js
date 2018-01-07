window.mainViewComponent = {
  props: {
    localPlayers: Object,
    showColorPicker: Boolean,
    mode: String,
    startCircle: Object,
    timer: Number,
    ships: Array,
    asteroids: Array
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    },
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
      <vector-text-defs />
      <defs>
        <polygon id="ship" points="1,0 -1,-1 -0.5,0 -1,1"/>
        <path
          id="petal"
          transform="translate(-1,-1)"
          d="M2,1A1.01269,1.01269,0,0,0,1.99484.89776.99969.99969,0,0,0,1.97968.79847L1.97033.75724A.0535.0535,0,0,0,1.90257.719L1.526.83623a.0537.0537,0,0,0-.03622.06251c0,.00017.006.03333.00768.05014a.50773.50773,0,0,1,0,.10224c-.00171.01681-.00764.05-.00768.05014a.0537.0537,0,0,0,.03622.06251l.37661.11726a.0535.0535,0,0,0,.06776-.03827l.00935-.04123a.99969.99969,0,0,0,.01516-.09929A1.01269,1.01269,0,0,0,2,1Z"
        />
      </defs>
      <g class="asteroids">
        <asteroid
          v-for="asteroid in asteroids"
          v-bind="asteroid"
          :key="asteroid.id"
        />
      </g>
      <g class="ships">
        <ship
          v-for="ship in ships"
          v-bind="ship"
          :isPlayer="isLocalPlayer(ship)"
          :key="ship.id"
        />
      </g>
      <g
        v-if="mode === 'intro'"
        class="mode-intro"
      >
        <circle
          :r="startCircle.radius"
          :cx="startCircle.x"
          :cy="startCircle.y"
          style="color: #f00;"
          />
        <vector-text
          text="WELCOME TO GAME"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="move all ships to red circle to start"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
      <g
        v-if="mode === 'play'"
        class="mode-play"
      >
        <vector-text
          class="text-timer"
          :text="timerStatus"
          :scale="0.01"
          pos="0,-0.8" />
      </g>
      <g
        v-if="mode === 'score'"
        class="mode-intro"
      >
        <vector-text
          text="GAME IS NOW OVER"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="LET'S SEE WHO LOST MOST BEST!"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
      <g
        v-if="localPlayersThatNeedToPickColor.length"
        class="color-pickers"
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
