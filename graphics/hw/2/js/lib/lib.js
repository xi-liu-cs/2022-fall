function shader_init(gl, vertex, fragment)
{
    vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex_shader, vertex);
    gl.compileShader(vertex_shader);
    fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment_shader, fragment);
    gl.compileShader(fragment_shader);
    program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.program = program;
}