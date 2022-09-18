
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
       uniform float uTime;
       uniform vec4 uS[2]; /* spheres array, (x, y, z) = origin, w = radius */
       uniform vec3 uLd[2];
       uniform vec3 uLc[2];
       varying vec3 vPos;
       float fl = 3.;
       vec3 ld = normalize(vec3(sin(10. * uTime), 1., 1.)); /* light direction */

       float raySphere(vec3 V, vec3 W, vec4 S)
       {/* V = ray.origin, W = ray.direction, S = sphere */
         V -= S.xyz;
         float b = dot(V, W),
         c = dot(V, V) - S.w * S.w,
         d = b * b - c; /* discriminant */
         return d < 0. ? -1. : -b - sqrt(d);
       }

       vec3 shadeSphere(vec3 P, vec4 S)
       {
         vec3 N = normalize(P - S.xyz);
         vec3 c = vec3(.1);
         for(int l = 0; l < 2; l++) /* light index */
            c += max(0., dot(N, uLd[l])) * uLc[l];
         return c;
       }

       void main()
       {
          vec3 color = vec3(.1, .2, .5);
          vec3 V = vec3(0., 0., fl);
          vec3 W = normalize(vec3(vPos.xy, -fl));
          float tMin = 10000.;
          for(int n = 0; n < 2; n++) /* looping through spheres */
          {
            float t = raySphere(V, W, uS[n]);
            if(t > 0. && t < tMin)
            {
              color = shadeSphere(V + t * W, uS[n]); /* point, sphere */
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
       let normalize = v =>
       {
         let s = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
         return [v[0] / s, v[1] / s, v[2] / s];
       }
       ldData = [], /* light direction data */
       ld0 = normalize([1, 1, 1]),
       ld1 = normalize([-1, -1, -1]);
       for(let i = 0; i < 3; i++)
         ldData.push(ld0[i]);
       for(let i = 0; i < 3; i++)
         ldData.push(ld1[i]);
       S.setUniform('3fv', 'uLd', ldData);
       S.setUniform('3fv', 'uLc', [1, 1, 1, .5, .3, .1]);
       S.setUniform('4fv', 'uS', [0, 0, 0, .5]);
       S.setUniform('1f', 'uTime', time);
    
       let sData = [],
       s0 = [0, 0, 0, .5],
       s1 = [.5, 0, 0, .5];
       for(let i = 0; i < 4; i++)
         sData.push(s0[i]);
       for(let i = 0; i < 4; i++)
         sData.push(s1[i]);
       S.setUniform('4fv', 'uS', sData);
       S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
    `,
    events: `
       ;
    `
    };
    
    }    