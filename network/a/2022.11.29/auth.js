const express = require('express');
  
const app = express();
const PORT = 7000;

let jwt = require('jsonwebtoken');
let config = require('./config');

app.use(express.json());

let refresh_token_array = [];

app.post('/token', (req, res) =>
{
    let refresh_token = req.body.token;
    if(!refresh_token) return res.sendStatus(401);
    if(refresh_token_array.includes(refresh_token)) return res.send(403);
    jwt.verify(refresh_token, config.refresh_token, (err, user) =>
    {
        if(err) return res.sendStatus(403);
        let access_token = generate_access_token({name: user.username});
        res.json({access_token: access_token});
    });
});

app.post('/login', (req, res) =>
{
    /* authenticate user */
    let username = req.body.username,
    user = {username: username},
    access_token = generate_access_token(user),
    refresh_token = jwt.sign(user, config.refresh_token);
    refresh_token_array.push(refresh_token);
    res.json({access_token: access_token, refresh_token: refresh_token});
});

app.delete('/logout', (req, res) =>
{
    refresh_token_array = refresh_token_array.filter(i => i != req.body.token);
    res.sendStatus(204);
});

function generate_access_token(user)
{
    return jwt.sign(user, config.access_token, {expiresIn: '30s'});
}

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);