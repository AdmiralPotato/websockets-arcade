const socket = window.io.connect('//')
const appTargetElement = document.getElementById('appTarget')
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')
let state = {}
let lastPixelScale
let lastBoundingRect
let animationFrameRequestId
const loop = (time) => {
  animationFrameRequestId = window.requestAnimationFrame(loop)
  detectNeedForResize()
  drawScene()
}
const detectNeedForResize = () => {
  const pixelScale = window.devicePixelRatio || 1
  const boundingRect = canvas.parentNode.getBoundingClientRect()
  if (
    !lastPixelScale ||
    lastPixelScale !== pixelScale ||
    !lastBoundingRect ||
    lastBoundingRect.width !== boundingRect.width ||
    lastBoundingRect.height !== boundingRect.height
  ) {
    resize(
      boundingRect.width * pixelScale,
      boundingRect.height * pixelScale
    )
    lastPixelScale = pixelScale
    lastBoundingRect = boundingRect
  }
}
const resize = (width, height) => {
  console.log('resize:', {width, height})
  canvas.width = width
  canvas.height = height
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
}
const initResources = async () => {
  await Promise.all([
    initShaders(),
    initBuffers()
  ])
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.enable(gl.DEPTH_TEST)
  loop(window.performance.now())
}
let shaderSourcesPromise
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
}
const getAssetText = (path) => {
  let succeed, fail
  const promise = new Promise((resolve, reject) => {
    succeed = resolve
    fail = reject
  })
  const request = new XMLHttpRequest()
  request.open('GET', path, true)
  request.addEventListener('load', () => {
    succeed(request.responseText)
  })
  request.addEventListener('error', () => {
    fail(request.responseText)
  })
  request.send()
  return promise
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
const initBuffers = async () => {
  const shipShape = [
    1, 0, 0,
    -1, -1, 0,
    -1, 1, 0
  ]
  const shipShapeBuffer = makeBufferForVertList(shipShape)
}
const makeBufferForVertList = (vertList) => {
  const elementsPerVert = 3
  const numVerts = vertList / elementsPerVert
  const vertexSize = elementsPerVert * Float32Array.BYTES_PER_ELEMENT
  const buffer = new ArrayBuffer(numVerts * vertexSize)
  const positionArray = new Float32Array(vertList)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW)
  vertList.forEach((vertexComponent, i) => {
    positionArray[i] = vertexComponent
  })
  return positionArray
}
const drawScene = () => {
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);

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
