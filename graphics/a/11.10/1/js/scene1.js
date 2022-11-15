
rooms.scene1 = function() {

lib3D2();

description = `<b>Scene 1</b>
               <p>
               It's not a unit cone, but a taller cone looks good`;

code = {
'init':`

   let glueMeshes = (a,b) => {
       let mesh = a.slice();
       mesh = mesh.concat(a.slice(a.length - S.VERTEX_SIZE, a.length));
       mesh = mesh.concat(b.slice(0, S.VERTEX_SIZE));
       mesh = mesh.concat(b);
       return mesh;
   }

   let uvMesh = (f,nu,nv) => {
      let mesh = [];
      for (let iv = 0 ; iv < nv ; iv++) {
         let v = iv / nv;
	      let strip = [];
         for (let iu = 0 ; iu <= nu ; iu++) {
	         let u = iu / nu;
	         strip = strip.concat(f(u,v));
	         strip = strip.concat(f(u,v+1/nv));
	      }
	      mesh = glueMeshes(mesh, strip);
      }
      return mesh;
   }

   S.coneMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      return [cu * v , su * v , 2 * v - 1,
              cu     , su     , .5,
              u, v];
   }, 20, 10);

   S.diskMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      return [cu * v , su * v ,  1,
              0      , 0      , -1,
              u, v];
   }, 20, 10);

   S.drawMesh = (mesh, matrix) => {
      let gl = S.gl;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
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
   S.drawMesh(S.coneMesh, m.get());
   S.drawMesh(S.diskMesh, m.get());

`,
events: `
   ;
`
};

}

