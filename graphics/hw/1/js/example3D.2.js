
rooms.example3D = function() {

lib3D();

description = `Interactive WebGL<br>on a single square.
<p><input type = range id = red>red<br>
<input type = range id = green>green<br>
<input type = range id = blue>blue`;

code = {
'explanation': `
   S.html(\`
      Most of the work happens in a fragment shader.
      <p>
      Input to the fragment shader is x,y and time: <code>uPos, uTime</code>
      <p>
      We can also interact by adding information about the cursor: <code>uX,uY</code>
      <p>
      Output at each fragment is: red,green,blue,alpha
   \`);
`,
'init': 
`S.n_sphere = 20;
S.n_light_direct = 2;
S.n_light_color = 2;
S.s_pos = [];
for(let i = 0; i < S.n_sphere; ++i)
    for(let j = 0; j < 3; ++j)
        S.s_pos.push(Math.random() - .5);`,
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
fragment: `
S.setFragmentShader(\`

   uniform float uTime, uSpace, uX, uY;
   varying vec3 vPos;
/*
   float turbulence(vec3 p) {
      float t = 0., f = 1.;
      for (int i = 0 ; i < 10 ; i++) {
         t += abs(noise(f * p)) / f;
         f *= 2.;
      }
      return t;
   }
*/
   float disk(vec2 p, float x, float y, float r) {
      x = p.x - x;
      y = p.y - y;
      return 1.-clamp(10. * (x*x + y*y - r*r), 0., 1.);
   }

   vec3 stripes(float x) {
      float t = pow(sin(x) * .5 + .5, .1);
      return vec3(t, t*t, t*t*t);
   }

   vec3 clouds(float y) {
      vec3 sky = .5 * vec3(.3,.6,1.);
      float s = mix(.6,1., clamp(3.*y-2., 0.,1.));
      return mix(sky, vec3(s), clamp(.5*y,0.,1.));
   }
/*
   void main() {
      vec3 p = 8. * vPos + vec3(0., 0., .5*uTime);
      vec3 color = clouds(vPos.y + 2.*turbulence(p/10.));
      color *= noise(10. * vPos);
      color *= disk(vPos.xy, 0., 0., .5);
      gl_FragColor = vec4(sqrt(color), 1.);
   }
*/

   float fractal(vec3 p) {
      float t = 0., f = 1.;
      for (int i = 0 ; i < 10 ; i++) {
         t += noise(f * p) / f;
         f *= 2.;
      }
      return t;
   }

   float turbulence(vec3 p) {
      float t = 0., f = 1.;
      for (int i = 0 ; i < 10 ; i++) {
         t += abs(noise(f * p)) / f;
         f *= 2.;
      }
      return t;
   }

   float pattern(vec3 v)
   {
      const int n = 10;
      float res = 0., f = 1.;
      for(int i = 1; i < n; ++i)
      {
         res += noise(f * v) / float(i);
         f += float(i);
      }
      return res;
   }

   vec3 object(float y)
   {
      vec3 back = .5 * vec3(1., 1., .1);
      float s = mix(.5, 1., clamp(3.* y - 2., 0., 1.));
      return mix(back, vec3(s), clamp(.5 * y, 0., 1.));
   }

   #define at(r, t)(r.origin + t * r.direct)

   struct ray
   {
       vec3 origin, direct;
       float tmin, tmax;
   };

   struct sphere
   {
       vec3 center;
       float radius;
   };

   const int n_sphere = \` + S.n_sphere + \`,
   n_light_direct = \` + S.n_light_direct + \`,
   n_light_color = \` + S.n_light_color + \`;
   uniform float u_time;
   uniform sphere u_sphere[n_sphere];
   uniform vec3 u_light_direct[n_light_direct];
   uniform vec3 u_light_color[n_light_color];

   float ray_sphere(ray r, sphere s)
   {
       vec3 oc = r.origin - s.center;
       float b = dot(oc, r.direct),
       c = dot(oc, oc) - s.radius * s.radius,
       disc = b * b - c;
       return disc < 0. ? -1. : -b - sqrt(disc);
   }

   vec3 shade_sphere(vec3 point, sphere s, vec3 light_direct)
   {
       vec3 n = normalize(point - s.center);
       vec3 c = vec3(.1);
       for(int i = 0; i < n_light_direct; ++i)
           c += max(0., dot(n, u_light_direct[i])) * u_light_color[i];
       c *= 1. + .5 * noise(5. * n);
       return c;
   }

   void main()
   {
      /* vec3 p = vPos + vec3(.1*uTime,0.,.1*uTime);
      vec3 color = clouds(p.y + turbulence(p));
      gl_FragColor = vec4(sqrt(color), 1.); */
      float focal_length = 3.;
      vec3 light_direct = normalize(vec3(sin(10. * u_time), 1., 1.));
      sphere s = sphere(vec3(0., 0., 0.), .5);
      vec3 color = vec3(.1, .2, .5);
      ray r = ray(vec3(0., 0., focal_length), normalize(vec3(vPos.xy, -focal_length)), 10000., 0.);
      for(int i = 0; i < n_sphere; ++i)
      {
          float t = ray_sphere(r, u_sphere[i]);
          if(t > 0. && t < r.tmin)
          {
               color = shade_sphere(at(r, t), u_sphere[i], light_direct);
               r.tmin = t;
          }
          else if(t < 0. && t >= r.tmin)
          {
               vec3 p = vPos + vec3(.1 * uTime, 0, .1 * uTime);
               color = object(p.y + pattern(p));
          }
      }
      gl_FragColor = vec4(sqrt(color), 1.);
   }

\`)
`,
render:
`let normalize = v =>
{
    let s = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / s, v[1] / s, v[2] / s];
}
let ld0 = normalize([1, 1, 1]),
ld1 = normalize([-1, -1, -1]),
ld_data = [];
for(let i = 0; i < 3; ++i)
    ld_data.push(ld0[i]);
for(let i = 0; i < 3; ++i)
    ld_data.push(ld1[i]);
S.setUniform('3fv', 'u_light_direct', ld_data);
S.setUniform('3fv', 'u_light_color', [red.value / 100, green.value / 100, blue.value / 100, .5, .3, .1]);
S.setUniform('1f', 'u_time', time);
for(let i = 0; i < S.n_sphere; ++i)
{
    S.setUniform('3f', 'u_sphere[' + i + '].center', S.s_pos[i * 3], S.s_pos[i * 3 + 1], S.s_pos[i * 3 + 2]);
    S.setUniform('1f', 'u_sphere[' + i + '].radius', .1);
}
S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);`,
events: `
   onDrag = (x,y) => {
      S.setUniform('1f', 'uX', x);
      S.setUniform('1f', 'uY', y);
   }
   onKeyPress  =k=>S.setUniform('1f', 'uSpace', k == 32);
   onKeyRelease=k=>S.setUniform('1f', 'uSpace', false);
`
}

}
