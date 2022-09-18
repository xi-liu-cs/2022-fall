
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
      vec4 S = vec4(0., 0., 0., .5); /* (x, y, z) = origin, w = radius */

      float raySphere(vec3 V, vec3 W, vec4 S)
      {/* V = ray.origin, W = ray.direction, S = sphere */
        V -= S.xyz;
        float b = dot(V, W),
        c = dot(V, V) - S.w * S.w,
        d = b * b - c; /* discriminant */
        return d < 0. ? -1. : -b - sqrt(d);
      }

      void main()
      {
         vec3 color = vec3(.1, .2, .5);
         vec3 V = vec3(0., 0., fl);
         vec3 W = normalize(vec3(vPos.xy, -fl));
         float t = raySphere(V, W, S);
         if(t > 0.)
           color = vec3(1.);
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