attribute vec3 a_vec3position;

uniform mat4 u_mat4transform;
uniform mat4 u_mat4perspective;
uniform vec3 u_color;

varying vec3 v_color;

void main() {
  v_color = u_color + (a_vec3position * 0.5);
  gl_Position = u_mat4perspective * u_mat4transform * vec4(a_vec3position, 1.0);
}
