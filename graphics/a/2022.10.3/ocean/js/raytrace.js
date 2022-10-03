
rooms.raytrace = function() {

lib3D();

description = `Try playing around the sliders below and get some cool effects! :)
<small>
    <p>
    <b>Atmospheric parameters</b>
    <br> <input type=range id=tod value="98",min="0",max="100"> Time of Day
    <br> <input type=range id=fi value="50",min="0",max="100"> Fog Intensity
</small>
`;

code = {
'init':`

   // DEFINE NUMBER OF SPHERES AND NUMBER OF LIGHTS

   S.nS = 50;
   S.nL = 1;

   // DEFINE MATERIALS TO BE RENDERED VIA PHONG REFLECTANCE MODEL

   let materials = [
      [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], // COPPER
      [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], // GOLD
      [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], // PLASTIC
      [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // LEAD
      [.1,.1,.1,0,     .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // SILVER
   ];

   S.material = [];
   for (let n = 0 ; n < S.nS ; n++)
      S.material.push(materials[n % materials.length]);

   // INITIALIZE SPHERE POSITIONS

   S.sPos = [];
   for (let n = 0 ; n < S.nS ; n++) {
      S.sPos.push([ Math.random() - .5,
                    0.,
                    Math.random() - .5 ]);
   }
`,
fragment: `
S.setFragmentShader(\`

   // DECLARE CONSTANTS, UNIFORMS, VARYING VARIABLES

   const int nS = \` + S.nS + \`;
   const int nL = \` + S.nL + \`;
   uniform float uTime;
   uniform float uTOD;
   uniform vec3 uBgColor;
   uniform vec4 uS[nS];
   uniform mat4 uSm[nS];
   uniform vec3 uLd[nL];
   uniform vec3 uLc[nL];

   uniform float uLi;
   uniform float uFi;

   varying vec3 vPos;

   // DEFINE CAMERA FOCAL LENGTH

   float fl = 3.;

   // TRACE A RAY TO A SPHERE

   float raySphere(vec3 V, vec3 W, vec4 S) {
      V -= S.xyz;
      V += .01 * W;
      float b = dot(V, W);
      float d = b * b - dot(V, V) + S.w * S.w;
      return d < 0. ? -1. : -b - sqrt(d);
   }

   // SHADE A SPHERE AT ONE SURFACE POINT

   vec3 shadeSphere(vec3 P, vec4 S, mat4 M) {

      // EXTRACT PHONG PARAMETERS FROM MATERIAL MATRIX

      vec3  ambient  = M[0].rgb;
      vec3  diffuse  = M[1].rgb;
      vec3  specular = M[2].rgb;
      float p        = M[2].a;

      // COMPUTE NORMAL, INIT COLOR, APPROXIMATE VECTOR TO EYE

      vec3 N = normalize(P - S.xyz);
      vec3 c = mix(ambient, uBgColor, .3);
      vec3 E = vec3(0.,0.,1.);

      // LOOP THROUGH LIGHT SOURCES

      for (int l = 0 ; l < nL ; l++) {

         // ADD DIFFUSE AND SPECULAR ONLY IF NOT IN SHADOW

         float t = -1.;
         for (int n = 0 ; n < nS ; n++)
            t = max(t, raySphere(P, uLd[l], uS[n]));

         // COMPUTE DIFFUSE AND SPECULAR FOR THIS LIGHT SOURCE

         if (t < 0.) {
            vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
            c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l]))
                         + specular * pow(max(0., dot(R, E)), p))
                         * uLi * (1. - .8 * uFi);
         }
      }
      //c *= 1. + .5 * noise(3.*N); // OPTIONAL SPOTTY TEXTURE
      c *= uLi;
      return c;
   }

   // PSEUDO SUN RAY TRACING

   float raySun(vec3 V, vec3 W) {
      vec3 sunPos = uLd[0] * 990.;
      V -= sunPos.xyz;
      V += .01 * W;
      float b = dot(V, W);
      float d = b * b - dot(V, V) + 100.;
      return d < 0. ? -1. : -b - sqrt(d);
   }

   // RETURN THE COLOR OF THE LIGHT
   
   vec3 shadeSun(vec3 V, vec3 W, float t) {
      return uLc[0] * 1.5;
   }

   // COMPUTE TRANSPARENT VERTEX COLOR

   vec3 computeTransparent(vec3 inColor, 
                           vec3 mediumColor, 
                           float mediumDistance, 
                           float mediumDensity, 
                           float fluicity) {
      float mediumPortion = mediumDistance * mediumDensity;
      float colorPortion = 1. - mediumPortion;

      mediumPortion = clamp(mediumPortion, fluicity, 1.);
      colorPortion = clamp(colorPortion, 0., 1.);
      return inColor * colorPortion + mediumColor * mediumPortion;
   }

   // COMPUTE SURFACE HEIGHT USING NOISE

   float computeSurfaceHeight(vec3 surfacePoint) {
      float n = noise(surfacePoint * 8. + vec3(uTime, uTime, 0.));
      n += noise(surfacePoint * 16. + vec3(uTime, -uTime, 0.));

      return n / 100.;
   }

   // COMPUTE NORMAL USING HEIGHTMAP DATA

   vec3 computeSurfaceNormal(vec3 surfacePoint) {
      vec3 s1 = vec3(surfacePoint.x - .001, surfacePoint.y, surfacePoint.z);
      vec3 s2 = vec3(surfacePoint.x + .001, surfacePoint.y, surfacePoint.z);
      vec3 s3 = vec3(surfacePoint.x, surfacePoint.y, surfacePoint.z - .001);
      vec3 s4 = vec3(surfacePoint.x, surfacePoint.y, surfacePoint.z + .001);

      vec3 h1 = vec3(surfacePoint.x - .001,
                     computeSurfaceHeight(s1),
                     surfacePoint.z);
      vec3 h2 = vec3(surfacePoint.x + .001,
                     computeSurfaceHeight(s2),
                     surfacePoint.z);
      vec3 h3 = vec3(surfacePoint.x,
                     computeSurfaceHeight(s3),
                     surfacePoint.z - .001);
      vec3 h4 = vec3(surfacePoint.x,
                     computeSurfaceHeight(s4),
                     surfacePoint.z + .001);

      vec3 l1 = h1 - h2;
      vec3 l2 = h3 - h4;

      // FIND THE CROSS PRODUCT OF L1 AND L2

      vec3 n = vec3(-l1.y * l2.z + l1.z * l2.y, 
                    -l1.z * l2.x + l1.x * l2.z,
                    -l1.x * l2.y + l1.y * l2.x);

      if (n.y < 0.) n.y = -n.y;

      return normalize(n);
   }

   // SHADE AN OCEAN SURFACE

   vec3 shadeSurface(vec3 W, vec3 surfacePoint) {
      vec3 c = uBgColor * .5;
      vec3 N = computeSurfaceNormal(surfacePoint);

      vec3 diffuse = vec3(.1);
      vec3 specular = vec3(.5);

      for (int l = 0 ; l < nL ; l++) {
         vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
         c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l])) * uLi
                      + specular * pow(max(0., dot(R, W)), 20.)) * uLi;
      }

      // WATER REFLECTION

      vec3 R = 2. * dot(N, -W) * N + W;
      float rtMin = 10000.;
      vec3 rc;
      for (int n = 0 ; n < nS ; n++) {
         float rt = raySphere(surfacePoint, R, uS[n]);
         if (rt > 0. && rt < rtMin) {
            rtMin = rt;
            rc = shadeSphere(surfacePoint + rt * R, uS[n], uSm[n]);
         }
      }

      float rS = raySun(surfacePoint, R);
      if (rS > 0. && rS < rtMin) {
         rtMin = rS;
         rc = shadeSun(surfacePoint, R, rtMin) * uLc[0];
      }
      if (rtMin < 10000.)
         c += .5 * rc;

      c *= uLi;

      return c;
   }

   // TRACE A PLANE SURFACE BY HEIGHT

   float raySurface(vec3 V, vec3 W, float t) {
      if (V.y + t * W.y < computeSurfaceHeight(V + t * W)) return -V.y / W.y;
      else return -1.;
   }

   // COMPUTE ATMOSPHERIC FOG

   vec3 computeFog(vec3 V, vec3 W, float t, vec3 color) {
      // COMPUTE THE DISTANCE AND POSITION OF THE END POINT
      vec3 endPos = V + t * W;

      if (endPos.y > 100.) t *= (100. / endPos.y);
      if (endPos.y < 0.) t = -V.y / W.y;

      float maxDistance = 10000.;
      maxDistance = clamp(maxDistance * (1. - uFi), 5., 10000.);

      // DETERMINE HOW MUCH FOG IS CAST THROUGH THE RAY

      float a = clamp(log(t) / log(maxDistance), .2, 1.) * uFi;

      vec3 fogColor = (.5 * uLi * a) * uLc[0];

      return color * (1. - uFi) + fogColor;
   }

   void main() {

      // BACKGROUND COLOR IS THE DEFAULT COLOR

      vec3 color = uBgColor * uLi;
      //vec3 color = getSkyColor(vPos);

      // DEFINE RAY INTO SCENE FOR THIS PIXEL

      vec3 V = vec3(0.,.2,fl);
      vec3 W = normalize(vec3(vPos.xy, -fl));

      // LOOP THROUGH SPHERES

      float tMin = 10000.;
      for (int n = 0 ; n < nS ; n++) {
         float t = raySphere(V, W, uS[n]);
         if (t > 0. && t < tMin) {

            // IF THIS IS THE NEAREST SPHERE, DO PHONG SHADING

            vec3 P = V + t * W;
            color = shadeSphere(P, uS[n], uSm[n]);
            tMin = t;

            // SEE WHETHER ANY OTHER SPHERE IS VISIBLE VIA REFLECTION

            vec3 N = normalize(P - uS[n].xyz);
            vec3 R = 2. * dot(N, -W) * N + W;
            float rtMin = 10000.;
            vec3 rColor;
            for (int rn = 0 ; rn < nS ; rn++) {
               float rt = raySphere(P, R, uS[rn]);
               if (rt > 0. && rt < rtMin) {
                  rtMin = rt;
                  rColor = shadeSphere(P + rt * R, uS[rn], uSm[rn]);
               }
            }
            if (rtMin < 10000.)
               color += .5 * rColor;
         }
      }

      // RAY TRACE AND SHADE THE SUN

      float tSun = raySun(V, W);
      if (tSun > 0. && tSun < tMin) {
         color += shadeSun(V, W, tSun);
         tMin = tSun;
      }

      // RAY TRACE SEA SURFACE

      float tS = raySurface(V, W, tMin);

      if (tS > 0. && tS < tMin) {
         vec3 wColor = shadeSurface(W, V + tS * W);
         color = computeTransparent(color, wColor, (tMin - tS), 3., 1.);
      }

      // ADD FOG LAYER

      color = computeFog(V, W, tMin, color);

      // SET PIXEL COLOR

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

   // HANDY DANDY VECTOR LIBRARY

   let add = (a,b) => [ a[0]+b[0], a[1]+b[1], a[2]+b[2] ];
   let dot = (a,b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
   let norm = v => Math.sqrt(dot(v,v));
   let normalize = v => {
      let s = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
      return [ v[0]/s, v[1]/s, v[2]/s ];
   }
   let scale = (v,s) => [ s * v[0], s * v[1], s * v[2] ];
   let subtract = (a,b) => [ a[0]-b[0], a[1]-b[1], a[2]-b[2] ];

   // DEFINE RADIUS OF EACH SPHERE

   let radius = .05;

   // GET ATMOSPHERIC DATA

   let timeOfDay = tod.value;
   let ldX = 1. - timeOfDay / 50.;
   let ldY = Math.sin((timeOfDay / 100.) * 3.14159265);

   let lcG = .5 + .5 * Math.sin((timeOfDay / 100.) * 3.14159265);
   let lcB = Math.sin((timeOfDay / 100.) * 3.14159265);

   // SEND LIGHT SOURCE DATA TO GPU

   let ldData = [ normalize([.2,ldY,ldX]) ];
   let lIntensity = 1. + .5 * Math.sin((timeOfDay / 100.) * 3.14159265);

   let lcData = [1,lcG,lcB];

   S.setUniform('3fv', 'uLd', ldData.flat());
   S.setUniform('3fv', 'uLc', lcData);
   S.setUniform('1f', 'uLi', lIntensity);

   // SEND FOG DATA TO GPU

   let fogIntensity = fi.value / 100.;
   
   if (fogIntensity < 0) fogIntensity = 0;
   else if (fogIntensity > 1) fogIntensity = 1;

   S.setUniform('1f', 'uFi', fogIntensity);

   // SEND ANIMATION TIME TO GPU

   S.setUniform('1f', 'uTime', time);

   // MOVE SPHERES INTO PLACE FOR THIS ANIMATION FRAME
   // USE A SINE FUNCTION TO PERFORM A PSEUDO FLUID PHYSICS SIMULATION

   for (let n = 0 ; n < S.nS ; n++) {
      S.sPos[n][1] = .005 * Math.sin(S.sPos[n][0] * 50. + time * 8.);
   }

   // AVOID SPHERE INTERPENETRATION
   
   for (let m = 0 ; m < S.nS ; m++)
   for (let n = 0 ; n < S.nS ; n++)
      if (m != n) {
         let D = subtract(S.sPos[m], S.sPos[n]);
         let d = norm(D);
         if (d < 2 * radius) {
            let t = 2 * radius - d;
            for (let i = 0 ; i < 3 ; i++) {
               S.sPos[m][i] += t * D[i] / d;
               S.sPos[n][i] -= t * D[i] / d;
            }
         }
      }
   
   // SEND SPHERES DATA TO GPU

   let sData = [];
   for (let n = 0 ; n < S.nS ; n++)
      sData.push(S.sPos[n], radius);
   S.setUniform('4fv', 'uS', sData.flat());
   S.setUniform('Matrix4fv', 'uSm', false, S.material.flat());

   // SEND BACKGROUND COLOR TO GPU

   S.setUniform('3fv', 'uBgColor', [ .15,.2,.85 ]);

   // RENDER THIS ANIMATION FRAME

   S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
};

}


