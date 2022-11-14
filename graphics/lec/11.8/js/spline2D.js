rooms.spline2D = function() {

lib2D();

description = 'Simple example of<br>2D spline.';

code = {
'explanation': `
  S.html(\`
     A 2D canvas lets you create paths.
     <p>
     You can either
     draw <i>strokes</i> along those paths or else
     create solid shapes by <i>filling</i> those paths.
  \`);
`,
init: `
  S.x = 400;
  S.y = 400;

  S.keys = [
     {x:100, y:100, z:100},
     {x:200, y:100, z:0},
     {x:100, y:200, z:0},
     {x:200, y:200, z:0},
  ];
`,
assets: `
  S.line = (ax,ay,bx,by) => {
     S.context.beginPath();
     S.context.moveTo(ax,ay);
     S.context.lineTo(bx,by);
     S.context.stroke();
  }

  S.rect = (x,y,w,h) => {
     S.context.beginPath();
     S.context.rect(x,y,w,h);

     S.context.strokeStyle = 'white';
     S.context.stroke();

     if (S.isSpace) {
        S.context.fillStyle = 'gray';
        S.context.fill();
     }
  }

  S.spline = n => {
     let BezierMatrix = [
        -1, 3,-3, 1,
	 3,-6, 3, 0,
	-3, 3, 0, 0,
	 1, 0, 0, 0,
     ];

     let HermiteMatrix = [
         2,-3, 0, 1,
	-2, 3, 0, 0,
	 1,-2, 1, 0,
	 1,-1, 0, 0,
     ];

     let CatmullRomMatrix = [
        -1/2,  1  , -1/2, 0,
	 3/2, -5/2,  0  , 1,
	-3/2,  2  ,  1/2, 0,
	 1/2, -1/2,  0  , 0,
     ];

     let c = S.context;

     let mix = (a,b,t) => a + t * (b - a);
/*
     let px = matrixTransform(BezierMatrix, [ax,bx,cx,dx]);
     let py = matrixTransform(BezierMatrix, [ay,by,cy,dy]);

     let px = matrixTransform(HermiteMatrix, [ax,dx,bx-ax,dx-cx]);
     let py = matrixTransform(HermiteMatrix, [ay,dy,by-ay,dy-cy]);

     let px = matrixTransform(CatmullRomMatrix, [ax,bx,cx,dx]);
     let py = matrixTransform(CatmullRomMatrix, [ay,by,cy,dy]);
*/
     let mm = n => Math.max(0, Math.min(S.keys.length-1, n));

     let px = matrixTransform(CatmullRomMatrix, [ S.keys[mm(n  )].x,
                                                  S.keys[mm(n+1)].x,
                                                  S.keys[mm(n+2)].x,
                                                  S.keys[mm(n+3)].x ]);

     let py = matrixTransform(CatmullRomMatrix, [ S.keys[mm(n  )].y,
                                                  S.keys[mm(n+1)].y,
                                                  S.keys[mm(n+2)].y,
                                                  S.keys[mm(n+3)].y ]);

     let pz = matrixTransform(CatmullRomMatrix, [ S.keys[mm(n  )].z,
                                                  S.keys[mm(n+1)].z,
                                                  S.keys[mm(n+2)].z,
                                                  S.keys[mm(n+3)].z ]);

     let xr = (x, z) => {
        x -= 755 / 2;
        x = Math.cos(time) * x + Math.sin(time) * z;
        x += 755 / 2;
	return x;
     }

     c.moveTo(xr(S.keys[mm(n+1)].x,
                 S.keys[mm(n+1)].z), S.keys[mm(n+1)].y);
     for (let i = 0 ; i <= 50 ; i++) {
        let t = i / 50;
/*
	let x = mix(mix(mix(ax,bx,t), mix(bx,cx,t), t),
	            mix(mix(bx,cx,t), mix(cx,dx,t), t), t);

	let y = mix(mix(mix(ay,by,t), mix(by,cy,t), t),
	            mix(mix(by,cy,t), mix(cy,dy,t), t), t);
*/
        let x = t*(t*(t*px[0] + px[1]) + px[2]) + px[3];
        let y = t*(t*(t*py[0] + py[1]) + py[2]) + py[3];
        let z = t*(t*(t*pz[0] + pz[1]) + pz[2]) + pz[3];

        c.lineTo(xr(x, z), y);
     }
  }
`,
render: `

  let c = S.context;

  c.lineWidth = 3;
  c.lineCap = 'round'; 

  for (let n = 0 ; n < S.keys.length ; n++)
     S.rect(S.keys[n].x - 3, S.keys[n].y - 3, 6, 6);

  c.beginPath();

/*
  c.moveTo(100,100);
  c.bezierCurveTo(S.x,S.y, 100,300, 200,300);
*/

  for (let n = 0 ; n < S.keys.length-1 ; n++)
     S.spline(n-1);

  c.stroke();
`,
events: `
  onPress = (x,y) => {
     S.n = -1;
     S.dragged = false;
     for (let n = 0 ; n < S.keys.length ; n++)
        if ( x >= S.keys[n].x - 10 && x < S.keys[n].x + 10 &&
             y >= S.keys[n].y - 10 && y < S.keys[n].y + 10 )
           S.n = n; 
  }

  onDrag = (x,y) => {
     S.dragged = true;
     if (S.n >= 0) {
        S.keys[S.n].x = x;
        S.keys[S.n].y = y;
     }
  }

  onRelease = (x,y) => {
     if (! S.dragged)
        if (S.n >= 0)
	   S.keys.splice(S.n, 1);
        else
	   S.keys.push({x:x, y:y});
  }

  onKeyPress   = key => S.isSpace = key == 32;
  onKeyRelease = key => S.isSpace = false;
`
};

}

