var app;
if(process.env.port){
     app = require('https').createServer(handler) //

}
else{
 app = require('http').createServer(handler) //
}
const io = require('socket.io')(app) //wrap server app in socket io capability
const fs = require('fs') //file system to server static files
const url = require('url'); //to parse url strings
const PORT = process.env.PORT || 3000 //useful if you want to specify port through environment variable
console.log("process env " + process.env.PORT);

const ROOT_DIR = 'html' //dir to serve static files from

const MIME_TYPES = {
    'css': 'text/css',
    'gif': 'image/gif',
    'htm': 'text/html',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'txt': 'text/plain'
}

function get_mime(filename) {
    for (let ext in MIME_TYPES) {
        if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
            return MIME_TYPES[ext]
        }
    }
    return MIME_TYPES['txt']
}

app.listen(PORT) //start server listening on PORT

function handler(request, response) {
    let urlObj = url.parse(request.url, true, false)
    let filePath = ROOT_DIR + urlObj.pathname
    if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

    fs.readFile(filePath, function (err, data) {
        if (err) {
            //report error to console
            console.log('ERROR: ' + JSON.stringify(err))
            //respond with not found 404 to client
            response.writeHead(404);
            response.end(JSON.stringify(err))
            return
        }
        response.writeHead(200, {
            'Content-Type': get_mime(filePath)
        })
        response.end(data)
    })
}


///////////////////////////////////Start of actual server stuff////////////////////////////////////
//Default values for commonly used variables
var stones = []
var xBoarderLeft = 600 + 10
var xBoarderRight = 800 - 10
var yBoarderTop = 10;
var yBoarderBottom = 590;
var users = [];


function createStones() {
//Creates stones for the rink and set this with default values
    console.log("created stones")
    stones = []

    for (i = 0; i < 6; i++) {
        var stone = {
            x: 620 + i * 30,
            y: 430,
            xVel: 0,
            yVel: 0,
            color: 'grey', //(i % 2 == 0) ? 'blue' : 'red',
            radius: 10
        }
        stones.push(stone);
    }
    /*
    Testing purposes
    stones[0].color = 'green'
    stones[1].color = 'yellow'
    stones[2].color = 'blue'
    stones[3].color = 'red'
    stones[4].color = 'white'
    stones[1].x = 720
    stones[1].y = 80
    stones[1].yVel = 10
    stones[2].yVel = -20
    stones[3].yVel = -30
    stones[5].yVel = -40
    */

}
createStones();

function checkCollision(stone) {
    //Checks collision of a stone with all other stones
    for (s of stones) {
        if (isTouching(stone, s) && stone != s) {
            //console.log ("touching..." + stone + " with  " + s )
            doCollision(stone, s)
        }
    }
}

function velocity(stone) {
    //Gets the velocity of the stone
    return Math.sqrt(stone.xVel * stone.xVel + stone.yVel * stone.yVel)
}

function doCollision(Stone1, Stone2) {
    //Function which does the collision and sets the new x and y velocities

    let v = velocity(Stone1); //calculate velocity 
    console.log("velocity: " + v)

    //check distance of x values
    let dx = Stone2.x - Stone1.x
    //check distance of y values
    let dy = Stone1.y - Stone2.y

    dx = Math.abs(dx); //take absolute value of distance of xs to ensure positive number
    dy = Math.abs(dy); //take absolute value of distance of ys to ensure positive number


    let distanceBetween = Math.sqrt(dx * dx + dy * dy); //hypothenus 

    if (v == 0.0) return; //cant do divide by zero
    if (distanceBetween == 0.0) return; //cant do divide by zero

    //determine angle of line of impact with horizontal
    let angle_b = Math.asin(dy / distanceBetween);

    //determine angle of Stone 1 velocity with vertical 
    let angle_d = Math.asin(Math.abs(Stone1.xVel) / v);

    //determine angle of Stone 1 velocity line of impact
    let angle_a = (3.14159 / 2.0) - angle_b - angle_d
    //console.log("angel a " + angle_a)

    //determine angle of Stone 1 departure with horizontal
    let angle_c = angle_b - angle_a
    //console.log("angel c " + angle_c)

    let v1, v2; //new velocity vectors;
    //calculate new velocity vectors
    v1 = v * Math.abs(Math.sin(angle_a));
    v2 = v * Math.abs(Math.cos(angle_a));

    //velocities of each x and y
    let v1x, v1y, v2x, v2y;
    let stoneFriction = 1
    v1x = v1 * stoneFriction * Math.abs(Math.cos(angle_c));
    v1y = v1 * stoneFriction * Math.abs(Math.sin(angle_c));
    v2x = v2 * stoneFriction * Math.abs(Math.cos(angle_b));
    v2y = v2 * stoneFriction * Math.abs(Math.sin(angle_b));

    //set directions based on initial direction of hitting Stone
    //set horizontal directions
    if (Stone1.xVel > 0) { //Stone1 is going right
        //stone 1 is on the left of stone 2 
        if (Stone1.x < Stone2.x)
            //stone1 change direction
            v1x = -v1x
        else
            //stone1 going right and stone2 hits
            v2x = -v2x
    }
    //stone1 is going left or standing still 
    else {
        if (Stone1.x > Stone2.x)
            //stone2 changes direction 
            v2x = -v2x
        else
            //stone going right and stone2 hits
            v1x = -v1x
    }

    //same but vertical directions
    if (Stone1.yVel > 0) { //Stone1 is going right
        if (Stone1.y < Stone2.y)
            v1y = -v1y;
        else
            v2y = -v2y
    } else {
        if (Stone1.y > Stone2.y)
            v2y = -v2y
        else
            v1y = -v1y
    }

    Stone1.xVel = v1x //set new velocities for Stones
    Stone1.yVel = v1y
    Stone2.xVel = v2x
    Stone2.yVel = v2y
}

//Variables that control speed of the game
var friction = 0.25
var topspeed = 18
var wallFriction = 0.5

//Function which gets called in order to decrease the velocity of all stones and set boundries
function decreaseVelocity(stone) {
    stone.y += stone.yVel;
    stone.x += stone.xVel;
    checkCollision(stone)
    //Top speed limiting
    if (stone.yVel < -topspeed) {
        stone.yVel = -topspeed
    }
    if (stone.xVel < -topspeed) {
        stone.xVel = -topspeed
    }
    if (stone.yVel > topspeed) {
        stone.yVel = topspeed
    }
    if (stone.xVel > topspeed) {
        stone.xVel = topspeed
    }

    //Friction applying
    if (stone.xVel < 0) {
        stone.xVel += friction
    }
    if (stone.xVel > 0) {
        stone.xVel += -friction
    }

    //Reset to zero if decimal and close to one
    if (stone.xVel < 1 && stone.xVel > -1) {
        stone.xVel = 0;
    }
    if (stone.yVel < 1 && stone.yVel > -1) {
        stone.yVel = 0;
    }

    //Y axis of direction
    if (stone.y < yBoarderTop) {
        stone.y = yBoarderTop
        stone.yVel = stone.yVel * -wallFriction
    }
    if (stone.yVel < 0) {
        stone.yVel += friction
    }
    if (stone.yVel > 0) {
        stone.yVel += -friction
    }
    if (stone.y > yBoarderBottom) {
        stone.y = yBoarderBottom
        stone.yVel = stone.yVel * -wallFriction
    }
    //X axis of direction
    if (stone.x < xBoarderLeft) {
        stone.x = xBoarderLeft
        stone.xVel = stone.xVel * -wallFriction
    } else if (stone.x > xBoarderRight) {
        stone.x = xBoarderRight
        stone.xVel = stone.xVel * -wallFriction
    }

}


function isTouching(stone1, stone2) {
    //Checks if two stones are touching each other
    let x1 = stone1.x
    let y1 = stone1.y
    let x2 = stone2.x
    let y2 = stone2.y

    let distance = (x1 - x2) * (x1 - x2) +
        (y1 - y2) * (y1 - y2)

    if (distance <= 4 * (10 * 10)) //Radius of stone is 10
        return true

    return false
}


function handleStones(data) { //Takes a JSON
    //Main function where if a client sends stone, this function deals with it and calls all other function

    if (data) { //In case it sends no data
        //console.log("stones moved: " + JSON.parse(data));
        console.log(stones[0].xVel + stones[0].color)

        stones = JSON.parse(data)
        console.log(stones[0].xVel)

        if (stones == JSON.parse(data)) {
            console.log("Sucessfully copied stones")
        }
        io.emit('serverStones', JSON.stringify(stones))

    }
}

function removeAnon() {
    //Remove the anonymous user
    for (var i = 0; i < users.length; i++) {
        if (users[i].name == 'anonymous') {
            users.splice(i, 1)
            break
        }
    }
}

function findUsers(user) {
    //Find if the user is in the list of users
    for (var i = 0; i < users.length; i++) {
        if (users[i].name == user.name) {
            return true;
        }
    }
    return false;
}

function deleteColor(user) {
    //Clear the color of blue or red to be grey
    for(var tempUser of users){
        console.log("here" + user.name+ user.color + tempUser.name + tempUser.color)

        if (user.name == tempUser.name){
            user.color = tempUser.color
            break
        }
    }
    if (user.color == 'blue') {
        bluePlayer = false;
        for (let i = 0; i < 3; i++) {
            stones[i].color = 'grey'
        }
    } else if (user.color == 'red') {
        redPlayer = false;
        for (let i = 3; i < 6; i++) {
            stones[i].color = 'grey'
        }
    }
    io.emit('serverStones', JSON.stringify(stones))
    user.color = 'grey'

}

function addColor(user) {
    //Add blue or red to the stones
    if (user.color == 'blue') {
        for (let i = 0; i < 3; i++) {
            stones[i].color = 'blue'
        }
    } else if (user.color == 'red') {
        for (let i = 3; i < 6; i++) {
            stones[i].color = 'red'
        }
    }
    io.emit('serverStones', JSON.stringify(stones))


}

function deleteUser(user) {
    //Deletes the user and calls deletecolor to reset the color
    deleteColor(user)
    for (var i = 0; i < users.length; i++) {
        console.log(users[i].name + user.name)
        if (users[i].name == user.name) {
            users.splice(i, 1)
            return true;
        }
    }
    return false;
}

function addUsers(user) {
    //Add users, gets called when client sends player information

    if (user) {
        if (user.name == 'anonymous') {
            users.push(user)
            return;
        }
        if (findUsers(user) == true) {
            deleteUser(user);
        }
        console.log('Im adding a user of this color: ' + user.color)

        removeAnon();
        if (user.type == "player") {
            //console.log("Pushed a player" + user)

            if (redPlayer == false) {
                redPlayer = true
                user.color = "red"
                users.push(user)
                addColor(user)
            } else if (bluePlayer == false) {
                bluePlayer = true
                user.color = 'blue'
                users.push(user)
                addColor(user)
            } else {
                users.push({
                    name: user.name,
                    type: 'spectator',
                    color: 'grey'
                })
            }
        } else {
            users.push(user)
        }

    }
    console.log(users);
}

var bluePlayer = false;
var redPlayer = false;

function handleJoin(data) { //Takes a JSON
    //Handles the joining of users from the client

    // if (data) { //In case it sends no data
    let user = JSON.parse(data)
    addUsers(user);
    // console.log("Here it is: ")
    //}
    io.emit("join", JSON.stringify(users))

}

function handleDeath(data) {
    //Handles the leaving of a client or the switching of players to spectators
    let user = JSON.parse(data)
    console.log("Killing: " + user.name + user)
    deleteColor(user);

    for (var i = 0; i < users.length; i++) {
        if (users[i].name == user.name) {
            users.splice(i, 1)
            break
        }
    }
    io.emit("join", JSON.stringify(users))


}

function stoneIsMoving() {
    //Sees if a stone is moving
    var flag = false
    stones.forEach((stone) => {
        if (stone.xVel != 0 || stone.yVel != 0) {
            flag = true
        }
    })
    //console.log(flag)
    return flag;
}

stonesTimer = setInterval(updateStones, 100)

function updateStones() {
    //Updates stones if any of them are moving
    if (stoneIsMoving()) {
        stones.forEach((stone) => decreaseVelocity(stone)) //draws all stones
        io.emit('serverStones', JSON.stringify(stones))
    }

}

//Main connections and handlers to all requests that can be made to server.
io.on('connection', function (socket) {
    socket.emit("serverStones", JSON.stringify(stones))
    socket.on('resetBoard', (data) => {
        createStones()
        updateStones()
    })
    socket.on('moveStones', (data) => handleStones(data))
    socket.on('join', (data) => handleJoin(data))
    socket.on('death', (data) => handleDeath(data))

})

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: https://localhost:3000/assignment3.html`)
