//connect to server and retain the socket
let socket = io('https://' + window.document.location.host)

//Create default stones and players
var stones = [];
var users = new Array();
var user = {
  name: 'anonymous',
  type: 'spectator',
  color: 'grey'
};
users.push(user)

//Set the canvas text and sizes
var debug = true;
let deltaX, deltaY //location where mouse is pressed
let canvas = document.getElementById("canvas1") //our drawing canvas
var userTextField = document.getElementById("userTextField");
const context = canvas.getContext("2d");
const fontPointSize = 18 //point size for word text
const wordHeight = 20 //estimated height of a string in the editor
const editorFont = "Arial" //font for your editor
const aCanvasX = 800;
const aCanvasY = 600;

//Set the settings for the Smaller rink
var smallStoneRadius = 10;
var xBoarderLeft = 600 + smallStoneRadius
var xBoarderRight = 800 - smallStoneRadius
var yBoarderTop = 10;
var yBoarderBottom = 195;

//Set locations for mouses
var mouseLocationX = 0;
var mouseLocationY = 0;
var prevMouseX = 0
var prevMouseY = 0

//On join we send a join request
$(document).ready(function () {
  socket.emit('join', JSON.stringify(user))
  //add mouse down listener to our canvas object
  $("#canvas1").mousedown(handleMouseDown)
  //add keyboard handler to document
  $(document).keydown(handleKeyDown)
  $(document).keyup(handleKeyUp)
  //draw canvas
  drawCanvas()
})

//If server sends us stones we update our list
socket.on('serverStones', function (data) {
  let stoneData = JSON.parse(data);
  stones = stoneData;
  drawCanvas();
})

//If server sends us players we update our list
socket.on('join', function (data) {
  console.log("THis is who i was" + JSON.stringify(user))
  users = JSON.parse(data)
  for (tempUser of users) {
    console.log(user.name + tempUser.name)

    if (findUser(tempUser) == true) {
      break
    }
  }
  //if (user.name != 'anonymous') { alert(`Joined as ${user.name} + ${user.type}`) }
  updatePlayerList()
})

function drawRink(innerRadius, outerRadius, xcor, ycor, linewidth) {
  //Draws the small or big rink depending on parameters
  context.fillStyle = "grey";
  context.lineWidth = linewidth;

  context.beginPath()
  context.arc(
    xcor, //x co-ord
    ycor, //y co-ord
    outerRadius, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.strokeStyle = "blue";
  context.stroke()

  context.beginPath()
  context.arc(
    xcor, //x co-ord
    ycor, //y co-ord
    innerRadius, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.strokeStyle = "red";
  context.stroke()
}

function drawBigRocks(stone) {
  //Draws rocks on the big view
  context.beginPath();
  context.arc(
    (stone.x - 600) * screenScale, //x co-ord
    (stone.y) * screenScale, //y co-ord
    10 * screenScale, //radius
    0, //start angle
    2 * Math.PI, //end angle
    false
  )
  context.linewidth = 1;
  context.strokeStyle = "black";
  context.fillStyle = "grey";
  context.stroke();
  context.fill();
  context.beginPath();
  context.arc(
    (stone.x - 600) * screenScale, //x co-ord
    (stone.y) * screenScale, //y co-ord
    5 * screenScale, //radius
    0, //start angle
    2 * Math.PI, //end angle
    false

  )
  context.strokeStyle = stone.color;
  context.fillStyle = stone.color;
  context.stroke();
  context.fill();

}

var screenScale = 3; //The scale between big and small view

function drawRocks(stone) {
  if (stone.y < yBoarderBottom) {
    drawBigRocks(stone)
    //console.log(`stone has crossed ${stone.color}`)
  }
  //draws the big circle 
  context.beginPath();
  context.arc(
    stone.x, //x co-ord
    stone.y, //y co-ord
    10, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.linewidth = 1;
  context.strokeStyle = "black";
  context.fillStyle = "grey";
  context.stroke();
  context.fill();

  //Draws the small circle
  context.beginPath();
  context.arc(
    stone.x, //x co-ord
    stone.y, //y co-ord
    5, //radius
    0, //start angle
    2 * Math.PI //end angle
  )
  context.linewidth = 1;
  context.strokeStyle = stone.color;
  context.fillStyle = stone.color;
  context.stroke();
  context.fill();
}

//This is the main draw function which calls the smaller draw functions
function drawCanvas() {
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height); //erase canvas

  drawRink(120, 240, 300, 300, 60) //(innerRadius, outerRadius, xcor, ycor, linewidth)
  drawRink(40, 80, 700, 100, 20) //the small and big rink are to scale by 4

  context.lineWidth = 5;
  context.strokeStyle = "black"

  if (debug) {
    //Draws all the lines
    context.beginPath(); //Draws line to mouse
    context.moveTo(prevMouseX, prevMouseY);
    context.lineTo(mouseLocationX, mouseLocationY)
    context.stroke();

    context.beginPath(); //Draws the vertical line
    context.moveTo(600, 0);
    context.lineTo(600, 600)
    context.stroke();

    context.beginPath(); //Draws the horizontal line
    context.moveTo(600, 200);
    context.lineTo(800, 200)
    context.stroke();

    context.beginPath(); //Draws the horizontal line
    context.moveTo(0, 200 * screenScale);
    context.lineTo(800, 200 * screenScale)
    context.stroke();

    context.beginPath(); //Draws the horizontal line
    context.moveTo(600, 0);
    context.lineTo(800, 0)
    context.stroke();
  }
  stones.forEach((stone) => drawRocks(stone)) //draws all stones
}

function findUser(tempUser) {
  //Finds the user and sees if it exists
  if (user.name == tempUser.name) {
    console.log("I exist")
    user = tempUser
    return true
  }
  return false
}

function updatePlayerList() {
  //Updates the paragraph with all players
  let playerList = document.getElementById("playerList");
  var string = "Player List:"
  for (var tempUser of users) {
    string += `<br>${tempUser.name} as a ${tempUser.type}. `
    if (tempUser.type != 'spectator') {
      string += `You can move ${tempUser.color} stonez`
    }
  }
  playerList.innerHTML = string;
}

function getRockAtLocation(aCanvasX, aCanvasY) {
  //locate the rock targeted by aCanvasX, aCanvasY
  for (let i = 0; i < stones.length; i++) {
    let stoneWidth = 10;
    let stoneHeight = 10;
    if (
      aCanvasX > stones[i].x - stoneWidth &&
      aCanvasX < stones[i].x + stoneWidth &&
      (aCanvasY > stones[i].y - stoneHeight && aCanvasY < stones[i].y + stoneHeight)
    ) {

      return stones[i] //return the stone found
    }
  }
}

var rockBeingMoved; // Stores the rock being moved

function handleMouseDown(e) {
  //get mouse location relative to canvas top left and sees if its a rock or not

  //Required to get correct mouse location
  let rect = canvas.getBoundingClientRect()
  mouseLocationX = e.clientX - rect.left
  mouseLocationY = e.clientY - rect.top
  prevMouseX = mouseLocationX
  prevMouseY = mouseLocationY
  console.log("mouse down:" + mouseLocationX + ", " + mouseLocationY)

  rockBeingMoved = getRockAtLocation(mouseLocationX, mouseLocationY) //Check if our location is a rock
  if (rockBeingMoved != null && rockBeingMoved.color == user.color && rockBeingMoved.color != 'grey') {
    //If the person is allowed to move the rock they get the rock
    console.log("Hello, I've gotten a rock" + rockBeingMoved.color)
    //attached mouse move and mouse up handlers
    $("#canvas1").mousemove(handleMouseMove)
    $("#canvas1").mouseup(handleMouseUp)
  } else if (rockBeingMoved != null) {
    alert("You can't touch that rock")
  }

  // Stop propagation of the event and stop any default browser action
  e.stopPropagation()
  e.preventDefault()
  drawCanvas()
}

function handleMouseMove(e) {
  //get mouse location relative to canvas top left as moving and dragging
  let rect = canvas.getBoundingClientRect()
  mouseLocationX = e.clientX - rect.left
  mouseLocationY = e.clientY - rect.top

  //Comment out for real curling, where the rock starts from further back
  //rockBeingMoved.x = mouseLocationX
  //rockBeingMoved.y = mouseLocationY

  drawCanvas();
  e.stopPropagation()
  drawCanvas()
}

function handleMouseUp(e) {
  //Once mouse is up we set the rock's x and y's velocities to the distance of how far the line

  let rect = canvas.getBoundingClientRect()

  mouseLocationX = e.clientX - rect.left
  mouseLocationY = e.clientY - rect.top

  deltaX = prevMouseX - mouseLocationX
  deltaY = prevMouseY - mouseLocationY

  rockBeingMoved.xVel = deltaX / 3
  rockBeingMoved.yVel = deltaY / 3
  //console.log(rockBeingMoved.xVel + rockBeingMoved.color)
  socket.emit('moveStones', JSON.stringify(stones))
  mouseLocationX = 0
  mouseLocationY = 0
  prevMouseX = 0
  prevMouseY = 0
  //console.log("mouse up")
  e.stopPropagation()

  //remove mouse move and mouse up handlers but leave mouse down handler
  $("#canvas1").off("mousemove", handleMouseMove); //remove mouse move handler
  $("#canvas1").off("mouseup", handleMouseUp); //remove mouse up handler

  drawCanvas() //redraw thed canvas
}

function handleJoinButton(userType) {
    //If the user clicks join we send it to the server
  user = {
    name: userTextField.value,
    type: userType,
    color: 'white'
  }
  socket.emit('join', JSON.stringify(user))
}

//KEY CODES
const RIGHT_ARROW = 39
const LEFT_ARROW = 37
const UP_ARROW = 38
const DOWN_ARROW = 40

//These are keybinds which are used for testing purposes only
function handleKeyDown(e) {
  console.log("keydown code = " + e.which);

  let dXY = 5; //amount to move in both X and Y direction
  if (e.which == UP_ARROW) {
    userTextField.value = "James"
    handleJoinButton('player')

  }
  if (e.which == RIGHT_ARROW) { //right arrow
    userTextField.value = "Paulina"
    handleJoinButton('spectator')
  }
  if (e.which == LEFT_ARROW) { //left arrow
    userTextField.value = "Paulina"
    handleJoinButton('player')
  }
  if (e.which == DOWN_ARROW) {

    userTextField.value = "James"
    handleJoinButton('spectator')
  }
}
function handleKeyUp(e) {
  console.log("key UP: " + e.which)
}

//On leave we delete the player
window.onbeforeunload = function (e) {
  socket.emit('death', JSON.stringify(user));
  socket.disconnect();
};
