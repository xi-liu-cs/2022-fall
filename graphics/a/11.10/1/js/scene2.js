
rooms.scene2 = function() {

lib3D2();

description = `<b>Scene 2</b>
               <p>
               Nice little mobius strip created with loops
               <p> <input type=range id=ring min=10 max=100 value=50> Smoothness`;

code = {
'init':`

   S.drawMesh = (mesh, matrix) => {
      let gl = S.gl;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      S.gl.drawArrays(S.gl.TRIANGLES, 0, mesh.length / S.VERTEX_SIZE);
   }

`,
fragment: `
S.setFragmentShader(\`
   varying vec3 vPos, vNor;
   void main() {
      float c = .2 + .8 * max(0.,dot(vNor,vec3(.57)));
      gl_FragColor = vec4(c,c,c,1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`

   attribute vec3 aPos, aNor;
   varying   vec3 vPos, vNor;
   uniform   mat4 uMatrix, uInvMatrix, uProject;

   void main() {
      vec4 pos = uProject * uMatrix * vec4(aPos, 1.);
      vec4 nor = vec4(aNor, 0.) * uInvMatrix;
      vPos = pos.xyz;
      vNor = normalize(nor.xyz);
      gl_Position = pos * vec4(1.,1.,-.01,1.);
   }

\`)
`,
render: `
   S.setUniform('Matrix4fv', 'uProject', false,
      [1,0,0,0, 0,1,0,0, 0,0,1,-.2, 0,0,0,1]);

   let m = new Matrix();

   m.identity();
   m.rotx(-time);
   m.scale([.2,.2,.2]);

   let r = ring.value;

   for (let i = 0; i < r; i++) {
      let a = 2 * Math.PI * (i / r);
      let b = 2 * Math.PI * ((i + 1) / r);

      // TILTED ANGLE
      let c = Math.PI * (i / r);
      let d = Math.PI * ((i + 1) / r);

      // CURRENT RING

      let v1 = [3 * Math.cos(a), 3 * Math.sin(a), 0, 
                Math.cos(a), Math.sin(a), Math.sin(c), 
                0, 0];
      let v2 = [3 * Math.cos(a) - .3 * Math.sin(c), 3 * Math.sin(a) - .3 * Math.sin(c), Math.cos(c),
                Math.cos(a) - .1 * Math.sin(c), Math.sin(a) - .1 * Math.sin(c), Math.sin(c),
                0, 0];
      let v3 = [3 * Math.cos(a) + .3 * Math.sin(c), 3 * Math.sin(a) + .3 * Math.sin(c), -Math.cos(c),
                Math.cos(a) - .1 * Math.sin(c), Math.sin(a) - .1 * Math.sin(c), Math.sin(c),
                0, 0];

      // NEXT RING

      let v4 = [3 * Math.cos(b), 3 * Math.sin(b), 0,
                Math.cos(b), Math.sin(b), Math.sin(d),
                0, 0];
      let v5 = [3 * Math.cos(b) - .3 * Math.sin(d), 3 * Math.sin(b) - .3 * Math.sin(d), Math.cos(d),
                Math.cos(b) - .1 * Math.sin(d), Math.sin(b) - .1 * Math.sin(d), Math.sin(d),
                0, 0];
      let v6 = [3 * Math.cos(b) + .3 * Math.sin(d), 3 * Math.sin(b) + .3 * Math.sin(d), -Math.cos(d),
                Math.cos(b) - .1 * Math.sin(d), Math.sin(b) - .1 * Math.sin(d), Math.sin(d),
                0, 0];

      let triangle1 = v2.concat(v1.concat(v4));
      let triangle2 = v3.concat(v1.concat(v4));
      let triangle3 = v5.concat(v2.concat(v4));
      let triangle4 = v6.concat(v3.concat(v4));

      S.drawMesh(triangle1, m.get()); 
      S.drawMesh(triangle2, m.get()); 
      S.drawMesh(triangle3, m.get()); 
      S.drawMesh(triangle4, m.get());  
   }
/*
   for (let i = 0; i < 6; i++) {
      let a = i * Math.PI / 3;
      let b = (i + 1) * Math.PI / 3;

      let triangle = [];

      triangle.push(Math.cos(a), Math.sin(a), 0, 0, 0, 1, 1, 1);
      triangle.push(Math.cos(b), Math.sin(b), 0, 0, 0, 1, 1, 1);
      triangle.push(0, 0, 0, 0, 0, 1, 1, 0);

      S.drawMesh(triangle, m.get());           
   }

   for (let i = 0; i < 12; i++) {
      let a = i * Math.PI / 3;
      let b = (i + 1) * Math.PI / 3;

      let triangle = [];
   }
*/
`,
events: `
   ;
`
};

}

