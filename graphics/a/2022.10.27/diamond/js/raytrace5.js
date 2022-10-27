
rooms.raytrace5 = function() {

lib3D();

description = ` "A Diamond in the Rough"
<small>
    <p>  <input type=range id=red   value= 50> bg red
    <br> <input type=range id=green value=50> bg green
    <br> <input type=range id=blue  value=50> bg blue
    <br> <input type=range id=diamond_size value=50> size
    <br> <input type=range id=refract value=71> refract
         <div id=iorInfo>&nbsp;</div>
</small>
`;

code = {
'init':`

   // DEFINE MATERIALS TO BE RENDERED VIA PHONG REFLECTANCE MODEL

   S.redPlastic    = [.2,.1,.1,0,  .5,.2,.2,0,  2,2,2,20,  0,0,0,0];
   S.greenPlastic  = [.1,.2,.1,0,  .2,.5,.2,0,  2,2,2,20,  0,0,0,0];
   S.bluePlastic   = [.1,.1,.2,0,  .2,.2,.5,0,  2,2,2,20,  0,0,0,0];
   S.whitePlastic  = [.2,.2,.2,0,  .5,.5,.5,0,  2,2,2,20,  0,0,0,0];
`,

fragment: `
S.setFragmentShader(\`

   uniform float uTime;
   uniform vec4 uDiamond[9];
   uniform vec3 uDpos;
   uniform vec3 uBgColor;
   uniform float uIor;
   uniform float uSize;

   varying vec3 vPos;
   // this method finds the position and normal of a given ray's intersection
   // with our diamond (defined by nine planes)  
   mat3 rayDiamond(vec3 D,vec3 P)
   {
      float enter=-100000.;
      float exit=100000.;
      vec3 enterN=vec3(0.);
      vec3 exitN=vec3(0.);
      
      for(int i=0; i<9; i++){
         vec3 pN = normalize(vec3(uDiamond[i].xyz));
         float pO = uDiamond[i].w;
         
         float a=dot(D,pN);
         float b=(pO-dot(P,pN))/a;

         if(a<0.){
            if(b>enter){
               enter=b;
               enterN=pN;
            }
         } else if(b<exit){
            exit=b;
            exitN=pN;
         }
         if(exit<0. || enter>exit){
	    return mat3(vec3(0., enter, exit), enterN, exitN);
	 }
      }
      return mat3(vec3(1., enter, exit), enterN, exitN);
   }

   // setting the default background to a gradient of bgColor set by user
   vec3 background(vec3 P)
   {
      return (P.x+P.y+1.) * uBgColor;
   }

   // finds the reflection point based on a given refraction ratio and
   // current position and direction of light
   // we also "disperse" the refracted light to create "rainbow refraction"
   // some citations for this math:
   // (https://plus.maths.org/content/rainbows)
   // (http://www.sci.utah.edu/~dfwang/CS6610/Dafang.html)
   // (https://www.shadertoy.com) (user WAHa_06x36) 
   // (https://en.wikipedia.org/wiki/Fresnel_equations)  
   mat3 rainbow(vec3 D,vec3 N,float ratio)
   {
      vec3 reflection=D-2.0*dot(D,N)*N;
      float spl=1.-ratio*ratio*(1.-dot(N,D)*dot(N,D));
      
      vec3 refraction=vec3(0., 0., 0.);
      float refl_ratio=1.;
      
      if(spl>0.)
      {
         refraction=refract(D, N, ratio);
         float f=pow(1.-ratio,2.)/pow(1.+ratio,2.);
         refl_ratio=f+(1.-f)*pow(1.+dot(D,N),5.);
      }
      return mat3(reflection, refraction, vec3(refl_ratio, 0., 0.)); 
   }

   // this loops through our "rainbow method" 25 times, giving the 
   // effect of light bouncing throughout the diamond
   vec3 shine_diamond(vec3 D,vec3 P,vec3 N,float ratio, mat3 inv)
   {
      vec3 reflection, refraction; 
      float refl_ratio;
      
      mat3 rb = rainbow(D,N,1./ratio);
      reflection = rb[0];
      refraction = rb[1];
      refl_ratio = rb[2].x;

      vec3 color=background(inv*reflection)*refl_ratio;

      float frac=1.-refl_ratio;
      D=refraction;
      
      for(int i=0;i<25;i++)
      {
         mat3 rd = rayDiamond(D,P); 
         float hit = rd[0].x;
         float enter = rd[0].y;
         float exit = rd[0].z;
         vec3 enterN = rd[1];
         vec3 exitN = rd[2];
         
         if (hit==0.) break;
         P=P+D*exit;

         rb = rainbow(D,-exitN,ratio);
         reflection = rb[0];
         refraction = rb[1];
         refl_ratio = rb[2].x;
         

         if(refl_ratio!=1.) color+=background(inv*refraction)*(1.0-refl_ratio)*frac;

         D=reflection;
         frac*=refl_ratio;
      }
      return color;
   }

   // finally we call our methods rotating our planes to see the diamond well
   void main()
   {
      vec3 P=vec3(0.0,0.0,-uSize);
      vec3 D=normalize(vec3(vPos.xy,1.));
      vec3 D_original = D;

      float a=sin(uTime*0.6);
      float b=uTime*0.4;
      mat3 rot=mat3(cos(b),0.,-sin(b),
      	          0.,1.,    0.,
      	       sin(b),0., cos(b));
      rot*=mat3(1.,    0.,   0.,
      	      0., cos(a),sin(a),
      	      0.,-sin(a),cos(a));

      // this is just taking the transpose 
      mat3 inv = mat3( 
         vec3(rot[0].x, rot[1].x, rot[2].x),
         vec3(rot[0].y, rot[1].y, rot[2].y),
         vec3(rot[0].z, rot[1].z, rot[2].z));

      D*=rot;
      P*=rot;

      mat3 rd = rayDiamond(D,P); 
      float hit = rd[0].x;
      float enter = rd[0].y;
      float exit = rd[0].z;
      vec3 enterN = rd[1];
      vec3 exitN = rd[2];	
      vec3 color = background(D_original);
      //vec3 color = vec3(.2,.4,.7);

      if(hit!=0.)
      {
         vec3 newP=P+D*enter;
         color=shine_diamond(D,newP,enterN,uIor-.01,inv)*vec3(1.,0.,0.);
         color+=shine_diamond(D,newP,enterN,uIor+.006,inv)*vec3(0.,1.,0.);
         color+=shine_diamond(D,newP,enterN,uIor+.019,inv)*vec3(0.,0.,1.);
         gl_FragColor=vec4(color,1.);
      }

      gl_FragColor=vec4(color,1.);
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

   // USEFUL VECTOR FUNCTIONS

   let add = (a,b) => [ a[0]+b[0], a[1]+b[1], a[2]+b[2] ];
   let dot = (a,b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
   let norm = v => Math.sqrt(dot(v,v));
   let normalize = v => { let s = norm(v); return [ v[0]/s, v[1]/s, v[2]/s ]; }
   let scale = (v,s) => [ s * v[0], s * v[1], s * v[2] ];
   let subtract = (a,b) => [ a[0]-b[0], a[1]-b[1], a[2]-b[2] ];

   // SEND LIGHT SOURCE DATA TO GPU

   let ldData = [ normalize([1,1,1]),
                  normalize([-1,-1,-1]) ];
   S.setUniform('3fv', 'uLd', ldData.flat());
   S.setUniform('3fv', 'uLc', [ 1,1,1, .5,.3,.1 ]);

   // DEFINE NUMBER OF LIGHTS FOR GPU

   S.nL = ldData.length;

   // SEND BACKGROUND COLOR TO GPU

   S.setUniform('3fv', 'uBgColor', [ red.value   / 100,
                                     green.value / 100,
                                     blue.value  / 100 ]);

   // SEND INDEX OF REFRACTION AND DIAMOND SIZE TO GPU

   let ior = refract.value / 50 + 1;
   S.setUniform('1f', 'uIor', ior);

   let d_size = (100-diamond_size.value) / 33 + 3;
   S.setUniform('1f', 'uSize', d_size);

   // ITEMS FOR DIAMOND

   let s = 1;
   let dData = [0,1,0,.4*s, -1,1,1,s, 1,1,1,s, -1,-1,1,s,
      1,-1,1,s, -1,1,-1,s, 1,1,-1,s, -1,-1,-1,s, 1,-1,-1,s]
   dPos = [0, 0, -5];

   // SEND SCENE DATA TO GPU

   S.setUniform('1f', 'uTime', time);
   S.setUniform('4fv', 'uDiamond', dData);
   S.setUniform('3fv', 'uDpos', dPos); 

   // RENDER THIS ANIMATION FRAME

   S.gl.drawArrays(S.gl.TRIANGLE_STRIP, 0, 4);

   // SET ANY HTML INFO

   iorInfo.innerHTML = 'index of refraction = ' + (ior * 100 >> 0) / 100;
`,
events: `
   ;
`
};

}


