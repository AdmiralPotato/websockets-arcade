window.vectorTextDefsComponent = {
  name: 'vector-text-defs',
  created: function () {
    this.characterMap = {}
    Object.entries(window.vectorTextData).forEach(([id, characterData]) => {
      let data = []
      let vertA
      let vertB
      characterData.lines.forEach(line => {
        vertA = characterData.points[line[0]]
        const isLastVertSameAsFirstVert = (vertA && vertB === vertA)
        vertB = characterData.points[line[1]]
        if (!isLastVertSameAsFirstVert) {
          data.push(`M ${vertA.join()}`)
        }
        data.push(`L ${vertB.join()}`)
      })
      this.characterMap[id] = data.join(' ')
    })
  },
  template: `
    <defs class="vector-text-defs">
      <path
        v-for="(data,id) in characterMap"
        :id="'ch-' + id"
        :d="data"
      />
    </defs>
  `
}

const validAlignments = ['left', 'center', 'right']
window.vectorTextComponent = {
  name: 'vector-text',
  props: {
    text: {
      type: String
    },
    textAlign: {
      type: String,
      default: 'center',
      validator: (value) => {
        return validAlignments.includes(value)
      }
    },
    letterSpacing: {
      type: Number,
      default: 1
    },
    lineHeight: {
      type: Number,
      default: 6
    },
    fontSize: {
      type: Number,
      default: 1
    },
    scale: {
      type: Number,
      default: 0.05
    },
    pos: {
      type: String,
      default: '0,0'
    }
  },
  data: function () {
    return {
      characters: []
    }
  },
  created: function () {
    this.characterWidth = 2 // This is set static because of the design of the font.
    this.characterHeight = 4 // This is set static because of the design of the font.
    this.characterHeightOffset = 2 // This is set static because of the design of the font.
    this.cacheTextGeom()
  },
  methods: {
    getStateString: function () {
      const t = this
      return (t.text + t.textAlign + t.characterWidth + t.letterSpacing + t.lineHeight + t.fontSize).toString()
    },
    cacheTextGeom: function () {
      const t = this
      const textAlignTypes = {
        left: {
          charOffset: function () {
            return 0
          },
          spacingOffset: 0
        },
        right: {
          charOffset: function (num) {
            return -num
          },
          spacingOffset: t.letterSpacing
        },
        center: {
          charOffset: function (num) {
            // Plus 2 because each character is 2 wide.
            return -(num / 2)
          },
          spacingOffset: t.letterSpacing / 2
        }
      }
      t.characters = []
      if (textAlignTypes.hasOwnProperty(t.textAlign)) {
        const offsetSpacing = textAlignTypes[t.textAlign].spacingOffset
        const linesOText = t.text.split('\n')
        linesOText.forEach((line, lineIndex) => {
          let offsetCharCount = textAlignTypes[t.textAlign].charOffset(line.length)
          line.split('').forEach((char) => {
            if (char === ' ') {
                  // This is a space character.
                  // I need to bump over the text by one char,
                  // but I don't need to add any geom.
            } else if (char === '\t') {
                  // This is a tab character.
                  // I need to bump over the text by TWO chars,
                  // but I don't need to add any geom.
              offsetCharCount += 1
            } else if (window.vectorTextData.hasOwnProperty(char)) {
              t.characters.push({
                char,
                pos: [
                  (((t.characterWidth + t.letterSpacing) * offsetCharCount) + offsetSpacing) * t.fontSize,
                  ((t.lineHeight * lineIndex) - t.characterHeightOffset) * t.fontSize
                ],
                scale: t.fontSize
              })
            } else {
              throw new Error('This font does not contain the character "' + char + '"')
            }
            offsetCharCount += 1
          })
          offsetCharCount = 0
        })
      }

      t.stringCached = t.getStateString()
    }
  },
  template: `
    <g class="vector-text" :transform="'translate('+ pos +'),scale('+ scale +')'">
      <use
        v-for="(item,index) in characters"
        :key="'ch-' + item.char + '-' + index"
        :xlink:href="'#ch-' + item.char" :transform="'translate(' + item.pos + '),scale('+ fontSize +')'"
      />
    </g>
  `
}
