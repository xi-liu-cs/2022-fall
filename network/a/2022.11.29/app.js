const express = require('express');
  
const app = express();
const PORT = 5500;

let jwt = require('jsonwebtoken');
let config = require('./config');

app.use(express.json());

let a =
[
    {username: 'abc',
    hash: '123'},
    {username: 'def',
    hash: '456'},
];

app.get('/', authenticate_token, (req, res) =>
{
    res.json(a.filter(i => i.username == req.user.username));
});

function authenticate_token(req, res, next)
{
    let auth_header = req.headers['authorization'], /* console.log('0:', auth_header.split(' ')[0]); console.log('1:', auth_header.split(' ')[1]); */
    token = auth_header && auth_header.split(' ')[1]; /* bearer token */
    if(!token) return res.sendStatus(401);
    jwt.verify(token, config.access_token, (err, user) =>
    {
        if(err) return res.sendStatus(403);
        req.user = user;
        next();
    });
} 

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);