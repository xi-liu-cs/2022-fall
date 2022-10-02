rooms.raytrace = function()
{
lib3D();
description =
`raytracing to spheres<br>in a fragment shader
<small>
   <p>
   <b>background color</b>
   <br><input type = range id = red   value = 5>red
   <br><input type = range id = green value = 10>green
   <br><input type = range id = blue  value = 50>blue
</small>`;
code = {
'init':`
S.n_sphere = 5;
S.radius = .05;
S.n_light = 2;
S.n_side = 6;
let materials =
[
   [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], /* copper */
   [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], /* gold */
   [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], /* plastic */
   [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], /* lead */
   [.1,.1,.1,0,     .1,.1,.1,0,  1,1,1,5,    0,0,0,0], /* silver */
];
S.material = [];
for(let i = 0; i < S.n_sphere; ++i)
   S.material.push(materials[i % materials.length]);
S.s_pos = [];
S.s_velocity = [];
for(let i = 0; i < S.n_sphere; ++i)
{
   S.s_pos.push([Math.random() - .5, Math.random() - .5, Math.random() - .5]);
   S.s_velocity.push([0, 0, 0]);
}
`,
fragment: `
S.setFragmentShader(\`
#define at(r, t)(r.origin + t * r.direct)
struct ray
{
   vec3 origin, direct;
};
struct sphere
{
   vec3 center;
   float radius;
};
const int n_sphere = \` + S.n_sphere + \`,
n_light = \` + S.n_light + \`,
n_side = \` + S.n_side + \`;
uniform float u_time;
uniform vec3 u_back_color;
uniform sphere u_sphere[n_sphere];
uniform mat4 u_sphere_material[n_sphere];
uniform mat4 u_cube_inverse_matrix;
uniform vec4 u_cube[6];
uniform vec4 u_octahedron[8];
uniform vec3 u_light_direct[n_light];
uniform vec3 u_light_color[n_light];
varying vec3 vPos;
float focal_length = 3.;
vec3 stripes(float x)
{
   float t = pow(sin(x) * .5 + .5, .1);
   return vec3(t, t * t, t * t * t);
}
float pattern(vec3 v)
{
   const int n = 10;
   float res = 0., f = 1.;
   for(int i = 1; i < n; ++i)
   {
      res += noise(f * v) / float(i);
      f *= float(i);
      f += float(i);
   }
   return res;
}
vec3 object(float y)
{
   vec3 back = .5 * vec3(.5, .1, 1.);
   float s = mix(.5, 1., clamp(3.* y - 2., 0., 1.));
   return mix(back, vec3(s), clamp(.5 * y, 0., 1.));
}
float ray_halfspace(ray r, vec4 plane)
{/* plane * r <= 0, plane * (origin + t * direct) <= 0,  plane * origin + t * plane * direct <= 0, t <= -(plane * origin) / (plane * direct) */
   vec4 origin = vec4(r.origin, 1.),
   direct = vec4(r.direct, 0.);
   return -dot(plane, origin) / dot(plane, direct);
}
vec4 ray_cube(ray r, mat4 inverse_matrix)
{
   vec3 n = vec3(0.);
   float t_in = -1000., t_out = 1000.;
   for(int i = 0; i < n_side; ++i)
   {
        vec4 plane = inverse_matrix * u_cube[i]; /* if column major, vec4 plane = u_cube[i] * inverse_matrix; */
        plane /= sqrt(dot(plane.xyz, plane.xyz));
        float t = ray_halfspace(r, plane);
        if(dot(r.direct, plane.xyz) < 0.)
        {
            if(t > t_in)
            n = plane.xyz;
            t_in = max(t_in, t);
        }
        else
            t_out = min(t_out, t);
   }
   /* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
   return vec4(n, t_in < t_out ? t_in : -.1);
}
vec4 ray_octahedron(ray r, mat4 inverse_matrix)
{
   vec3 n = vec3(0.);
   float t_in = -1000., t_out = 1000.;
   for(int i = 0; i < 8; ++i)
   {
      vec4 plane = inverse_matrix * u_octahedron[i]; /* if column major, vec4 plane = u_octahedron[i] * inverse_matrix; */
      plane /= sqrt(dot(plane.xyz, plane.xyz));
      float t = ray_halfspace(r, plane);
      if(dot(r.direct, plane.xyz) < 0.)
      {
        if(t > t_in)
        n = plane.xyz;
        t_in = max(t_in, t);
      }
      else
        t_out = min(t_out, t);
   }
   /* vec3 p = r.origin + t_in + r.direct; n += 1. * noise(10. * p); */
   vec3 p = r.origin + t_in + r.direct; n += pattern(p);
   return vec4(n, t_in < t_out ? t_in : -.1);
}
float ray_sphere(ray r, sphere s)
{
   vec3 oc = r.origin - s.center;
   oc += .01 * r.direct;
   float b = dot(oc, r.direct),
   c = dot(oc, oc) - s.radius * s.radius,
   disc = b * b - c;
   return disc < 0. ? -1. : -b - sqrt(disc);
}
vec3 shade_sphere(vec3 point, sphere s, mat4 material)
{
      vec3 ambient = material[0].rgb,
      diffuse = material[1].rgb,
      specular = material[2].rgb;
      float power = material[2].a;
      vec3 n = normalize(point - s.center),
      c = mix(ambient, u_back_color, .3),
      eye = vec3(0., 0., 1.);
      for(int i = 0; i < n_light; ++i)
      {
         float t = -1.;
         for(int j = 0; j < n_sphere; ++j)
         {
            ray r = ray(point, u_light_direct[i]);
            t = max(t, ray_sphere(r, u_sphere[j]));
         }
         if(t < 0.)
         {
            vec3 reflect = 2. * dot(n, u_light_direct[i]) * n - u_light_direct[i];
            c += u_light_color[i] * (diffuse * max(0., dot(n, u_light_direct[i]))
            + specular * pow(max(0., dot(reflect, eye)), power));
         }
      }
      c += pattern(n);
      /* c *= 1. + .5 * noise(3. * n); */
      return c;
}
void main()
{
   vec3 color = u_back_color;
   ray r = ray(vec3(0., 0., focal_length), normalize(vec3(vPos.xy, -focal_length)));
   float t_min = 10000.;
   for(int i = 0; i < n_sphere; ++i)
   {
      float t = ray_sphere(r, u_sphere[i]);
      if(t > 0. && t < t_min)
      {
         vec3 p = at(r, t);
         color = shade_sphere(p, u_sphere[i], u_sphere_material[i]);
         t_min = t;
         vec3 n = normalize(p - u_sphere[i].center),
         reflect = 2. * dot(n, -r.direct) * n + r.direct;
         float reflect_t_min = 10000.;
         vec3 reflect_color;
         for(int j = 0; j < n_sphere; ++j)
         {
            ray reflect_r = ray(p, reflect);
            float reflect_t = ray_sphere(reflect_r, u_sphere[j]);
            if(reflect_t > 0. && reflect_t < reflect_t_min)
            {
               reflect_t_min = reflect_t;
               reflect_color = shade_sphere(p + reflect_t * reflect, u_sphere[j], u_sphere_material[j]);
            }
         }
         if(reflect_t_min < 10000.)
            color += .5 * reflect_color;
      }
   }
   vec4 n_t = ray_cube(r, u_cube_inverse_matrix);
   if(0. < n_t.w && n_t.w < t_min)
   {
      vec3 ambient = mix(vec3(.1), u_back_color, .3);
      color += ambient + 0.7 * vec3(max(0., dot(n_t.xyz, vec3(.5))));
   }
   vec4 n_t2 = ray_octahedron(r, u_cube_inverse_matrix);
   if(0. < n_t2.w && n_t2.w < t_min)
   {
      vec3 ambient = mix(vec3(.1), u_back_color, .3);
      color += ambient + vec3(max(0., dot(n_t2.xyz, vec3(.5))));
   }
   else
   {
      vec3 p = vPos + vec3(.1 * u_time, 0, .1 * u_time);
      color += object(p.y + pattern(p)) * stripes(p.y + pattern(p));
   }
   gl_FragColor = vec4(sqrt(color), 1.);
}
\`);
`,
vertex: `
S.setVertexShader(\`
attribute vec3 aPos;
varying   vec3 vPos;
void main()
{
   vPos = aPos;
   gl_Position = vec4(aPos, 1.);
}
\`)
`,
render: `
let dot = (a, b) =>
{
   let n = a.length,
   res = 0;
   for(let i = 0; i < n; ++i)
      res += a[i] * b[i]
   return res;
}
let norm = v => Math.sqrt(dot(v, v));
let normalize = v =>
{
   let n = v.length,
   s = norm(v),
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(v[i] / s);
   return res;
};
let scale = (v, num) =>
{
   let n = v.length,
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(num * v[i]);
   return res;
};
let add = (a, b) =>
{
   let n = a.length,
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(a[i] + b[i]);
   return res;
};
let subtract = (a, b) =>
{
   let n = a.length,
   res = [];
   for(let i = 0; i < n; ++i)
      res.push(a[i] - b[i]);
   return res;
};
let radius = .25,
ld0 = normalize([1, 1, 1]),
ld1 = normalize([-1, -1, 1]),
ld_data = [];
for(let i = 0; i < 3; ++i)
   ld_data.push(ld0[i]);
for(let i = 0; i < 3; ++i)
   ld_data.push(ld1[i]);
S.setUniform('3fv', 'u_light_direct', ld_data);
S.setUniform('3fv', 'u_light_color', [1, 1, 1, .5, .3, .1]);
S.setUniform('3fv', 'u_diffuse_color', [red.value / 100, green.value / 100, blue.value / 100]);
S.setUniform('1f', 'u_time', time);
// for(let i = 0; i < S.n_sphere; ++i)
// {
//    S.s_velocity[i][0] += .01 * Math.sin(time + i);
//    S.s_velocity[i][1] += .01 * Math.cos(time + 2 * i);
//    S.s_velocity[i][2] += .01 * Math.cos(time + 3 * i);
//    for(let j = 0; j < 3; ++j)
//    {
//       S.s_velocity[i][j] += .01 * (Math.random() - .5);
//       S.s_pos[i][j] += .01 * S.s_velocity[i][j];
//       S.s_pos[i][j] *= .8;
//    }
//    S.s_pos[i] = scale(normalize(S.s_pos[i]), .7);
// }
// for(let i = 0; i < S.n_sphere; ++i)
//    for(let j = 0; j < S.n_sphere; ++j) /* avoid sphere interpenetration */
//       if(i != j)
//       {
//          let d = subtract(S.s_pos[i], S.s_pos[j]),
//          r = norm(d);
//          if(r < 2 * radius)
//          {
//             let t = 2 * radius - r;
//             for(let k = 0; k < 3; ++k)
//             {
//                S.s_pos[i][k] += t * d[k] / r;
//                S.s_pos[j][k] -= t * d[k] / r;
//             }
//          }
//       }
for(let i = 0; i < S.n_sphere; ++i)
{
//    S.setUniform('3f', 'u_sphere[' + i + '].center', S.s_pos[i][0], S.s_pos[i][1], S.s_pos[i][2]); /* S.setUniform('3f', 'u_sphere[' + i + '].center', S.s_pos[i][0], S.s_pos[i][1], .1 * Math.cos(time + i)); */
    S.setUniform('3f', 'u_sphere[' + i + '].center', Math.random() - .5, Math.random() - .5, Math.random() - .5);
    S.setUniform('1f', 'u_sphere[' + i + '].radius', radius);
}
S.setUniform('Matrix4fv', 'u_sphere_material', false, S.material.flat());
S.setUniform('3fv', 'u_back_color', [red.value / 1000, green.value / 1000, blue.value / 1000]);
let cube_matrix4 = new matrix4();
cube_matrix4.translate(Math.cos(time) / 2, Math.sin(time) / 2, .5);
cube_matrix4.rotate(10 * time, 1, 0, 0);
cube_matrix4.rotate(10 * time, 0, 1, 0);
cube_matrix4.rotate(10 * time, 0, 0, 1);
cube_matrix4.scale(.3, .3, .3);
cube_matrix4.invert();
S.setUniform('Matrix4fv', 'u_cube_inverse_matrix', false, cube_matrix4.a);
S.setUniform('4fv', 'u_cube', 
[-1,0,0,-1, 1,0,0,-1,
0,-1,0,-1, 0,1,0,-1,
0,0,-1,-1, 0,0,1,-1,]);
S.setUniform('4fv', 'u_octahedron',
[-1,-1,-1,-1, 1,1,1,-1,
1,-1,-1,-1, -1,1,1,-1,
-1,1,-1,-1, 1,-1,1,-1,
-1,-1,1,-1, 1,1,-1,-1,]);
S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
};
}