window.gameDragonsHoardComponent = {
  shapeMap: {
    '▲': 'triangle',
    '■': 'square',
    '⏺': 'circle'
  },
  props: {
    mode: String,
    ships: Array,
    startCircle: Object,
    timer: Number,
    parts: Array,
    orders: Array,
    track: Object,
    dragonOrder: Object
  },
  computed: {
    timerStatus: function () {
      return (new Date(0, 0, 0, 0, 0, ((this.timer || 0) / 100))).toTimeString().split(/( 00:| )/)[0].slice(3)
    },
    patienceBar: function () {
      return [
        `M -1, 0.5`,
        `L ${-1 + ((1 - this.dragonOrder.time) * 2)}, 0.5`
      ].join(' ')
    }
  },
  template: `
    <g class="game-dragons-hoard">
      <g
        v-if="track"
        class="track"
      >
        <polygon
          v-if="track.innerPoly"
          :points="track.innerPoly.toString()"
          class="bounds inner"
        />
        <polygon
          v-if="track.outerPoly"
          :points="track.outerPoly.toString()"
          class="bounds outer"
        />
        <polygon
          v-for="(poly, index) in track.polygons"
          :key="index"
          :points="poly.toString()"
          class="bounds inner"
        />
        <polygon :points="track.verts.toString()" class="center" />
        <g
          v-if="true || !track.isValid"
          class="verts"
        >
          <vert
            v-for="(item, index) in track.verts"
            :pos="item"
            :key="'a' + index"
            :radius="track.radius"
          />
          <vert
            v-for="(item, index) in track.treasureVerts"
            :pos="item"
            :key="'b' + index"
            :radius="track.staticRadius"
          />
        </g>
      </g>
      <g class="mode-intro"
        v-if="mode === 'intro'"
      >
        <countdown-circle
          v-bind="startCircle"
        />
        <vector-text
          text="Dragon's Hoard"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          text="Help the Dragon build the perfect Hoard\nwith shapes of its choosing!"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
      <g class="mode-play"
        v-if="mode === 'play'"
      >
        <vector-text
          class="text-timer"
          :text="timerStatus"
          :scale="0.01"
          pos="0,-0.9" />
      </g>

      <g class="mode-play"
        v-if="mode !== 'score'"
      >
        <defs
          class="ship-overlays"
        >
          <galaxy-diner-recipe
            v-for="(item, index) in ships"
            transform="translate(0, 0.06), scale(0.1, 0.1)"
            :id="'ship-overlay-' + item.id"
            :key="item.id"
            :recipe="item.recipe"
          />
        </defs>
        <g
          class="dragon"
        >
          <g
            class="dragon-transform"
            transform="
              scale(0.00390625, 0.00390625)
              translate(-256, -256)
            "
          >
            <polygon id="body" class="st5" points="320.8999023,287.8106384 321.2646179,265.4319153 316.5,259.5 317.5,244.5 304.5,239
\t305.5,222 291,217.5 286,203 269,208 253.5,196.5 236,209 217.5,203 210.5,222.5 194.5,224.5 194.5,242 183.7667542,248.4241028
\t177.9313049,289.1533508 "/>
            <g id="hoard">
              <path class="st6" d="M256.5540771,167.2807617l6.7266846-18.8348389l-18.8348389-6.7267456l-1.5407104,4.3139648
\t\tl-4.3803101-9.7525024l-18.2442017,8.194458l3.77948,8.4147339l-6.4946289,0.6414185l1.9657593,19.9031982"/>
              <polyline class="st6" points="268.6921387,178.1906128 265.5737915,158.9550171 257.0075073,160.34375 257.7033081,156.0888672
\t\t238.4719849,152.9438477 237.6033936,158.255249 227.7507324,154.6164551 222.3417969,169.262207 217.3381348,170.0733643
\t\t220.4564819,189.309021 \t"/>
              <polyline class="st6" points="269.4412842,198.1257935 273.0205078,173.3123169 248.2070313,169.7331543 247.3895874,175.4003906
\t\t234.2359619,167.8061523 226.9840698,180.3668823 213.4446411,182.5618286 217.4564819,207.309021 \t"/>
              <polyline class="st6" points="284.6273804,211.7421265 280.0604248,183.571228 265.3152466,185.9616699 256.5089111,183.3378296
\t\t256.0604248,180.571228 227.8895874,185.1381836 229.4682007,194.8758545 218.2286377,192.4310913 212.9754639,216.5817871 \t"/>
              <polyline class="st6" points="286.6273804,248.7421265 282.5150757,223.3755493 288.5006714,211.8602905 263.1786499,198.697937
\t\t259.9786987,204.854126 231.8148193,198.6729126 228.7599487,211.0789795 209.8895874,214.1381836 214.4564819,242.309021 \t"/>
              <polyline class="st6" points="303.5440674,258.2520142 290.7819214,229.1339111 281.8876343,233.0321655 276.2605591,214.2799072
\t\t257.3266602,219.9614868 232.633728,215.7125854 230.6865234,227.0287476 210.5535889,236.184082 204.633728,235.7125854
\t\t199.2424927,267.0441895 \t"/>
              <polyline class="st6" points="314.5,286.5 308.5,257.5 297.5,259.5 296.5,250.5 281.2848511,249.1599121 280.597168,234.9465942
\t\t259.6377563,235.9606323 250.7314453,228.7276611 244.0429688,236.963501 231.0084229,234.5817261 228.8165283,246.5771484
\t\t216.8488159,245.4605103 214.668396,268.8291626 \t"/>
              <polyline class="st6" points="235.6291504,273.2145386 226.4634399,258.8607178 240.8172607,249.6949463 246.3070679,258.2922363
\t\t248.5,255.5 256.7078857,255.8303223 256.7078857,251.5 277.1779785,251.5 277.1779785,259.8706665 283.1258545,257.2202148
\t\t291.4577637,275.9179688 301.5,275.9179688 304.5,285.5 \t"/>
              <polyline class="st6"
                        points="288.5,286.5 275.8172607,265.6949463 267.5,271.0060425 267.5,266.5 247.5,267.5 247.5,286 \t"/>
            </g>
            <g id="head">
              <polyline class="st5" points="189.6022034,264.0892029 193.9787903,269.0125122 198.720108,265.4319153 207.1085663,267.6697998
\t\t207.1085663,252.0046997 219.1441956,260.9561768 238.1094208,260.9561768 241.0271454,271.2503967 257.4393616,273.0406799
\t\t257.4393616,289.1533508 177.9313049,289.1533508 183.7667542,248.4241028 \t"/>
              <polygon class="st5" points="224.6757202,264.7237854 234.5,270.5 225.0072784,269.8739319 \t"/>
            </g>
            <g id="tail">
              <polyline class="st5" points="321.2646179,265.4319153 320.8999023,287.8106384 262.1806641,289.1533508 276.7692871,281.9921875
\t\t284.5,274 296.25,275.5 305.4109497,268.9197998 315.2582703,274.2906799 \t"/>
              <polyline class="st5" points="320.5,287.5 372.5839844,288.7214355 357.9953308,281.5602417 350.2646179,273.5680847
\t\t338.5146179,275.0680847 329.3536987,268.4878845 319.5063477,273.8587646 \t"/>
            </g>
          </g>
        </g>
        <g class="dragonOrder"
           :transform="'translate(' + dragonOrder.x + ', ' + dragonOrder.y + '), scale(' + dragonOrder.radius + ',' + dragonOrder.radius + ')'"
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
            :recipe="dragonOrder.recipe"
          />
        </g>
        <g class="parts">
          <g
            v-for="(item, index) in parts"
            :key="item.char"
            :transform="'translate(' + item.x + ', ' + item.y + '), scale(' + item.radius + ',' + item.radius + ')'"
            :class="{hit: !item.hit}"
          >
            <use
              :xlink:href="'#path-' + $options.shapeMap[item.type]"
            />
            <path-circle :r="1.5" />
          </g>
        </g>
      </g>
      <g class="mode-score"
        v-if="mode === 'score'"
      >
        <vector-text
          text="HOARD IS COMPLETE"
          :scale="0.04"
          pos="0,-0.8" />
        <vector-text
          class="text-timer"
          :text="'Next round in: ' + timerStatus"
          :scale="0.01"
          pos="0,-0.5" />
        <vector-text
          text="WHO IS DRAGON'S FAVORITE?!?"
          :scale="0.01"
          pos="0,-0.6" />
      </g>
    </g>
  `
}
