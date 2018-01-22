global.tau = Math.PI * 2
global.arrayRemove = function (array, item) {
  let index
  while ((index = array.indexOf(item)) !== -1) {
    array.splice(index, 1)
  }
  return array
}
global.bound = (min, max, value) => {
  return Math.min(max, Math.max(min, value))
}
global.detectCollision = (a, b) => {
  const diffX = a.x - b.x
  const diffY = a.y - b.y
  const distance = Math.sqrt((diffX * diffX) + (diffY * diffY))
  return distance < a.radius + b.radius
}
global.wrap = (target) => {
  target.x = (Math.abs(target.x) > 1 ? -1 * Math.sign(target.x) : target.x) || 0
  target.y = (Math.abs(target.y) > 1 ? -1 * Math.sign(target.y) : target.y) || 0
}
global.randomEdgePosition = () => {
  const angle = Math.random() * global.tau
  const radius = 2
  return {
    x: global.bound(-1, 1, Math.cos(angle) * radius),
    y: global.bound(-1, 1, Math.sin(angle) * radius)
  }
}
global.lerp = (a, b, progress) => {
  return a + ((b - a) * progress)
}
