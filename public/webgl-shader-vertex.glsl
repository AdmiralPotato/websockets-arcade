attribute vec3 a_vec3position;
attribute vec3 a_vec3normal;

uniform mat4 u_mat4transform;
uniform mat4 u_mat4perspective;
uniform vec4 u_color;

varying vec4 v_color;

// ref: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Lighting_in_WebGL
const vec3 ambientLight = vec3(0.3, 0.3, 0.3);
const vec3 directionalLightColor = vec3(3.0);
const vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

void main() {
  mat4 completeTransfrom =  u_mat4perspective * u_mat4transform;
  vec4 normal = completeTransfrom * vec4(a_vec3normal, 0.0);
  gl_Position = completeTransfrom * vec4(a_vec3position, 1.0);
  float directional = max(dot(normal.xyz, directionalVector), 0.0);
  v_color.xyz = u_color.xyz * (ambientLight + (directionalLightColor * directional));
  v_color[3] = u_color[3];
}
