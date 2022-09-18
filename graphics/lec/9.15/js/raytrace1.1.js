
rooms.raytrace1 = function() {

lib3D();

description = `Raytracing to spheres<br>in a fragment shader
    <p>  <input type=range id=red   > red
    <br> <input type=range id=green > green
    <br> <input type=range id=blue  > blue
`;

code = {
'init':`
`,
fragment: `
S.setFragmentShader(\`
   varying vec3 vPos;
   float fl = 3.;
   void main()
   {
      vec3 color = vec3(.1, .2, .5);
      vec3 V = vec3(0., 0., fl);
      vec3 W = normalize(vec3(vPos.xy, -fl));
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

   S.setUniform('3fv', 'uLd', [.57, .57, .57, -.57]);
   S.setUniform('3fv', 'uLc', [1, 1, 1, .5,.3,.1 ]);

   let sData = [];
   for (let n = 0 ; n < S.nS ; n++) {
      for (let i = 0 ; i < 4 ; i++)
         sData.push(S.sc[n][i]);
      sData.push(.1);
   }

   S.setUniform('4fv', 'uS', sData);

   S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
};

}


