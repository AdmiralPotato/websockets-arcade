const socket = window.io.connect('//')
const appTargetElement = document.getElementById('appTarget')
const canvas = document.createElement('canvas')
let gl = canvas.getContext('webgl')
if (!gl) {
  gl = canvas.getContext('experimental-webgl')
}
if (!gl) {
  alert('Sorry, your browser cannot WebGL.')
}
const initResources = async () => {
  await Promise.all([
    initShaders(),
    initBuffers()
  ])
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.disable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.blendEquation(gl.FUNC_ADD)
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  loop(window.performance.now())
}
let shaderSourcesPromise
let shaderProgram
const initShaders = async () => {
  // const vertexShader = createShader(gl)
  const sourcesMap = {
    fragment: '/webgl-shader-fragment.glsl',
    vertex: '/webgl-shader-vertex.glsl'
  }
  const entries = Object.entries(sourcesMap)
  if (!shaderSourcesPromise) {
    shaderSourcesPromise = Promise.all(entries.map(([key, path]) => {
      return getAssetText(path)
    }))
  }
  const shaderSources = {}
  const shaders = {}
  const loadedShaders = await shaderSourcesPromise
  loadedShaders.forEach((result, index) => {
    const key = entries[index][0]
    const type = key.toLocaleUpperCase().includes('VERTEX') ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
    shaderSources[key] = result
    shaders[key] = createShader(gl, result, type)
  })
  console.log('initShaders: Complete', {shaderSources, shaders})
  shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, shaders.vertex)
  gl.attachShader(shaderProgram, shaders.fragment)
  gl.linkProgram(shaderProgram)
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Could not initialise shaders')
  }
  gl.useProgram(shaderProgram)
  shaderProgram.a_vec3position = gl.getAttribLocation(shaderProgram, 'a_vec3position')
  gl.enableVertexAttribArray(shaderProgram.a_vec3position)
  shaderProgram.a_vec3normal = gl.getAttribLocation(shaderProgram, 'a_vec3normal')
  gl.enableVertexAttribArray(shaderProgram.a_vec3normal)
  shaderProgram.u_mat4transform = gl.getUniformLocation(shaderProgram, 'u_mat4transform')
  shaderProgram.u_mat4perspective = gl.getUniformLocation(shaderProgram, 'u_mat4perspective')
  shaderProgram.u_color = gl.getUniformLocation(shaderProgram, 'u_color')
}
const getAssetText = async (path) => {
  const fetchPromise = await fetch(path)
  return fetchPromise.text()
}
const createShader = (gl, sourceCode, type) => {
  // Compiles either a shader of type gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
  const shader = gl.createShader(type)
  gl.shaderSource(shader, sourceCode)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader)
    throw new Error('Could not compile WebGL program. \n\n' + info)
  }
  return shader
}
let shapeBuffers = {}
let arrayBuffers = {}
const initBuffers = async () => {
  const boundingShape = [
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    -1, 1, 0
  ]
  arrayBuffers.boundingBox = makeArrayBufferForVertList(boundingShape)
  arrayBuffers.circle = makeCircle(36)
  arrayBuffers.meteors = []
  for (let i = 0; i < 10; i++) {
    arrayBuffers.meteors.push(
      makeMeteor()
    )
  }
  shapeBuffers = await window.gltfLoader(gl, '/webgl-models-split.gltf')
  shapeBuffers.meteors = [
    shapeBuffers.meteor_0,
    shapeBuffers.meteor_1,
    shapeBuffers.meteor_2
  ]
}
const makeMeteor = () => {
  const points = []
  const segments = 10 + Math.round(Math.random() * 5)
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const radius = 0.75 + (Math.random() * 0.5)
    points.push(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0
    )
  }
  return makeArrayBufferForVertList(points)
}
const makeCircle = (segments) => {
  const points = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    points.push(
      Math.cos(angle),
      Math.sin(angle),
      0
    )
  }
  return makeArrayBufferForVertList(points)
}
const makeArrayBufferForVertList = (vertList) => {
  const elementsPerVert = 3
  return makeBufferForTypedArray({
    count: vertList.length / elementsPerVert,
    data: new Float32Array(vertList),
    type: 'VEC3',
    elements: elementsPerVert,
    glTargetName: 'ARRAY_BUFFER',
    glTarget: gl['ARRAY_BUFFER']
  })
}
const makeBufferForTypedArray = (config) => {
  const buffer = gl.createBuffer()
  gl.bindBuffer(config.glTarget, buffer)
  gl.bufferData(config.glTarget, config.data, gl.STATIC_DRAW)
  buffer.elements = config.elements
  buffer.numItems = config.count
  buffer.glTarget = config.glTarget
  buffer.glTargetName = config.glTargetName
  return buffer
}
let state = {}
let lastPixelScale
let lastBoundingRect
let animationFrameRequestId
let lastSceneState
const loop = (time) => {
  animationFrameRequestId = window.requestAnimationFrame(loop)
  const sceneState = JSON.stringify(state)
  const needsResize = detectNeedForResize()
  if (lastSceneState !== sceneState || needsResize) {
    drawScene()
    lastSceneState = sceneState
  }
}
const detectNeedForResize = () => {
  const pixelScale = window.devicePixelRatio || 1
  const boundingRect = appTargetElement.getBoundingClientRect()
  const needsResize = (
    !lastPixelScale ||
    lastPixelScale !== pixelScale ||
    !lastBoundingRect ||
    lastBoundingRect.width !== boundingRect.width ||
    lastBoundingRect.height !== boundingRect.height
  )
  if (needsResize) {
    resize(
      boundingRect.width * pixelScale,
      boundingRect.height * pixelScale
    )
    lastPixelScale = pixelScale
    lastBoundingRect = boundingRect
  }
  return needsResize
}
const mat4perspective = window.mat4.create()
const resize = (width, height) => {
  const aspect = width / height
  const desiredMinimumFov = Math.PI / 2
  const fovY = aspect >= 1 ? desiredMinimumFov : 2 * Math.atan(Math.tan(desiredMinimumFov / 2) / aspect)
  console.log('resize:', {width, height})
  canvas.width = width
  canvas.height = height
  gl.viewport(0, 0, width, height)
  window.mat4.perspective(
    mat4perspective,
    fovY,
    aspect,
    0.1,
    100.0
  )
  window.mat4.mul(mat4perspective, mat4perspective, mat4perspectiveTransform)
}
const mat4boundingTransform = window.mat4.create()
const mat4perspectiveTransform = window.mat4.fromTranslation(
  window.mat4.create(),
  window.vec3.fromValues(0, 0, -1)
)
const mat4transform = window.mat4.create()
const defaultColor = [1.0, 1.0, 1.0, 1.0]
const baseColor = [0.5, 0.5, 0.5, 1.0]
const starColor = [0.25, 0.25, 0.25, 1.0]
const consumableColor = [0.25, 0.75, 0.25, 1.0]
const drawScene = () => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.uniformMatrix4fv(shaderProgram.u_mat4perspective, false, mat4perspective)
  renderArrayBuffer({
    arrayBuffer: arrayBuffers.boundingBox,
    transform: mat4boundingTransform,
    color: baseColor,
    renderStyle: gl.LINE_LOOP
  })
  if (state.ships && state.ships.length) {
    state.ships.forEach((item) => {
      makeTransformsFromGameObject(mat4transform, item)
      renderShapeBuffer({
        shapeBuffer: shapeBuffers.player,
        transform: mat4transform,
        color: hueToRgba(item.hue)
      })
    })
  }
  if (state.meteors && state.meteors.length) {
    state.meteors.forEach((item) => {
      makeTransformsFromGameObject(mat4transform, item)
      let color = item.consumable ? consumableColor : baseColor
      if (item.invincible) {
        color = color.slice()
        color[3] = 0.25
      }
      renderShapeBuffer({
        shapeBuffer: shapeBuffers.meteors[item.id % shapeBuffers.meteors.length],
        transform: mat4transform,
        color: color
      })
    })
  }
  let circles = []
  if (state.startCircle) {
    circles.push(state.startCircle)
  }
  if (state.startCircles) {
    circles = circles.concat(state.startCircles)
  }
  if (state.bubbles) {
    circles = circles.concat(state.bubbles)
  }
  if (circles.length) {
    circles.forEach((item) => {
      makeTransformsFromGameObject(mat4transform, item)
      renderShapeBuffer({
        shapeBuffer: shapeBuffers.bubble,
        transform: mat4transform,
        color: item.hue !== null ? hueToRgba(item.hue, 0.25) : baseColor
      })
    })
  }
  if (state.stars) {
    state.stars.forEach((item) => {
      makeTransformsFromGameObject(mat4transform, item)
      renderShapeBuffer({
        shapeBuffer: shapeBuffers.star,
        transform: mat4transform,
        color: starColor
      })
    })
  }
}
const makeTransformsFromGameObject = (
  outMatrix = window.mat4.create(),
  gameObject
) => {
  window.mat4.identity(outMatrix)
  window.mat4.translate(
    outMatrix,
    outMatrix,
    window.vec3.fromValues(gameObject.x, -gameObject.y, 0)
  )
  if (gameObject.angle) {
    window.mat4.rotateZ(
      outMatrix,
      outMatrix,
      -gameObject.angle
    )
  }
  window.mat4.scale(
    outMatrix,
    outMatrix,
    window.vec3.fromValues(gameObject.radius, gameObject.radius, gameObject.radius)
  )
  return outMatrix
}
const cachedHueMap = {}
const hueToRgba = (hue, alpha = 1.0) => {
  const result = cachedHueMap[hue] || hsl2rgb([hue, 100, 50])
  cachedHueMap[hue] = result
  return [...result, alpha]
}
const renderShapeBuffer = (config) => {
  gl.uniformMatrix4fv(
    shaderProgram.u_mat4transform,
    false,
    config.transform || window.mat4.identity()
  )
  gl.uniform4fv(shaderProgram.u_color, config.color || [1, 1, 1, 1])
  bindShapeBuffer(config.shapeBuffer)
  gl.drawElements(
    config.renderStyle || gl.TRIANGLES,
    config.shapeBuffer.indices.count,
    config.shapeBuffer.indices.glType,
    0
  )
}
const bindShapeBuffer = (shapeBuffer) => {
  const indices = shapeBuffer.indices
  const position = shapeBuffer.POSITION
  const normal = shapeBuffer.NORMAL
  gl.bindBuffer(
    position.glTarget,
    position
  )
  gl.vertexAttribPointer(
    shaderProgram.a_vec3position,
    position.elements,
    position.glType,
    false,
    0,
    0
  )
  gl.bindBuffer(
    position.glTarget,
    normal
  )
  gl.vertexAttribPointer(
    shaderProgram.a_vec3normal,
    normal.elements,
    normal.glType,
    false,
    0,
    0
  )
  gl.bindBuffer(
    indices.glTarget,
    indices
  )
}

const renderArrayBuffer = (config) => {
  gl.uniformMatrix4fv(
    shaderProgram.u_mat4transform,
    false,
    config.transform || window.mat4.identity()
  )
  gl.uniform4fv(shaderProgram.u_color, config.color || defaultColor)
  bindArrayBuffer(config.arrayBuffer)
  gl.drawArrays(
    config.renderStyle || gl.TRIANGLES,
    0,
    config.arrayBuffer.numItems
  )
}
const bindArrayBuffer = (arrayBuffer) => {
  gl.bindBuffer(
    arrayBuffer.glTarget,
    arrayBuffer
  )
  gl.vertexAttribPointer(
    shaderProgram.a_vec3position,
    arrayBuffer.elements,
    gl.FLOAT,
    false,
    0,
    0
  )
}

canvas.addEventListener(
  'webglcontextcreationerror',
  (e) => {
    console.error(e)
    alert('Sorry, your browser is incapable of performing basic WebGL features\n' + e.statusMessage)
  },
  false
)
canvas.addEventListener(
  'webglcontextlost',
  (e) => {
    console.error(e)
    e.preventDefault()
    window.cancelAnimationFrame(animationFrameRequestId)
  },
  false
)
canvas.addEventListener(
  'webglcontextrestored',
  (e) => {
    console.log(e)
    initResources()
  },
  false
)
canvas.style = 'width: 100%; height: 100%;'
appTargetElement.appendChild(canvas)

initResources()

socket.on('state', function (data) {
  const lastStart = state.serverStart
  if (lastStart && lastStart !== data.serverStart) {
    socket.close()
    window.location.reload(true)
  }
  state = data
})

const hsl2rgb = function (hsl) {
  let h = hsl[0] / 360
  let s = hsl[1] / 100
  let l = hsl[2] / 100
  let t1
  let t2
  let t3
  let rgb
  let val

  if (s === 0) {
    val = l * 255
    return [val, val, val]
  }

  if (l < 0.5) {
    t2 = l * (1 + s)
  } else {
    t2 = l + s - l * s
  }

  t1 = 2 * l - t2

  rgb = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1)
    if (t3 < 0) {
      t3++
    }
    if (t3 > 1) {
      t3--
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3
    } else if (2 * t3 < 1) {
      val = t2
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6
    } else {
      val = t1
    }

    rgb[i] = val
  }

  return rgb
}
