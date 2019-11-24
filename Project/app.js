var {
    platform,
    floating_platforms,
    criminal,
    police,
    bullet,
    crimbullet
} = require('./playerObjects.json')

var building = floating_platforms[0];
var buildingTwo = floating_platforms[1];
var middleBuild = floating_platforms[2];
var middleBuildTwo = floating_platforms[3];
var edgeOne = floating_platforms[4];
var edgeTwo = floating_platforms[5];

var players = {}
var playerArray = []
var currentPolice = ""
var currentCriminal = ""
var numberOfPlayers = 0
var outside = " "

// Importing functions. Col is for collision detection
const col = require('./collision')
const updater = require('./updateMovementServer.js')

const express = require('express')
const socket = require('socket.io');

//App setup
const app = express();

// The port number in which our game will run
let portNumber = 9999

/* Creates a server at the designated port number. When the server is created, 
then a function is fired back */

var server = app.listen(portNumber, () => {
    console.log("Listening to requests at port " + portNumber)
});

//Static files
app.use(express.static('client'))

// Socket setup
var io = socket(server);

io.on('connection', function (socket) {
    console.log(console.log("Made socket connection", socket.id))
    numberOfPlayers++;

    if (numberOfPlayers == 1) {
        playerArray.push(socket.id)
        currentCriminal = playerArray[0]
        players[currentCriminal] = criminal
    } else if(numberOfPlayers == 2) {
        playerArray.push(socket.id)
        currentPolice = playerArray[1]
        players[currentPolice] = police
    }
    else if(numberOfPlayers > 2) {
        playerArray.push(socket.id)
    }

    /* data (the parameter inside function) contains the booleans used to check 
       whether a key has been pressed for both players */

    socket.on('playersMove', function (data) {

        var player = players[socket.id] || {}        

        // Checks if any keys have been pressed, and moves the players accordingly.

        updater.update(data.criminal, player, bullet)
        updater.update(data.police, player, crimbullet)

        // If the cooldown period finishes, then player can shoot again!

        if (bullet.bulletTime) {
            console.log("A bullet is ready! Shoot, o evil criminal!")
            io.sockets.emit('updateDownPressed', false)
            bullet.bulletTime = false;
        }

        if (crimbullet.bulletTime) {
            console.log("A bullet is ready! Shoot, young hero!")
            io.sockets.emit('updateSpacePressed', false)
            crimbullet.bulletTime = false;
        }

        // Used to check if any collisions happen between everything

        col.collisions(criminal, police, platform, building, buildingTwo, middleBuild, middleBuildTwo, edgeOne, edgeTwo, bullet, crimbullet)

        /* This stops the players from bouncing, notifies the client that the player has completed their jump */

        if (player.updateUpPressed) {
            io.sockets.emit('updateUpPressed', false)
            player.inAir = false;
            player.floating = true;
            player.updateUpPressed = false;
        }

        // Emits the police and the criminal to the client. So they can be drawn onto the canvas.
    });
    socket.on('newGame', function(data) {
        console.log("your mam les")

        police.health = 5;
        criminal.health = 5;

        police.x = 120;
        criminal.x = 1005;

        police.y = 350;
        criminal.y = 350;

        if (playerArray.length > 2) {

            if(data == "police") {

                outside = playerArray.pop()
                playerArray.unshift(outside)
                var removeIn = playerArray.indexOf(currentCriminal)
                var spliced = playerArray.splice(removeIn, 1)
                playerArray.push(spliced)

                currentCriminal = playerArray[1];
                players[currentCriminal] = criminal;
            }

            else if (data == "criminal") {

                outside = playerArray.pop();
                playerArray.unshift(outside);
                var removeIn = playerArray.indexOf(currentPolice);
                var spliced = playerArray.splice(removeIn, 1);
                playerArray.push(spliced);

                currentPolice = playerArray[0];
                players[currentPolice] = police
            }

            players[currentCriminal] = criminal
            players[currentPolice] = police;


        }
        

        

    })
});

setInterval(() => {
    io.sockets.emit('send-criminalSpecs', players)
    io.sockets.emit('send-bulletSpecs', bullet)
    io.sockets.emit('send-crimbulletSpecs', crimbullet)
}, 1000/60);