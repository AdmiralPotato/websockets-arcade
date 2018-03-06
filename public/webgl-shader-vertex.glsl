attribute vec3 a_vec3position;

uniform mat4 u_mat4transform;
uniform mat4 u_mat4perspective;

void main() {
  gl_Position = u_mat4perspective * u_mat4transform * vec4(a_vec3position, 1.0);
}
