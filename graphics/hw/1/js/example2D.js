
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

  /* let t = 100 * Math.sin(time);

  let c = S.context;

  c.lineWidth = 10;
  c.lineCap = 'round'; 

  let wx = 200;
  let wy = 100 + t;

  S.rect(wx-1,wy-1, 2,2);

  c.beginPath();
  c.moveTo(100,100);
  c.bezierCurveTo(wx,wy, 100,300, 200,300);
  c.stroke(); */

  function color(i, j, t)
  {
    let buf = new Array(16);
    for(let i = 0; i <= 9; ++i)
      buf[i] = String.fromCharCode('0'.charCodeAt(0) + i);
    for(let i = 10; i <= 15; ++i)
      buf[i] = String.fromCharCode('a'.charCodeAt(0) + i - 10);
    let buf_n = buf.length,
    format_n = '#000000'.length,
    str = '#' + (Math.abs(parseInt(i * 100 + j * 10 + t))).toString(),
    str_n = str.length;
    if(str_n < format_n)
    {
      let diff = format_n - str_n;
      for(let idx = 0; idx < diff; ++idx)
        str += buf[(i * j * idx) % buf_n].toString().slice(0, 1);
    }
    else if(str_n > format_n)
      str = str.slice(0, format_n);
    return str;
  }

  let t = 100 * Math.tan(time),
  c = S.context,
  n = 10;
  for(let i = 0; i < n; ++i)
  {
    for(let j = 0; j < n; ++j)
    {
      c.lineWidth = 10;
      c.lineCap = 'round';

      wx = 300 + (i + j) * t;
      wy = 200 + (i - j) * t;

      S.rect(wx - 1, wy - 1, 2, 2);
      c.strokeStyle = color(i, j, t);

      c.beginPath();
      c.moveTo(i * 100, i * 100);
      c.bezierCurveTo((i + j) * wx, (i - j) * wy, (i + j) * 100, (i - j) * 300, 200, 300);
      c.stroke();
    }
  }
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

