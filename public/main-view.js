window.mainViewComponent = {
  props: {
    playerId: String,
    ships: Array,
    asteroids: Array
  },
  template: `
    <svg viewBox="-1 -1 2 2">
      <rect class="bounding-rect" x="-1" y="-1" width="2" height="2" />
      <vector-text-defs />
      <g class="text-overlay">
        <vector-text
          class="text-start"
          text="INSERT COIN\nno don't actually\nit's your phone just touch start or something"
          :scale="0.01"
          pos="0,0"
          textAlign="center"/>
        <vector-text
          class="text-player"
          text="PLAYER: Bob The Destroyer\nScore: 10,000"
          :scale="0.01"
          pos="-0.8,-0.8"
          textAlign="left" />
        <vector-text
          class="text-highscore"
          text="High Score: 100,009,001\nHeld by: JANE\n'YOLO!@#$%^&*()-=_+{}<>?/\\:;'"
          :scale="0.01"
          pos="0.8,-0.8"
          textAlign="right" />
      </g>
      <g class="ships">
        <ship
          v-for="ship in ships"
          v-bind="ship"
          :isPlayer="ship.id === playerId"
          :key="ship.id"
        />
      </g>
      <g class="asteroids">
        <asteroid
          v-for="asteroid in asteroids"
          v-bind="asteroid"
          :key="asteroid.id"
        />
      </g>
    </svg>
  `
}
