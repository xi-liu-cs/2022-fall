function lib(gl, vertex_size)
{
    let shader_array =
    [
        ['glsl/0.frag', 'glsl/0.vert'],
    ];
    gl.fragment = [];
    gl.vertex = [];
    gl.program = [];

    function shader_load(type, source)
    {
        let shader = gl.createShader(type);
        if(!shader)
        {
          console.log('cannot create shader');
          return null;
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let compile = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if(!compile)
        {
            let error = gl.getShaderInfoLog(shader);
            console.log('cannot compile shader: ' + error);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function shader_init(shader_i)
    {
        let fragment = gl.fragment[shader_i],
        vertex = gl.vertex[shader_i],
        fragment_shader = shader_load(gl.FRAGMENT_SHADER, fragment),
        vertex_shader = shader_load(gl.VERTEX_SHADER, vertex),
        program = gl.createProgram();
        gl.attachShader(program, vertex_shader);
        gl.attachShader(program, fragment_shader);
        gl.linkProgram(program);
        let link = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(!link)
        {
            let error = gl.getProgramInfoLog(program);
            console.log(error);
            gl.deleteProgram(program);
            gl.deleteShader(fragment_shader);
            gl.deleteShader(vertex_shader);
            return;
        }
        gl.useProgram(program);
        gl.program[shader_i] = program;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clearDepth(-1);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        vertex_init();
    }

    function vertex_init(shader_i)
    {
        let bpe = Float32Array.BYTES_PER_ELEMENT;
        let program = gl.program[shader_i];
        let a_pos = gl.getAttribLocation(program, 'a_pos');
        if(a_pos >= 0)
        {
            gl.enableVertexAttribArray(a_pos);
            gl.vertexAttribPointer(a_pos , 3, gl.FLOAT, false, vertex_size * bpe,  0 * bpe);
        }

        let a_nor = gl.getAttribLocation(program, 'a_nor');
        if(a_nor >= 0)
        {
            gl.enableVertexAttribArray(a_nor);
            gl.vertexAttribPointer(a_nor , 3, gl.FLOAT, false, vertex_size * bpe,  3 * bpe);
        }

        let a_uv = gl.getAttribLocation(program, 'a_uv');
        if(a_uv >= 0)
        {
            gl.enableVertexAttribArray(a_uv);
            gl.vertexAttribPointer(a_uv  , 2, gl.FLOAT, false, vertex_size * bpe,  6 * bpe);
        }

        let a_color = gl.getAttribLocation(program, 'a_color');
        if(a_color >= 0)
        {
            gl.enableVertexAttribArray(a_color);
            gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, vertex_size * bpe,  8 * bpe);
        }
    }

    function shader_file_load(gl, file, type, start, shader_i)
    {
        if(!type)
            gl.fragment[shader_i] = file;
        else
            gl.vertex[shader_i] = file;
        if(gl.fragment[shader_i] && gl.vertex[shader_i])
            start(shader_i);
    }

    function shader_file(gl, file, type, start, shader_i)
    {
        let request = new XMLHttpRequest();
        request.onreadystatechange =
        function()
        {
            if(request.readyState == 4 && request.status != 404)
                shader_file_load(gl, request.responseText, type, start, shader_i);
        };
        request.open('get', file, true);
        request.send();
    }

    for(let i = 0; i < shader_array.length; ++i)
        for(let j = 0; j < shader_array[i].length; ++j)
            shader_file(gl, shader_array[i][j], 0, shader_init, i);
}
