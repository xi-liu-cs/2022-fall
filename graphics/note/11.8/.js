rooms.scene = function() {

lib3d();

description =
`<b>scene</b>
<p>hierarchic 3d scene<br>
with triangle meshes<p>
<input type = range id = move_rate> rate<br>
<input type = range id = arm_len value = 28> arm length<br>
<input type = range id = leg_len value = 40> leg length<br>
<input type = range id = finger_number value = 5> finger number<br>
<input type = range id = toe_number value = 5> toe number<br>`;

code = {
'init':
line(26) +
`S.n_light = 2;
S.material =
[
   [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], /* copper 0 */
   [.25,.15,.025,0, .5,.3,.3,0, 1,.6,.1,6,  0,0,0,0], /* yellow 1 */
   [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], /* plastic 2 */
   [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], /* lead 3 */
   [.1,.1,.1,0,     .1,.1,.1,0,  1,1,1,5,    0,0,0,0], /* silver 4 */
   [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], /* gold 5 */
   [1,1,1,0, 1,1,1,0, 1,1,1,6,  0,0,0,0], /* white 6 */
   [0,0,0,0, 0,0,0,0, 0,0,0,0,  0,0,0,0], /* black 7 */
   [.34,.3,.5,0,  .34,.3,.5,0,  .1,.1,.1,5, 0,0,0,0], /* light blue 8 */
   [.2,0,1,0,  .2,0,1,0,  .1,.1,.1,5, 0,0,0,0], /* light blue 8 */
];

let face0 = transform_mesh(S.square_mesh, matrixTranslate([0, 0, 1])),
face1 = transform_mesh(face0, matrixRotx(Math.PI / 2)),
face2 = transform_mesh(face0, matrixRotx(Math.PI)),
face3 = transform_mesh(face0, matrixRotx(-Math.PI / 2)),
face4 = transform_mesh(face0, matrixRoty(-Math.PI / 2)),
face5 = transform_mesh(face0, matrixRoty(Math.PI / 2));

S.cube_mesh = 
glue_mesh(face0,
glue_mesh(face1,
glue_mesh(face2,
glue_mesh(face3,
glue_mesh(face4, face5)))));
`,

fragment: `
S.setFragmentShader(\`
const int n_light = \` + S.n_light + \`;
varying vec3 vPos, vNor;
uniform vec3 u_light_direct[n_light], u_light_color[n_light];
vec3 sky_color = vec3(0.6, 0.75, 0.95);
uniform mat4 material;
uniform float u_time;
float focal_length = 3.;

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
   return res -.2 * noise(vNor);
}

float height(vec3 p)
{
   float n = noise(8. * p + vec3(u_time, u_time, 0.));
   n += noise(16. * p + vec3(u_time, -u_time, 0.));
   return n / 100.;
}

#define triangle_normal(p1, p2, p3)(cross(p2 - p1, p3 - p1))

vec3 normal(vec3 p)
{/* s1, s2, s2 are 3 points of a surface defined by y = f(x, z) */
   vec3 s1 = vec3(p.x, p.y, p.z);
   vec3 s2 = vec3(p.x, p.y, p.z);
   vec3 s3 = vec3(p.x, p.y, p.z - .001);
   vec3 h1 = vec3(p.x, height(s1), p.z);
   vec3 h2 = vec3(p.x + .001, height(s2), p.z);
   vec3 h3 = vec3(p.x, height(s3), p.z - .001);
   vec3 n = triangle_normal(h1, h2, h3);
   if(n.y < 0.) n = -n;
   return normalize(n);
}

vec3 shade(vec3 eye, mat4 material, vec3 r)
{
    vec3 ambient = material[0].rgb,
    diffuse = material[1].rgb,
    specular = material[2].rgb;
    float power = material[2].a;
    vec3 c = mix(ambient, sky_color, .3);
    vec3 n = normal(r);
    for(int i = 0; i < n_light; ++i)
    {
        vec3 reflect = 2. * dot(vNor, u_light_direct[i]) * vNor - u_light_direct[i];
        c += u_light_color[i] * .8 * (diffuse * max(0., dot(vNor, u_light_direct[i]))
        + specular * pow(max(0., dot(reflect, eye)), power)); /* + specular * pow(max(0., dot(reflect, eye)), power)) + .5 * pattern(vNor); */

        vec3 reflect2 = 2. * dot(n, u_light_direct[i]) * n - u_light_direct[i];
        c += u_light_color[i] * .8 * (diffuse * max(0., dot(n, u_light_direct[i]))
        + specular * pow(max(0., dot(reflect2, eye)), power)); /* + specular * pow(max(0., dot(reflect, eye)), power)) + .5 * pattern(vNor); */
    }
    return c;
}

void main()
{/* float c = .2 + .8 * max(0., dot(vNor, vec3(.57))); gl_FragColor = vec4(.3, .1, 0., 0.) + vec4(c, c, c, 1.); */
    vec3 eye = vec3(0., 0., 1.);
    vec3 v = vec3(0., 0., focal_length),
    w = normalize(vec3(vPos.xy, -focal_length));
    float t = -v.y / w.y;
    // vec3 c = vec3(0.);
    // if(t > 0.)
    //     c = shade(eye, material, v + t * w);
    gl_FragColor = vec4(shade(eye, material, v + t * w), 1.);
}
\`);
`,

vertex: `
S.setVertexShader(\`
attribute vec3 aPos, aNor;
varying vec3 vPos, vNor;
uniform mat4 uMatrix, uInvMatrix, uProject;

void main()
{
    vec4 pos = uProject * uMatrix * vec4(aPos, 1.);
    vec4 nor = vec4(aNor, 0.) * uInvMatrix;
    vPos = pos.xyz;
    vNor = normalize(nor.xyz);
    gl_Position = pos * vec4(1.,1.,-.01,1.);
}
\`);
`,

render: `
ld0 = normalize([Math.cos(time), Math.sin(time), 1]),
ld1 = normalize([-1, -1, 1]),
ld_data = [];
for(let i = 0; i < 3; ++i)
   ld_data.push(ld0[i]);
for(let i = 0; i < 3; ++i)
   ld_data.push(ld1[i]);
S.setUniform('1f', 'u_time', time);
S.setUniform('3fv', 'u_light_direct', ld_data);
S.setUniform('3fv', 'u_light_color', [1, 1, 1, .5, .3, .1]);
S.setUniform('Matrix4fv', 'u_material', false, S.material.flat());
S.setUniform('Matrix4fv', 'uProject', false,
[1,0,0,0, 0,1,0,0, 0,0,1,-.2, 0,0,0,1]);

let rate = 2 * time * move_rate.value / 100,
t = rate - Math.PI / 2,
arm_length = .1 + .9 * arm_len.value / 100,
leg_length = .1 + .9 * leg_len.value / 100,
n_finger = finger_number.value,
n_toe = toe_number.value;

let m = new matrix();
m.identity();
m.roty(Math.sin(.5 * rate));
m.save();
    m.save(); /* head */
        m.rotx(.1 * Math.cos(t));
        m.translate(0, .73, 0);
        m.rotz(.3 * Math.cos(2 * time));
        m.save();
            m.translate(0, .12, 0);
            m.scale(.1, .14, .1);
            S.draw_mesh2(S.sphere_mesh, m.get(), S.material[1]);
            m.save(); /* eye */
                m.translate(-.5, .26, .8);
                m.scale(.17, .06, .1);
                m.save();
                    m.scale(.5, 1, 1);
                    m.translate(-.3, 0, 0);
                    S.draw_mesh2(S.sphere_mesh, m.get(), S.material[7]);
                m.restore();
                m.scale(1.4, 1, 1.4);
                S.draw_mesh4(octahedron(20, 10), m.get(), S.material[6]);
            m.restore();
            m.save(); /* eye */
                m.translate(.5, .26, .8);
                m.scale(.17, .06, .1);
                m.save();
                    m.scale(.5, 1, 1);
                    m.translate(.3, 0, 0);
                    S.draw_mesh2(S.sphere_mesh, m.get(), S.material[7]);
                m.restore();
                m.save();
                    m.scale(1.4, 1, 1.4);
                    S.draw_mesh4(octahedron(20, 10), m.get(), S.material[6]);
                m.restore();
            m.restore();
            m.save(); /* nose */
                m.translate(.6, -.06, 1.2);
                cone3([], 0, S.material[0], m); /* m.scale(.07, .18, .07); S.draw_mesh2(S.sphere_mesh, m.get(), S.material[0]); */
            m.restore();
            m.save(); /* mouth */
                m.translate(0, -.4, 1);
                m.scale(.25, .07, .07);
                S.draw_mesh4(octahedron(20, 10), m.get(), S.material[0]); /* S.draw_mesh2(S.sphere_mesh, m.get(), S.material[0]); */
            m.restore();
        m.restore();
    m.restore();

    m.rotx(.1 * Math.cos(t));
    for(let i = -1; i <= 1; i += 2)
    {/* arm */
        let t = rate + i * Math.PI / 2;
        m.save();
            m.translate(i * .2, .6 + .03 * Math.cos(t), 0);
            m.rotx(Math.cos(t));
            m.save(); /* joint */
                m.rotx(Math.PI / 2);
                m.scale(.018, arm_length / 11, .018);
                S.draw_mesh2(S.tube_mesh, m.get(), S.material[0]);
                m.scale(1, 1, 2);
                S.draw_mesh2(S.sphere_mesh, m.get(), S.material[0]);
            m.restore();
            m.save(); /* top */
                m.translate(0, -arm_length / 2, 0);
                m.scale(.03, arm_length / 2, .03);
                S.draw_mesh2(S.sphere_mesh, m.get(), S.material[0]);
                S.draw_mesh2(S.tube_mesh, m.get(), S.material[0]);
            m.restore();
            m.translate(0, -arm_length, 0);
            m.rotx(-1 + .7 * Math.sin(t));
            m.save(); /* joint */
                m.rotx(Math.PI / 2);
                m.scale(.018, arm_length / 11, .018);
                S.draw_mesh2(S.tube_mesh, m.get(), S.material[0]);
            m.restore();
            m.save(); /* bottom */
                m.translate(0, -arm_length / 2, 0);
                m.scale(.027, arm_length / 2, .027);
                S.draw_mesh2(S.sphere_mesh, m.get(), S.material[0]);
                S.draw_mesh2(S.tube_mesh, m.get(), S.material[0]);
            m.restore();
            m.save(); /* joint */
                m.rotx(Math.PI / 2);
                m.scale(.018, arm_length / 11, .018);
                S.draw_mesh2(S.tube_mesh, m.get(), S.material[0]);
            m.restore();
            m.translate(0, -arm_length, .03);
            m.save(); /* hand */
                m.translate(0, -arm_length / 10, -.03);
                m.scale(.01, arm_length / 10, .02);
                S.draw_mesh2(S.cube_mesh, m.get(), S.material[1]);
            m.restore();
            for(let j = 0; j < n_finger; ++j)
            {/* finger */
                m.save();
                    m.rotx(j / Math.PI / 2);
                    m.translate(0, -arm_length / 5, 0);
                    m.scale(.01, arm_length / 5, .01);
                    S.draw_mesh2(S.sphere_mesh, m.get(), S.material[1]);
                m.restore();
            }
        m.restore();
    }

    for(let i = -1; i <= 1; i += 2)
    {/* leg */
        let t = rate - i * Math.PI / 2;
        m.save();
            m.translate(i * .1, .1 + .03 * Math.cos(t), 0);
            m.rotx(Math.cos(t));
            m.save(); /* top */
                m.translate(0, -leg_length / 2, 0);
                m.scale(.05, leg_length / 2, .05);
                S.draw_mesh2(S.sphere_mesh, m.get(), S.material[1]);
                m.save();
                    m.scale(.9, 1, .9);
                    S.draw_mesh2(S.tube_mesh, m.get(), S.material[1]);
                m.restore();
            m.restore();
            m.translate(0, -leg_length, 0);
            m.rotx(1 + Math.sin(t));
            m.save(); /* joint */
                m.rotx(Math.PI / 2);
                m.scale(.02, arm_length / 11, .02);
                S.draw_mesh2(S.tube_mesh, m.get(), S.material[1]);
                m.scale(1, 1, 2);
                S.draw_mesh2(S.sphere_mesh, m.get(), S.material[1]);
            m.restore();
            m.save(); /* bottom */
                m.translate(0, -leg_length / 2, 0);
                m.scale(.05, leg_length / 2, .05);
                S.draw_mesh2(S.sphere_mesh, m.get(), S.material[1]);
                m.save();
                    m.scale(.8, .8, .8);
                    S.draw_mesh2(S.tube_mesh, m.get(), S.material[1]);
                m.restore();
            m.restore();
            m.translate(0, -leg_length, 0);
            m.rotx(-Math.PI);
            m.roty(Math.PI / 2);
            m.rotz(Math.PI / 2);
            m.save(); /* foot */
                m.translate(0, -arm_length / 6, 0);
                m.scale(.01, arm_length / 6, .02);
                S.draw_mesh2(S.cube_mesh, m.get(), S.material[1]);
            m.restore();
            m.rotx(-Math.PI / 10);
            for(let j = 0; j < n_toe; ++j)
            {/* toe */
                m.save();
                    m.rotx(j / Math.PI / 2.3);
                    m.translate(0, -arm_length / 5, 0);
                    m.scale(.01, arm_length / 5, .01);
                    S.draw_mesh2(S.sphere_mesh, m.get(), S.material[1]);
                m.restore();
            }
        m.restore();
    }
m.restore();

/* body */
m.save();
    m.rotx(.1 * Math.cos(t));
    m.save(); /* top */
        m.translate(0, .55, 0);
        m.scale(.21, .2, .13);
        m.rotx(Math.PI / 2);
        S.draw_mesh2(S.sphere_mesh, m.get(), S.material[0]);
    m.restore();
    m.rotx(.07 * Math.cos(t));
    m.save();
        m.translate(0, .3, 0);
        m.scale(.15, .3, .11);
        m.rotx(Math.PI / 2);
        S.draw_mesh2(S.sphere_mesh, m.get(), S.material[0]);
    m.restore();
    m.save();
        m.translate(0, .4, 0);
        m.scale(.15, .4, .1);
        m.rotx(Math.PI / 2);
        S.draw_mesh2(S.half_sphere_mesh, m.get(), S.material[0]);
    m.restore();
m.restore();

/* neck */
m.save();
m.rotx(.1 * Math.cos(t));
m.translate(0, .7, 0);
m.scale(.06, .08, .06);
m.rotx(Math.PI / 2);
S.draw_mesh2(S.tube_mesh, m.get(), S.material[1]);
m.restore();

let m2 = new matrix();
m2.identity();
m2.save();
    m2.scale(.1, .1, .1);
    m2.translate(-6, -2, 0);
    m2.rotx(t);
    m2.roty(t);
    m2.rotz(t);
    S.draw_mesh4(octahedron(20, 10), m2.get(), S.material[3]);
m2.restore();

cone2(['x', 'y', 'z'], [t], S.material[0]);

m2.save();
    star2(20, 10);
m2.restore();
m2.save();
    m2.scale(.1, .1, .1);
    m2.translate(-7, 2, 0);
    m2.rotx(t);
    m2.roty(t);
    m2.rotz(t);
    S.draw_mesh2(tetrahedron(20, 10), m2.get(), S.material[0]);
m2.restore();
m2.save();
    m2.scale(.1, .1, .1);
    m2.translate(-7, -5.5, 0);
    m2.rotx(Math.PI / 2);
    m2.roty(t);
    S.draw_mesh2(S.half_sphere_mesh, m2.get(), S.material[0]);
m2.restore();
m2.save();
    m2.scale(.05, .05, .05);
    m2.translate(-10, -7, 0);
    m2.rotx(Math.PI / 2);
    m2.rotx(t);
    S.draw_mesh2(S.torus_mesh, m2.get(), S.material[3]);
m2.restore();
m2.save();
    let a = 100000;
    m2.scale(a, a, 100);
    m2.translate(0, 0, -100);
    S.draw_mesh2(S.square_mesh, m2.get(), S.material[8]);
m2.restore();
m2.save();
    a = 1000;
    m2.scale(2 * a, a, 100);
    m2.translate(0, -1, -100);
    S.draw_mesh2(S.square_mesh, m2.get(), S.material[9]);
m2.restore();
`,
events: `
    ;
`
};

}
