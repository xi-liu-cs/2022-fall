
rooms.raytrace1 = function() {

lib3D();

description = `Raytracing to spheres<br>in a fragment shader`;

code = {
'init':`
   S.sc = [];
   S.sc.push([0,0,0,.5, 0,0,0]);
   S.sc.push([.5,0,-1,.5, 0,0,0]);
   S.nS = S.sc.length;
`,
fragment: `
S.setFragmentShader(\`

   const int nS = 2;
   const int nL = 2;

   uniform vec3 uLd[nL];
   uniform vec3 uLc[nL];
   uniform vec4 uS[nS];

   varying vec3 vPos;

   float fl = 3.0;
   vec3 Ambient = vec3(.1);
   vec3 Diffuse = vec3(.9);

   float raySphere(vec3 V, vec3 W, vec4 S) {
      V -= S.xyz;
      float b = dot(V, W);
      float d = b * b - dot(V, V) + S.w * S.w;
      return d < 0. ? -1. : -b - sqrt(d);
   }

   vec3 shadeSphere(vec3 P, vec4 S) {
      vec3 N = normalize(P - S.xyz);
      vec3 c = Ambient;
      for (int l = 0 ; l < nL ; l++)
         c += Diffuse * max(0., dot(N, uLd[l])) * uLc[l];
      return c;
   }

   void main() {
      vec3 color = vec3(.1,.2,.5);
      vec3 V = vec3(0.,0.,fl);
      vec3 W = normalize(vec3(vPos.xy, -fl));
      float tMin = 10000.;
      for (int n = 0 ; n < nS ; n++) {
         float t = raySphere(V, W, uS[n]);
         if (t > 0. && t < tMin) {
            color = shadeSphere(V + t * W, uS[n]);
	    tMin = t;
         }
      }
      gl_FragColor = vec4(sqrt(color), 1.);
   }
\`);
`,
vertex: `
S.setVertexShader(\`

   attribute vec3 aPos;
   varying   vec3 vPos;

   void main() {
      vPos = aPos;
      gl_Position = vec4(aPos, 1.);
   }

\`)
`,
render: `
   S.setUniform('3fv', 'uLd', [ .57,.57,.57, -.57,-.57,-.57 ]);
   S.setUniform('3fv', 'uLc', [ 1,1,1, .5,.3,.1 ]);

   let sData = [];
   for (let n = 0 ; n < S.nS ; n++)
      for (let i = 0 ; i < 4 ; i++)
         sData.push(S.sc[n][i]);
   S.setUniform('4fv', 'uS', sData);

   S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
};

}

