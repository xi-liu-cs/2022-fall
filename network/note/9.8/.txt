### project title
simulation application on browser

### what and why?
an online game, virtual reality, and audio/image processing software that has persistent data storage</br>
through building this application, aim to gain a better understanding of unix/linux networking interface, tcp/ip protocol stack, rendering, and audio/visual processing algorithms

### for whom?
for people like me, this app can have an entertaining or training aspect</br>
for example, it can be an implementation modeled on existing desktop games, but turn them to be a web application that can be directly run on the browser, so that complicated installation and dependencies can be avoided</br>
if this software turns out to be a flight simulation, it can be training software for pilots, if it includes simulations of natural phenomena, it can be used for scientific simulation or physics experimentation</br>
it can also have a pattern recognition aspect, for example, a user can put several images into the application, then the next time the application can perform facial recognition to recognize and differentiate who the person is using the device's camera. it can also have an image editing aspect, it could include an interface that the user can manipulate that triggers events to perform operations on the image. there could be also an interface for the user to control the current networking protocol used for the application for both application, transport, and network layer

### how?
each user's data will be stored, so data is not lost after the user exits the browser. database can be used to store per user information</br>
the user should see an interface that they can navigate to play different parts of the game</br>
mern stack will be used, and since professor allows the use of additional technologies in addition to mern, simulation can be done using opengl, webgl, cuda (compute unified device architecture), glsl (opengl shading language), and mpi (message passing interface)</br>
compute intensive or performance critical part can be written as functions in c, then compile it into webassembly, call the function from js, so the performance penalty of using an interpreted language can be lowered</br>

### scope
minimal working infrastructure using mern should be build first, then core functionalities would be build. if workload become big, it can be reduced to a simpler version
