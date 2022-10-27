function webGLStart() {
	reflectTag = document.querySelector("#reflectFloor input");
	fogTag = document.querySelector("#useFog input");
    colorTag = document.querySelector("#useColor input");
    backgoundColorTag = document.querySelector("#useBackgroundColor input");
	fogDensityTag = document.getElementById("fogDensityRange");
    viewPointTag = document.getElementById("viewPointRange");

    redTag = document.getElementById('red');
    greenTag = document.getElementById('green');
    blueTag = document.getElementById('blue');

    canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders()

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  //  背景色为黑，清空颜色缓冲区

    gl.clearDepth(1.0);                //  清空深度缓冲区

    initBuffers();
    
    initKeyEvent();
}

function initGL(canvas) {
    try {
        gl = WebGLUtils.setupWebGL(canvas);   // 获取上下文  设置视口
        gl.viewport(0, 0, canvas.width, canvas.height);
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function getShader(gl, id) {
    const shaderScript = document.getElementById(id);
    if (!shaderScript)
        return null;

    let shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
     // 向着色器指定glsl代码
	gl.shaderSource(shader, shaderScript.textContent);
	 // 编译类似于c/c++的glsl代码
    gl.compileShader(shader);
     // 如果编译出错的话，报告错误
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders() {
    const fragmentShader = getShader(gl, "shader-fs");  //创建着色器对象
    const vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();             // 创建程序对象
    gl.attachShader(shaderProgram, vertexShader);   // 为程序对象分配着色器对象
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);                  //将两个着色器连接起来
    

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);                   // 通知webgl系统所用的程序对象
    // 获取attribute变量的存储位置，将坐标传入着色器，attribute是顶点着色器用的
    aVertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(aVertexPosition);

    aPlotPosition = gl.getAttribLocation(shaderProgram, "aPlotPosition");
    gl.enableVertexAttribArray(aPlotPosition);  // 连接attribute变量和分配的缓冲区对象
    // 获取uniform变量的存储位置，将坐标传入着色器，uniform是片元着色器用的
    
    cameraPos = gl.getUniformLocation(shaderProgram, "cameraPos");
    sphere1Center = gl.getUniformLocation(shaderProgram, "sphere1Center");
	
	isReflectFloor = gl.getUniformLocation(shaderProgram, "uReflectFloor");
	isUseFog = gl.getUniformLocation(shaderProgram, "uUseFog");
	fogDensity = gl.getUniformLocation(shaderProgram, "uFogDensity");

    isUseColor = gl.getUniformLocation(shaderProgram,"uUseColor");
    uColorValue = gl.getUniformLocation(shaderProgram,"uColorValue");

    isUseBackgoundColor = gl.getUniformLocation(shaderProgram,"uUseBackgroundColor");
    uBackgroundColorValue = gl.getUniformLocation(shaderProgram,"uBackgroundColorValue");


}

function initBuffers() {
    // 缓冲区的创建、绑定，向缓冲区写数据，将缓冲区对象分配给attribute变量
   vertexPositionBuffer = gl.createBuffer();
   //缓冲区对象包含了顶点的数据
   gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
   const vertices = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   // 将整个缓冲区对象分配给attribute变量
   gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
   
   const plotPositionBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, plotPositionBuffer);
   gl.vertexAttribPointer(aPlotPosition, 3, gl.FLOAT, false, 0, 0);
     
}

function preventDefault(e) {    // 阻止默认事件，考虑兼容性
	if (e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	};
}

function initKeyEvent() {
	document.addEventListener('keydown', function(e) {
		const event = e || window.event;
		switch(event.keyCode) {
		case 37:                    // left
			x1-=0.01; 
			preventDefault(e);
			break;
		case 38:                    // 上，远离屏幕
			z1-=0.01;
			preventDefault(e);
			break;
		case 39:
			x1+=0.01;
			preventDefault(e);
			break;
		case 40:
			z1+=0.01;
			preventDefault(e);
			break;
		}
	});
}

function pushVector(vector, arr) {
	arr.push(vector.x);
	arr.push(vector.y);
	arr.push(vector.z);
}

//  初始化参数
let gl;
let reflectTag, isReflectFloor;
let fogTag, isUseFog, fogDensityTag, fogDensity, viewPointTag,isUseColor,isUseBackgoundColor,uColorValue,redTag,greenTag,blueTag;
let shaderProgram;
let aVertexPosition;
let aPlotPosition;
let cameraPos;
let sphere1Center;
let vertexPositionBuffer;
//相机从哪里看向哪里
const cameraFrom = Vector.create(0, 0.4, 1.1);
const cameraTo = Vector.create(0, 0, 0);
const up = Vector.create(0, 1, 0);

let x1 = 0;
let y1 = 0.1;
let z1 = 0;

function drawScene() {
	cameraFrom.y = Number(viewPointTag.value);
    // radio = height / width，计算宽高比
    const radio = canvas.height / canvas.width;
	const cameraPersp = 2;
	const cameraDir = cameraTo.substract(cameraFrom).normalize();  // 相机方向
	//  确定相机的中心和朝向
	//  camera line
	const cameraCenter = cameraFrom.add(cameraDir.multiply(cameraPersp));
	const cameraLeft = cameraDir.cross(up).normalize();
	const cameraTop = cameraLeft.cross(cameraDir).normalize().multiply(radio);
	
	const cameraLeftTop = cameraCenter.add(cameraLeft).add(cameraTop).normalize();
	const cameraRightTop = cameraCenter.substract(cameraLeft).add(cameraTop).normalize();
	const cameraLeftBottom = cameraCenter.add(cameraLeft).substract(cameraTop).normalize();
	const cameraRightBottom = cameraCenter.substract(cameraLeft).substract(cameraTop).normalize();
	
	const corner = [];
	
	// Z字按照X轴翻转后的顺序,因为渲染时候的Y和浏览器的Y刚好相反
	pushVector(cameraRightTop, corner);
	pushVector(cameraLeftTop, corner);
	pushVector(cameraRightBottom, corner);
	pushVector(cameraLeftBottom, corner);
	// 向片段着色器传递uniform变量
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corner), gl.STATIC_DRAW);
	gl.uniform3f(cameraPos, cameraFrom.x, cameraFrom.y, cameraFrom.z);
	gl.uniform3f(sphere1Center, x1, y1, z1);
	gl.uniform1i(isReflectFloor, reflectTag.checked);
	gl.uniform1i(isUseFog, fogTag.checked);
	gl.uniform1f(fogDensity, fogDensityTag.value);
   
	gl.uniform1i(isUseColor,colorTag.checked);
    gl.uniform3f(uColorValue,redTag.value/100,greenTag.value/100,blueTag.value/100);

    gl.uniform1i(isUseBackgoundColor,backgoundColorTag.checked);
    gl.uniform3f(uBackgroundColorValue,redTag.value/100,greenTag.value/100,blueTag.value/100);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);   // 绘制三角形带
	requestAnimFrame(drawScene);
}