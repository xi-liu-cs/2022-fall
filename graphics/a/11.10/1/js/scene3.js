
rooms.scene3 = function() {

lib3D2();

description = `<b>Scene 2</b>
               <p>
               Let's play some basketball :) little shooting animation
               by sine curve
          <br><input type=range id=rate> rate
          `;

code = {
'init':`

   // BRING BACK MATERIAL

   let materials = [
      [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], // GOLD
      [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], // PLASTIC
      [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], // COPPER
      [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // LEAD
      [.1,.1,.1,0,     .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // SILVER
   ];

   // GLUE TOGETHER TWO MESHES TO CREATE A SINGLE MESH

   let glueMeshes = (a,b) => {
      let mesh = a.slice();
      mesh.push(a.slice(a.length - S.VERTEX_SIZE, a.length));
      mesh.push(b.slice(0, S.VERTEX_SIZE));
      mesh.push(b);
      return mesh.flat();
   }

   // GIVEN A FUNCTION THAT MAPS (u,v) TO point AND normal,
   // AND GIVEN A MESH RESOLUTION, CREATE A PARAMETRIC MESH

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

   // CREATE A UNIT SPHERE PARAMETRIC MESH

   S.sphereMesh = uvMesh((u,v) => {
      let theta = 2 * Math.PI * u;
      let phi = Math.PI * v - Math.PI/2;
      let cu = Math.cos(theta);
      let su = Math.sin(theta);
      let cv = Math.cos(phi);
      let sv = Math.sin(phi);
      return [cu * cv, su * cv, sv,
              cu * cv, su * cv, sv,
         u, v];
   }, 20, 10);

   // DRAW A SINGLE MESH. WE STILL NEED TO ADD MATERIAL PROPERTIES!

   S.drawMesh = (mesh, matrix, matIndex) => {
      let gl = S.gl;
      S.setUniform('Matrix4fv', 'uMatrix', false, matrix);
      S.setUniform('Matrix4fv', 'uInvMatrix', false, matrixInverse(matrix));
      S.setUniform('Matrix4fv', 'uMat', false, materials[matIndex].flat());
      S.setUniform('3fv', 'uLd', [1, 1, 1]);

      S.gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
      S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, mesh.length / S.VERTEX_SIZE);
   }

`,
fragment: `
S.setFragmentShader(\`
   varying vec3 vPos, vNor;

   // DECLARING MATERIAL

   uniform mat4 uMat;
   uniform vec3 uLd;

   void main() {
      vec3 ambient = uMat[0].rgb;
      vec3 diffuse = uMat[1].rgb;
      vec3 specular = uMat[2].rgb;
      float p = uMat[2].a;

      vec3 R = 2. * dot(vNor, uLd) * vNor - uLd;
      vec3 E = vec3(0.,0.,1.);

      vec3 c = ambient;
      c += (diffuse * max(0.,dot(vNor, uLd)) + specular * pow(max(0., dot(R, E)), p));
      gl_FragColor = vec4(sqrt(c),1.);
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

   // SET THE PROJECTION MATRIX BASED ON CAMERA FOCAL LENGTH

   let fl = 5.0;
   S.setUniform('Matrix4fv', 'uProject', false,
      [1,0,0,0, 0,1,0,0, 0,0,1,-1/fl, 0,0,0,1]);

   let m = new Matrix();

   // GET VALUES FROM THE HTML SLIDERS

   let T = 10 * rate.value / 100;

   // RENDER THE RIG

   m.translate(0, 0, -2);
   m.roty(time);

   // SET JOINT SCALE

   m.scale(.05);

   m.translate(0, (Math.sin(time * T) + 1) * 2, 0);

   // PELVIS

   m.save();
   S.drawMesh(S.sphereMesh, m.get(), 2);
   m.restore();

      // LEFT HIP

      m.save();
      m.rotz(1);

      // DRAW BODY PART

      m.translate(0, -1, 0);

      m.save();
      S.drawMesh(S.sphereMesh, m.get(), 4);
      m.restore();

      // DRAW JOINT

      m.translate(0, -1, 0);
      S.drawMesh(S.sphereMesh, m.get(), 2);

         // LEFT KNEE

         m.save();
         m.rotz(-.8);
         
         // DRAW BODY PART

         m.translate(0, -3, 0);

         m.save();
         m.scale(1, 3, 1);
         S.drawMesh(S.sphereMesh, m.get(), 4);
         m.restore();

         // DRAW JOINT

         m.translate(0, -3, 0);
         S.drawMesh(S.sphereMesh, m.get(), 2);

            // LEFT ANKLE

            m.save();

            // DRAW BODY PART

            m.translate(0, -3, 0);

            m.save();
            m.scale(1, 3, 1);
            S.drawMesh(S.sphereMesh, m.get(), 4);
            m.restore();

            // DRAW JOINT

            m.translate(0, -3, 0);
            S.drawMesh(S.sphereMesh, m.get(), 2);

            // DRAW FOOT

            m.save();
            m.rotx(-(Math.sin(time * T + 2) + 1) / 2 - .5);
            m.translate(0, -2, 0);
            m.scale(1, 2, .5);
            S.drawMesh(S.sphereMesh, m.get(), 4);
            m.restore();

         m.restore();
      m.restore();
   m.restore();

      // RIGHT HIP

      m.save();
      m.rotz(-1);

      // DRAW BODY PART

      m.translate(0, -1, 0);

      m.save();
      S.drawMesh(S.sphereMesh, m.get(), 4);
      m.restore();

      // DRAW JOINT

      m.translate(0, -1, 0);
      S.drawMesh(S.sphereMesh, m.get(), 2);

         // RIGHT KNEE

         m.save();
         m.rotz(.8);
         m.rotx(-(Math.sin(time * T - .5) + 1) / 5);
         
         // DRAW BODY PART

         m.translate(0, -3, 0);

         m.save();
         m.scale(1, 3, 1);
         S.drawMesh(S.sphereMesh, m.get(), 4);
         m.restore();

         // DRAW JOINT

         m.translate(0, -3, 0);
         S.drawMesh(S.sphereMesh, m.get(), 2);

            // RIGHT ANKLE

            m.save();

            // DRAW BODY PART

            m.translate(0, -3, 0);

            m.save();
            m.scale(1, 3, 1);
            S.drawMesh(S.sphereMesh, m.get(), 4);
            m.restore();

            // DRAW JOINT

            m.translate(0, -3, 0);
            S.drawMesh(S.sphereMesh, m.get(), 2);

            // DRAW FOOT

            m.save();
            m.rotx(-(Math.sin(time * T + 2) + 1) / 2 - .5);
            m.translate(0, -2, 0);
            m.scale(1, 2, .5);
            S.drawMesh(S.sphereMesh, m.get(), 4);
            m.restore();

         m.restore();
      m.restore();
   m.restore();

      // SPINE

      m.save();

      // DRAW BODY PART

      m.translate(0, 1, 0);

      m.save();
      m.scale(1, 2, 1);
      S.drawMesh(S.sphereMesh, m.get(), 4);
      m.restore();

      // DRAW JOINT

      m.translate(0, 1, 0);
      S.drawMesh(S.sphereMesh, m.get(), 2);

         // NECK

         m.save();

         // DRAW BODY PART

         m.translate(0, 3.5, 0);

         m.save();
         m.scale(1, 3.5, 1);
         S.drawMesh(S.sphereMesh, m.get(), 4);
         m.restore();

         // DRAW JOINT

         m.translate(0, 3.5, 0);
         S.drawMesh(S.sphereMesh, m.get(), 2);

            // LEFT CLAVICLE

            m.save();
            m.rotz(-Math.PI / 2);

            // DRAW BODY PART

            m.translate(0, 2, 0);

            m.save();
            m.scale(1, 2, 1);
            S.drawMesh(S.sphereMesh, m.get(), 4);
            m.restore();

            // DRAW JOINT

            m.translate(0, 2, 0);
            S.drawMesh(S.sphereMesh, m.get(), 2);

               // LEFT UPPERARM

               m.save();
               m.rotz(-Math.PI / 2);
               m.rotx(Math.PI / 2 + (Math.sin(time * T) + 1) / 3);
               m.roty(.5);

               // DRAW BODY PART

               m.translate(0, 2.5, 0);

               m.save();
               m.scale(1, 2.5, 1);
               S.drawMesh(S.sphereMesh, m.get(), 4);
               m.restore();

               // DRAW JOINT

               m.translate(0, 2.5, 0);
               S.drawMesh(S.sphereMesh, m.get(), 2);

                  // LEFT ELBOW

                  m.save();
                  m.rotx(2 - (Math.sin(time * T) + 1) / 2);

                  // DRAW BODY PART

                  m.translate(0, 3, 0);

                  m.save();
                  m.scale(1, 3, 1);
                  S.drawMesh(S.sphereMesh, m.get(), 4);
                  m.restore();

                  // DRAW JOINT

                  m.translate(0, 3, 0);
                  S.drawMesh(S.sphereMesh, m.get(), 2);

                  // DRAW HAND

                  m.rotz(.5);
                  m.translate(0, 2, 0);

                  m.save();
                  m.scale(.5, 2, 1);
                  S.drawMesh(S.sphereMesh, m.get(), 4);
                  m.restore();

               m.restore();
            m.restore();
         m.restore();

            // RIGHT CLAVICLE

            m.save();
            m.rotz(Math.PI / 2);

            // DRAW BODY PART

            m.translate(0, 2, 0);

            m.save();
            m.scale(1, 2, 1);
            S.drawMesh(S.sphereMesh, m.get(), 4);
            m.restore();

            // DRAW JOINT

            m.translate(0, 2, 0);
            S.drawMesh(S.sphereMesh, m.get(), 2);

               // RIGHT UPPERARM

               m.save();
               m.rotz(1.2 + (Math.sin(time * T) + 1) / 5);
               m.rotx(Math.PI / 2 + (Math.sin(time * T) + 1) / 2);

               // DRAW BODY PART

               m.translate(0, 2.5, 0);

               m.save();
               m.scale(1, 2.5, 1);
               S.drawMesh(S.sphereMesh, m.get(), 4);
               m.restore();

               // DRAW JOINT

               m.translate(0, 2.5, 0);
               S.drawMesh(S.sphereMesh, m.get(), 2);

                  // RIGHT ELBOW

                  m.save();
                  m.rotx(2 - (Math.sin(time * T) + 1) / 1.2);

                  // DRAW BODY PART

                  m.translate(0, 3, 0);

                  m.save();
                  m.scale(1, 3, 1);
                  S.drawMesh(S.sphereMesh, m.get(), 4);
                  m.restore();

                  // DRAW JOINT

                  m.translate(0, 3, 0);
                  S.drawMesh(S.sphereMesh, m.get(), 2);

                  // DRAW HAND

                  m.roty(-Math.sin(time * T) / 2 - 1);
                  m.rotz(Math.sin(time * T));
                  m.translate(0, 2, 0);

                  m.save();
                  m.scale(.5, 2, 1);
                  S.drawMesh(S.sphereMesh, m.get(), 4);
                  m.restore();

               m.restore();
            m.restore();
         m.restore();

            // HEAD
            m.save();

            // DRAW NECK

            m.translate(0, 2, 0);

            m.save();
            m.scale(1, 2, 1);
            S.drawMesh(S.sphereMesh, m.get(), 4);
            m.restore();

            // DRAW HEAD

            m.translate(0, 2, 0);
            m.scale(2, 2, 2);
            S.drawMesh(S.sphereMesh, m.get(), 4);

         m.restore();
      m.restore();
   m.restore();
`,
events: `
   ;
`
};

}

