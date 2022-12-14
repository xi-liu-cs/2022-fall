rooms.spline = function() {

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
S.line = (ax,ay,bx,by) =>
{
    S.context.beginPath();
    S.context.moveTo(ax,ay);
    S.context.lineTo(bx,by);
    S.context.stroke();
}

S.rect = (x,y,w,h) =>
{
    S.context.beginPath();
    S.context.rect(x,y,w,h);

    S.context.strokeStyle = 'white';
    S.context.stroke();

    if (S.isSpace)
    {
    S.context.fillStyle = 'gray';
    S.context.fill();
    }
}

S.spline = (ax, ay, bx, by, cx, cy, dx, dy) =>
{
let bezier_matrix =
[
    -1, 3, -3, 1,
    3, -6, 3, 0,
    -3, 3, 0, 0,
    1, 0, 0, 0,
];
let c = S.context,
mix = (a, b, t) => a + t * (b - a),
px = matrixTransform(bezier_matrix, [ax, bx, cx, dx]),
py = matrixTransform(bezier_matrix, [ay, by, cy, dy]);

c.moveTo(ax, ay);
let n = 50;
for(let i = 0; i <= n; ++i)
{
    let t = i / 50,
    /* x = mix(mix(mix(ax, bx, t), mix(bx, cx, t), t),
            mix(mix(bx, cx, t), mix(cx, dx, t), t), t),
    y = mix(mix(mix(ay, by, t), mix(by, cy, t), t),
            mix(mix(by, cy, t), mix(cy, dy, t), t), t); */
    /* x = t * t * t * px[0] + t * t * px[1] + t * px[2] + px[3],
    y = t * t * t * py[0] + t * t * py[1] + t * py[2] + py[3]; */
    x = t * (t * (t * px[0] + px[1]) + px[2]) + px[3],
    y = t * (t * (t * py[0] + py[1]) + py[2]) + py[3];
    c.lineTo(x, y);
}
}
`,
render: `
let c = S.context;
c.lineWidth = 10;
c.lineCap = 'round';

S.rect(S.x - 1, S.y - 1, 2, 2);

c.beginPath();

/* c.moveTo(100, 100);
c.bezierCurveTo(S.x, S.y, 100, 300, 200, 300); */

S.spline(100,100, S.x,S.y, 100,300, 200,300);

c.stroke();

c.lineWidth = 1;
S.line(100, 100, S.x, S.y);

`,
events: `
onDrag = (x,y) => 
{
    S.x = x;
    S.y = y;
}
onKeyPress   = key => S.isSpace = key == 32;
onKeyRelease = key => S.isSpace = false;
`
};

}
    
    