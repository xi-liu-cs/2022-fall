
rooms.example2D = function() {

lib2D();

description = 'Simple example of<br>interactive 2D.';

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
`,
render: `

  //S.rect(S.x - 50, S.y - 50, 100, 100);

let ctx = S.context;
ctx.lineWidth = 20;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo       (400, 100);
ctx.bezierCurveTo(500, 100,
                  600, 200,
                  500, 200 + Math.sin(time)*100);
ctx.stroke();

`,
events: `
  onDrag = (x,y) => {
     S.x = x;
     S.y = y;
  }
  onKeyPress   = key => S.isSpace = key == 32;
  onKeyRelease = key => S.isSpace = false;
`
};

}

