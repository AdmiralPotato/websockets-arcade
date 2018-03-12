window.gltfLoader = async (gl, path) => {
  const gltfFetch = await fetch(path)
  const gltf = await gltfFetch.json()
  const buffers = await Promise.all(gltf.buffers.map(async (item) => {
    const bufferFetch = await fetch(item.uri)
    const buffer = await bufferFetch.arrayBuffer()
    return buffer
  }))

  const meshes = {}
  gltf.meshes.forEach((item) => {
    const mesh = {}
    meshes[item.name] = mesh
    item.primitives.forEach((primitive) => {
      Object.entries(primitive.attributes).forEach(([attributeName, index]) => {
        mesh[attributeName] = getDataForAccessorIndex(
          gl,
          gltf,
          buffers,
          index
        )
      })
      const indicesAccessor = getDataForAccessorIndex(
        gl,
        gltf,
        buffers,
        primitive.indices
      )
      mesh.indices = indicesAccessor
    })
  })
  console.log('gltfLoader', {gltf, buffers, meshes})
  return meshes
}
const componentTypeToTypedContructorMap = {
  5120: Int8Array, // 1
  5121: Uint8Array, // 1
  5122: Int16Array, // 2
  5123: Uint16Array, // 2
  5125: Uint32Array, // 4
  5126: Float32Array // 4
}
const elementCountMap = {
  'SCALAR': 1,
  'VEC2': 2,
  'VEC3': 3,
  'VEC4': 4
}
const getDataForAccessorIndex = (gl, gltf, buffers, accessorIndex) => {
  const accessor = gltf.accessors[accessorIndex]
  const bufferView = gltf.bufferViews[accessor.bufferView]
  const buffer = buffers[bufferView.buffer]
  const TypedArrayConstructor = componentTypeToTypedContructorMap[accessor.componentType]
  const elements = elementCountMap[accessor.type]
  const typedArray = new TypedArrayConstructor(buffer, bufferView.byteOffset, accessor.count * elements)
  const glTargetName = getPropertyNameById(gl, bufferView.target)
  const glTypeName = getPropertyNameById(gl, accessor.componentType)
  const glBuffer = gl.createBuffer()
  gl.bindBuffer(bufferView.target, glBuffer)
  gl.bufferData(bufferView.target, typedArray, gl.STATIC_DRAW)
  glBuffer.elements = elements
  glBuffer.count = accessor.count
  glBuffer.glTarget = bufferView.target
  glBuffer.glTargetName = glTargetName
  glBuffer.glType = accessor.componentType
  glBuffer.glTypeName = glTypeName
  return glBuffer
}

let glMap
const getPropertyNameById = (gl, index) => {
  if (!glMap) {
    glMap = {}
    Object.entries(gl).forEach(([key, value]) => {
      if (typeof value === 'number') {
        glMap[value] = key
      }
    })
  }
  return glMap[index]
}
