
rooms.raytrace = function() {

lib3D();

description = `Try playing around with the camera!
<small>
    <p>
    <b>Atmospheric parameters</b>
    <br> <input type="range" id="tod" value="60",min="1",max="100"> Time of Day
    <br> <input type="range" id="fi"  value="10",min="1",max="100"> Fog Intensity
    <br> <input type="range" id="ci"  value="100",min="1",max="100"> Cloud Intensity
    <br> <input type="range" id="ch"  value="30",min="1",max="100"> Camera Height
    <br> <input type="range" id="cpx"  value="50",min="1",max="100"> Camera Position X
    <br> <input type="range" id="cpz"  value="100",min="1",max="100"> Camera Position Z
</small>
`;

code = {
'init':`

   // DEFINE NUMBER OF LIGHTS

   S.nL = 1;

   // DEFINE CAMERA POSITION

   S.cPos = [0.,-.2,2.];

   // DEFINE MATERIALS TO BE RENDERED VIA PHONG REFLECTANCE MODEL

   let materials = [
      [.15,.05,.025,0, .3,.1,.05,0, .6,.2,.1,3, 0,0,0,0], // COPPER
      [.25,.15,.025,0, .5,.3,.05,0, 1,.6,.1,6,  0,0,0,0], // GOLD
      [.25,0,0,0,      .5,0,0,0,    2,2,2,20,   0,0,0,0], // PLASTIC
      [.05,.05,.05,0,  .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // LEAD
      [.1,.1,.1,0,     .1,.1,.1,0,  1,1,1,5,    0,0,0,0], // SILVER
   ];
`,
fragment: `
S.setFragmentShader(\`

   // DECLARE CONSTANTS, UNIFORMS, VARYING VARIABLES

   const int nQ = \` + S.nQ + \`;
   const int nL = \` + S.nL + \`;

   uniform vec3 uCamPos;
   uniform float uTime;
   uniform float uTOD;
   uniform vec3 uBgColor;
   uniform vec3 uLd[nL];
   uniform vec3 uLc[nL];

   uniform float uLi;
   uniform float uFi;
   uniform float uCi;

   uniform mat4 uQ[nQ];

   varying vec3 vPos;

   // DEFINE CAMERA FOCAL LENGTH

   float fl = 3.;

   // COMPUTE REFRACTION RAY

   vec3 computeRefraction(vec3 W1, vec3 N, float rFactor) {
      vec3 C1 = N * dot(W1, N);
      vec3 S1 = W1 - C1;
      float theta1 = length(S1);
      float theta2 = asin(theta1 * rFactor);
      vec3 C2 = C1 * cos(theta2) / cos(theta1);
      vec3 S2 = S1 * sin(theta2) / sin(theta1);
      return C2 + S2;
   }

   // COMPUTE EXPONENTIAL FOG

   vec3 expFog(vec3 inColor, vec3 fogColor, float t, float fogIntensity) {
      t = max(1., t);
      float a = pow(1. - fogIntensity, log(t));
      return mix(fogColor * uLi, inColor, a);
   }

   // RAY TRACING QUADRIC SURFACE

   vec3 normalQuadric(vec3 P, mat4 Q) {
      float a = Q[0][0];
      float b = Q[0][1];
      float c = Q[0][2];
      float d = Q[0][3];
      float e = Q[1][0];
      float f = Q[1][1];
      float g = Q[1][2];
      float h = Q[1][3];
      float i = Q[2][0];
      float j = Q[2][1];
      float k = Q[2][2];
      float l = Q[2][3];
      float m = Q[3][0];
      float n = Q[3][1];
      float o = Q[3][2];
      float p = Q[3][3];

      float fx = 2. * a * P.x + (b + e) * P.y + (c + i) * P.z + (d + m);
      float fy = (b + e) * P.x + 2. * f * P.y + (g + j) * P.z + (h + n);
      float fz = (c + i) * P.x + (g + j) * P.y + 2. * k * P.z + (l + o);

      float nOffset = noise(P * 50.) * 2.;

      return normalize(vec3(fx, fy, fz) + vec3(nOffset));
   }

   vec2 rayQuadric(vec3 V, vec3 W, mat4 Q) {
      vec4 V1 = vec4(V, 1.);
      vec4 W0 = vec4(W, 0.);

      float a = dot(W0, Q * W0);
      float b = dot(V1, Q * W0) + dot(W0, Q * V1);
      float c = dot(V1, Q * V1);

      if (b * b - 4. * a * c < 0.) return vec2(-1.);

      float r1 = (-b - sqrt(b * b - 4. * a * c)) / (2. * a);
      float r2 = (-b + sqrt(b * b - 4. * a * c)) / (2. * a);

      return vec2(r1, r2);
   }

   vec2 rayTube(vec3 V, vec3 W, mat4 Q1, mat4 Q2, float tMax) {
      vec2 t1 = rayQuadric(V, W, Q1);
      vec2 t2 = rayQuadric(V, W, Q2);

      float tIn = max(t1.x, t2.x);
      float tOut = min(t1.y, t2.y);

      float s = 0.;
      if (t1.x < t2.x) s = 1.;

      if ((tIn > 0. && tIn < tMax) && tIn < tOut) return vec2(tIn, s);

      return vec2(-1., s);
   }

   vec3 shadeTube(vec3 P, vec3 N) {
      vec3 diffuse  = vec3(.8, .2, .1);
      vec3 specular = vec3(.5, .3, .05);
      float p       = 2.;

      vec3 c = vec3(0.);
      vec3 E = vec3(0.,0.,1.);

      // LOOP THROUGH LIGHT SOURCES

      for (int l = 0 ; l < nL ; l++) {
         for (int i = 0; i < nQ; i += 2) {
            vec2 s = rayTube(P, uLd[0], uQ[i], uQ[i + 1], 1000.);
            if (s.x > 0.) {
               diffuse = vec3(0.);
               specular = vec3(0.);
            }
         }
         vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
         c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l]))
                     + specular * pow(max(0., dot(R, E)), p))
                     * uLi;
      }

      c *= uLi;
      return c;
   }

   // FOLLOWING RENDER ATMOSPHERIC PHENOMENAL

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

   // COMPUTE AND SHADE THE NOISE-BASED CLOUDS USING RAY-MARCHING

   vec3 shadeCloud(vec3 V, vec3 W, float t) {
      if (V.y + t * W.y > 10.) {
         t = (10. - V.y) / W.y;
         vec3 cloudPoint = V + t * W;
         float layer = abs(noise(cloudPoint * .01 - vec3(uTime * .01)));
         layer *= abs(noise(cloudPoint * .05 + vec3(uTime * .1)));

         return layer * uLc[0] * uCi;
      }
      else {
         return vec3(0.);
      }
   }

   // COMPUTE SURFACE HEIGHT USING NOISE

   float computeSurfaceHeight(vec3 surfacePoint) {
      float n = noise(surfacePoint * 8. + vec3(uTime, uTime, 0.));
      n += noise(surfacePoint * 16. + vec3(uTime, -uTime, 0.));

      return n / 100.;
   }

   vec3 shadeUnderwater(vec3 V, vec3 W) {
      // FOR SHADING UNDER THE WATER, GIVE A FIXED DISTANCE AND RAY-MARCHING IT

      float t = 2.;
      float deltaT = 2.;

      float l = 0.;

      vec3 c = vec3(0.);
      vec3 samplePoint = V;

      for (int i = 0; i < 5; i++) {
         samplePoint += t * W;

         // CAST LIGHT ONLY IF THE SAMPLING POINT IS ABOVE A CERTAIN HEIGHT
         if (-samplePoint.y > uLi && samplePoint.y < 0.) {
            float h = -samplePoint.y;
            float d = h * length(uLd[0]) / uLd[0].y;
            l += computeSurfaceHeight(samplePoint + d * uLd[0]);
         }

         t += deltaT;
      }

      c += vec3(l / 2.);
      
      float a = clamp(0., 1., (samplePoint.y * samplePoint.y) / 1000.);
      c += mix(uBgColor * .5, vec3(0.), a);
      return c;
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

      vec3 n = vec3(l1.y * l2.z - l1.z * l2.y, 
                    l1.z * l2.x - l1.x * l2.z,
                    l1.x * l2.y - l1.y * l2.x);

      if (n.y < 0.) n = -n;

      return normalize(n);
   }

   // TRACE AND SHADE THE SEA FLOOR

   float rayFloor(vec3 V, vec3 W, float t) {
      if (V.y + t * W.y < -1.) return (-1. - V.y) / W.y;
      else return -1.;
   }

   // COMPUTE CAUSTICS USING SEA SURFACE NOISE

   vec3 shadeFloor(vec3 P) {
      for (int i = 0; i < nQ; i += 2) {
         vec2 s = rayTube(P, normalize(uLd[0] + .01 * computeSurfaceNormal(P))
                           , uQ[i], uQ[i + 1], 1000.);
         if (s.x > 0.) {
            return vec3(.2);
         }
      }

      float caustics = abs(noise((P + uLd[0]) * 3. - vec3(uTime * .5)));
      caustics += abs(noise((P + uLd[0]) * 5. + vec3(uTime * .5)));
      caustics = 1. - caustics;
      caustics = pow(caustics, 4.);
      caustics *= uLi;
      return vec3(.5 + caustics);
   }

   // TRACE A PLANE SURFACE BY HEIGHT

   float raySurface(vec3 V, vec3 W, float t) {
      if (V.y + t * W.y < computeSurfaceHeight(V + t * W)) return -V.y / W.y;
      else return -1.;
   }

   // TRACE A PLANE SURFACE BY HEIGHT UNDERWATER

   float raySurfaceUnder(vec3 V, vec3 W, float t) {
      if (V.y + t * W.y > computeSurfaceHeight(V + t * W)) return -V.y / W.y;
      else return -1.;
   }

   // SHADE AN OCEAN SURFACE

   vec3 shadeSurface(vec3 W, vec3 P, float t) {
      vec3 c = expFog(uBgColor * .5, uLc[0] * .2, 100., uFi);
      vec3 N = computeSurfaceNormal(P);

      vec3 diffuse = vec3(.1);
      vec3 specular = vec3(1.);

      for (int l = 0 ; l < nL ; l++) {
         vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
         c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l])) * uLi
                      + specular * pow(max(0., dot(R, W)), 20.)) * uLi;
      }

      // WATER REFRACTION

      vec3 rfc = vec3(0.);
      float rftMin = 10.;

      if (t < 10.) {
         vec3 rDir = computeRefraction(W, N, .5);
         /*
         float rfFloor = rayFloor(P, rDir, rftMin);

         if (rfFloor > 0. && rfFloor < rftMin) {
            rftMin = rfFloor;
            rfc = shadeFloor(P + rDir * rftMin);
         }
         */
         for (int i = 0; i < nQ; i += 2) {
            vec2 rfQ = rayTube(P, rDir, uQ[i], uQ[i + 1], rftMin);
            if (rfQ.x > 0. && rfQ.x < rftMin) {
               rftMin = rfQ.x;
               vec3 rfN;
               if (rfQ.y == 0.) rfN = normalQuadric(P + rfQ.x * rDir, uQ[i]);
               else rfN = normalQuadric(P + rfQ.x * rDir, uQ[i + 1]);
               rfc = shadeTube(P + rfQ.x * rDir, rfN);
            }
         }
      }

      if (rftMin < 10.) c = mix(rfc, c, 1. - rftMin / 10.);

      // WATER REFLECTION

      vec3 R = 2. * dot(N, -W) * N + W;
      float rtMin = 10000.;
      vec3 rc = vec3(0.);

      for (int i = 0; i < nQ; i += 2) {
         vec2 rQ = rayTube(P, R, uQ[i], uQ[i + 1], rtMin);
         if (rQ.x > 0. && rQ.x < rtMin) {
            rtMin = rQ.x;
            vec3 rN;
            if (rQ.y == 0.) rN = normalQuadric(P + rQ.x * R, uQ[i]);
            else rN = normalQuadric(P + rQ.x * R, uQ[i + 1]);
            rc = shadeTube(P + rQ.x * R, rN);
         }
      }

      float rS = raySun(P, R);
      if (rS > 0. && rS < rtMin) {
         rtMin = rS;
         rc = shadeSun(P, R, rtMin) * uLc[0];
      }

      if (rtMin < 10000.) c = mix(c, rc, .5);

      c *= uLi;

      return c;
   }

   // SHADE AN OCEAN SURFACE UNDERWATER

   vec3 shadeSurfaceUnder(vec3 W, vec3 P, float t) {
      vec3 c = expFog(uBgColor * .5, uLc[0] * .2, 100., uFi);
      vec3 N = -computeSurfaceNormal(P);

      vec3 diffuse = vec3(.1);
      vec3 specular = vec3(.2);

      for (int l = 0 ; l < nL ; l++) {
         vec3 R = 2. * dot(N, uLd[l]) * N - uLd[l];
         c += uLc[l] * (diffuse * max(0.,dot(N, uLd[l])) * uLi
                      + specular * pow(max(0., dot(R, W)), 20.)) * uLi;
      }

      // WATER REFRACTION

      vec3 rfc = vec3(0.);
      float rftMin = 10.;

      if (t < 10.) {
         vec3 rDir = computeRefraction(W, N, .5);
         /*
         float rfFloor = rayFloor(P, rDir, rftMin);

         if (rfFloor > 0. && rfFloor < rftMin) {
            rftMin = rfFloor;
            rfc = shadeFloor(P + rDir * rftMin);
         }
         */
         for (int i = 0; i < nQ; i += 2) {
            vec2 rfQ = rayTube(P, rDir, uQ[i], uQ[i + 1], rftMin);
            if (rfQ.x > 0. && rfQ.x < rftMin) {
               rftMin = rfQ.x;
               vec3 rfN;
               if (rfQ.y == 0.) rfN = normalQuadric(P + rfQ.x * rDir, uQ[i]);
               else rfN = normalQuadric(P + rfQ.x * rDir, uQ[i + 1]);
               rfc = shadeTube(P + rfQ.x * rDir, rfN);
            }
         }
      }

      if (rftMin < 10.) c = mix(rfc, c, 1. - rftMin / 10.);

      c *= uLi;

      return c;
   }

   // GENERATE TERRAIN HEIGHT USING NOISE

   float getTerrainHeight(vec3 P) {
      float h = noise(P * .02);
      h += noise(P * .01);

      return h * 10.;
   }

   // TRACE A NOISE-GENERATED TERRAIN USING RAY-MARCHING

   float rayTerrain(vec3 V, vec3 W) {
      vec3 s = V + 800. * W;

      float t = 800.;

      for (int i = 0; i < 20; i++) {
         if (getTerrainHeight(s + 20. * W) > (s + 20. * W).y) break;
         s += 10. * W;
         t += 10.;
      }

      if (t < 1000.) return t - 10.;
      return -1.;
   }

   void main() {

      vec3 color;
      vec3 V = uCamPos + vec3(0., 0., fl);
      vec3 W = normalize(vec3(vPos.xy, -fl));

      if ((V + W).y > computeSurfaceHeight(V + W)) {

         // BACKGROUND COLOR IS THE DEFAULT COLOR

         color = uBgColor * uLi;

         // DEFINE RAY INTO SCENE FOR THIS PIXEL

         float tMin = 1000.;

         // RAY TRACE THE QUADRIC SURFACES

         for (int i = 0; i < nQ; i += 2) {
            vec2 tQ = rayTube(V, W, uQ[i], uQ[i + 1], tMin);

            if (tQ.x > 0. && tQ.x < tMin) {
               tMin = tQ.x;
               vec3 n;
               if (tQ.y == 0.) {
                  n = normalQuadric(V + tMin * W, uQ[i]);
               }
               else {
                  n = normalQuadric(V + tMin * W, uQ[i + 1]);
               }

               color = shadeTube(V + tMin * W, n);
            }
         }

         // RAY TRACE AND SHADE THE SUN AND CLOUDS

         float tSun = raySun(V, W);
         if (tSun > 0. && tSun < tMin) {
            color += shadeSun(V, W, tSun);
            tMin = tSun;
         }

         color += shadeCloud(V, W, tMin);

         // RAY TRACE SEA SURFACE

         float tS = raySurface(V, W, tMin);

         if (tS > 0. && tS < tMin) {
            tMin = tS;
            color = shadeSurface(W, V + tS * W, tMin);
         }

         // RAY TRACE TERRAIN
         
         float tT = rayTerrain(V, W);
         if (tT > 0. && tT < tMin) {
            tMin = tT;
            color = vec3(0.);
         }
         
         // ADD FOG LAYER

         color = expFog(color, uLc[0], tMin, uFi);
      }
      else {
         // RAY TRACE UNDERWATER

         float tMin = 100.;

         vec3 fogC = shadeUnderwater(V, W);

         // RAY TRACE QUADRIC SURFACES UNDERWATER

         for (int i = 0; i < nQ; i += 2) {
            vec2 tQ = rayTube(V, W, uQ[i], uQ[i + 1], tMin);

            if (tQ.x > 0. && tQ.x < tMin) {
               tMin = tQ.x;
               vec3 n;
               if (tQ.y == 0.) {
                  n = normalQuadric(V + tMin * W, uQ[i]);
               }
               else {
                  n = normalQuadric(V + tMin * W, uQ[i + 1]);
               }

               color = shadeTube(V + tMin * W, n);
            }
         }

         // RAY TRACE SEA FLOOR

         float tF = rayFloor(V, W, tMin);

         if (tF > 0. && tF < tMin) {
            tMin = tF;
            color = shadeFloor(V + tMin * W);
         }

         // RAY TRACE SEA SURFACE UNDERWATER

         float tS = raySurfaceUnder(V, W, tMin);

         if (tS > 0. && tS < tMin) {
            tMin = tS;
            color = shadeSurfaceUnder(W, V + tS * W, tMin);
         }

         color = expFog(color, fogC, tMin, .8);
      }

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

   // MATRIX LIBRARY

   let matrixIdentity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

   let matrixInverse = function(src) {
   let dst = [], det = 0, cofactor = (c, r) => {
      let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
      return (c+r & 1 ? -1 : 1) * ( (s(1,1) * (s(2,2) * s(3,3) - s(3,2) * s(2,3)))
                                 - (s(2,1) * (s(1,2) * s(3,3) - s(3,2) * s(1,3)))
                                 + (s(3,1) * (s(1,2) * s(2,3) - s(2,2) * s(1,3))) );
      }
      for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
      for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
      for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
      return dst;
   }

   let matrixMultiply = function(a, b) {
      let dst = [];
      for (let n = 0 ; n < 16 ; n++)
         dst.push( a[n&3     ] * b[n&12    ] +
                  a[n&3 |  4] * b[n&12 | 1] +
                  a[n&3 |  8] * b[n&12 | 2] +
                  a[n&3 | 12] * b[n&12 | 3] );
      return dst;
   }

   let matrixRotx = t => {
      let c = Math.cos(t), s = Math.sin(t);
      return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1];
   }

   let matrixRoty = t => {
      let c = Math.cos(t), s = Math.sin(t);
      return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1];
   }

   let matrixRotz = t => {
      let c = Math.cos(t), s = Math.sin(t);
      return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1];
   }

   let matrixScale = (x,y,z) => [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];

   let matrixTranslate = (x,y,z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];

   let matrixTranspose = function(m) {
      return [ m[0],m[4],m[ 8],m[12],
               m[1],m[5],m[ 9],m[13],
               m[2],m[6],m[10],m[14],
               m[3],m[7],m[11],m[15] ];
   }

   let mTranslate = (x,y,z, M) => matrixMultiply(M, matrixTranslate(x,y,z));
   let mRotx      = (theta, M) => matrixMultiply(M, matrixRotx(theta));
   let mRoty      = (theta, M) => matrixMultiply(M, matrixRoty(theta));
   let mRotz      = (theta, M) => matrixMultiply(M, matrixRotz(theta));
   let mScale     = (x,y,z, M) => matrixMultiply(M, matrixScale(x,y,z));

   // DIFFERENT QUADRIC SURFACES

   let qSlabX  = [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,-1]; // x*x - 1 <= 0
   let qSlabY  = [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1]; // y*y - 1 <= 0
   let qSlabZ  = [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1]; // z*z - 1 <= 0
   let qSphere = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1]; // x*x + y*y + z*z - 1 <= 0
   let qTubeX  = [0,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,-1]; // y*y + z*z - 1 <= 0
   let qTubeY  = [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,-1]; // x*x + z*z - 1 <= 0
   let qTubeZ  = [1,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,-1]; // x*x + y*y - 1 <= 0

   // SHAPES ARE INTERSECTIONS OF QUADRIC SURFACES

   let coefs = [], xform = [], M;

   let tubeX = (M) => {
      xform.push(M, M);
      coefs.push(qTubeX, qSlabX);
   }

   let tubeY = (M) => {
      xform.push(M, M);
      coefs.push(qTubeY, qSlabY);
   }

   tubeY(mScale(.05,1.,.05, matrixTranslate( .5,0.,-3.)));
   tubeY(mScale(.05,1.,.05, matrixTranslate(-.5,0.,-3.)));
   tubeX(mScale(.8,.05,.05, matrixTranslate( 0.,1.,-3.)));
   tubeX(mScale(.5,.05,.05, matrixTranslate( 0.,.8,-3.)));

   for (let n = 0 ; n < coefs.length ; n++) {
      let IM = matrixInverse(xform[n]);
      coefs[n] = matrixMultiply(matrixTranspose(IM), matrixMultiply(coefs[n], IM));
   }

   S.setUniform('Matrix4fv', 'uQ', false, coefs.flat());

   // SEND CAMERA INFO TO GPU

   let cmX = cpx.value;
   let cmY = ch.value;
   let cmZ = cpz.value;
   S.cPos = [(cmX - 50.) / 50.,(cmY - 25.) / 50.,(cmZ - 50.) / 10.];

   S.setUniform('3fv', 'uCamPos', S.cPos);

   // GET ATMOSPHERIC DATA

   let timeOfDay = tod.value;
   let ldZ = 1. - timeOfDay / 50.;
   let ldY = Math.sin((timeOfDay / 100.) * Math.PI);

   let lcG = .5 + .5 * Math.sin((timeOfDay / 100.) * Math.PI);
   let lcB = Math.sin((timeOfDay / 100.) * Math.PI);

   // SEND LIGHT SOURCE DATA TO GPU

   let ldData = [ normalize([.2,ldY,ldZ]) ];
   let lIntensity = 1. + .5 * Math.sin((timeOfDay / 100.) * Math.PI);

   let lcData = [1,lcG,lcB];

   S.setUniform('3fv', 'uLd', ldData.flat());
   S.setUniform('3fv', 'uLc', lcData);
   S.setUniform('1f', 'uLi', lIntensity);

   // SEND FOG DATA TO GPU

   let fogIntensity = fi.value / 100.;

   S.setUniform('1f', 'uFi', fogIntensity);

   let cloudIntensity = ci.value / 100.;

   S.setUniform('1f', 'uCi', cloudIntensity);

   // SEND ANIMATION TIME TO GPU

   S.setUniform('1f', 'uTime', time);

   //S.setUniform('Matrix4fv', 'uSm', false, S.material.flat());

   // SEND BACKGROUND COLOR TO GPU

   S.setUniform('3fv', 'uBgColor', [ .15,.2,.85 ]);

   // DEFINE NUMBER OF QUADRIC SURFACES FOR GPU

   S.nQ = coefs.length;

   // RENDER THIS ANIMATION FRAME

   S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);
`,
events: `
   ;
`
};

}


