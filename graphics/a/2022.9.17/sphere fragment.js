let vertex =
`attribute vec4 a_Position;
attribute vec4 a_Normal;
uniform mat4 u_MvpMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_NormalMatrix;
varying vec4 v_Color;
varying vec3 v_Normal;
varying vec3 v_Position;
void main()
{
  vec4 color = vec4(1.0, 1.0, 1.0, 1.0);
  gl_Position = a_Position * u_MvpMatrix;
  v_Position = vec3(a_Position * u_ModelMatrix);
  v_Normal = normalize(vec3(a_Normal * u_NormalMatrix));
  v_Color = color;
}`;

let fragment =
  `#ifdef GL_ES
    precision mediump float;
  #endif
  uniform vec3 u_LightColor;
  uniform vec3 u_LightPosition;
  uniform vec3 u_AmbientLight;
  varying vec3 v_Normal;
  varying vec3 v_Position;
  varying vec4 v_Color;
  void main()
  {
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LightPosition - v_Position);
    float nDotL = max(dot(lightDirection, normal), 0.0);
    vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;
    vec3 ambient = u_AmbientLight * v_Color.rgb;
    gl_FragColor = vec4(diffuse + ambient, v_Color.a);
  }`;

function array_buffer_init(gl, attribute, data, type, num)
{
  let buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  let a_attribute = gl.getAttribLocation(gl.program, attribute);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
  return true;
}

function vertex_buffer_init(gl)
{
  let sphere_div = 20,
  i, ai, si, ci,
  j, aj, sj, cj,
  p1, p2,
  positions = [],
  indices = [];
  for(j = 0; j <= sphere_div; ++j)
  {
    aj = j * Math.PI / sphere_div;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for(i = 0; i <= sphere_div; i++)
    {
      ai = i * 2 * Math.PI / sphere_div;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      positions.push(si * sj);  /* x */
      positions.push(cj);       /* y */
      positions.push(ci * sj);  /* z */
    }
  }
  for (j = 0; j < sphere_div; j++)
  {
    for (i = 0; i < sphere_div; i++)
    {
      p1 = j * (sphere_div + 1) + i;
      p2 = p1 + (sphere_div + 1);
      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);
      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }
  if(!array_buffer_init(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if(!array_buffer_init(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  let index_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}

function main()
{
  let canvas = document.getElementById('sphere fragment'),
  gl = canvas.getContext('webgl');
  shader_init(gl, vertex, fragment);
  let n = vertex_buffer_init(gl);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix'),
  u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix'),
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix'),
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor'),
  u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition'),
  u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
  gl.uniform3f(u_LightPosition, 5.0, 8.0, 7.0);
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
  let modelMatrix = new matrix4(),
  mvpMatrix = new matrix4(),
  normalMatrix = new matrix4();
  modelMatrix.rotate_set(90, 0, 1, 0);
  mvpMatrix.perspective_set(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.look_at(new vec3(0, 0, 6), new vec3(0, 0, 0), new vec3(0, 1, 0));
  mvpMatrix.mul(modelMatrix);
  normalMatrix.inverse_set(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.a);
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.a);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.a);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}
