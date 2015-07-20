var express = require('express');
var morgan = require('morgan');
var http = require('http');
var moment = require('moment');
var bodyParser = require('body-parser');

var sassMiddleware = require('node-sass-middleware');
var path = require('path');
var app = express();

app.set('port', process.env.PORT || 80);
var server = app.listen(app.get('port'));
var io = require('socket.io').listen(server);


app.use(morgan('combined'));
app.set('view engine', 'ejs');
app.use(sassMiddleware({
src: path.join(__dirname, 'sass'),
dest: path.join(__dirname, 'public'),
debug: true,
outputStyle: 'compressed',
prefix: 'public'
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

var names = [];
var answers = [];



io.on('connection', function(socket){

	////// BOARD LOGIC BELOW //////


	//// USER LOGIC BELOW
	socket.emit('authorize');
	var logout;

  socket.on('register', function(name){
  	if (name['name'] !== '' && names.indexOf(name['name']) == -1) {
	  	names.push(name['name']);
	  	logout = name['name'];
	  	console.log(names);
	  	socket.emit('username', {username: name});
	  	io.emit('usernames', {usernames: names});
	  	io.emit('canvascall', {usernames: names});
  	} 
// if the name is taken/an empty string, it will reprompt the user until there's a valid username
  	else {
  		socket.emit('authorize');
  		console.log('error');
  	}
  });

// whenever someone posts something to the chat, this will send the message to be appended to everyone's chats along with a date
	socket.on('chat', function(message){
		var now = moment().format('HH:mm:ss');
		// broadcasting to everyone
		io.emit('message', message);
		io.emit('date', now);
	});

// this will listen for a disconnect, and take the user (who was updated in the logout variable) and find their index number in the names array, and splice them from it
	socket.on('disconnect', function() {
		var index = names.indexOf(logout);
		names.splice(index, 1);
		io.emit('userdown', {usernames: names})
	});
// sends the oldest user's canvas to the users in the room (so that the newest user can have it loaded)

	socket.on('oldcanvas', function(data){
		io.emit('canvasloader', {data: data});
	});





	//////// DRAWING LOGIC BELOW //////////

	socket.on('start', function(start){
		io.emit('begindrawing', start);
	});

	socket.on('sketch', function(data){
		io.emit('draw', data);
	});

	// gets the request from the user that wanted to clear the board and sends a message back to put it to a vote

	socket.on('clearproposal', function(user){
		io.emit('clearproposed', user);
	});


	// figures out if the number of votes in favour of clearing/not clearing the board is the majority of the users in the room and makes a decision based off that

	socket.on('clearanswer', function(answer){
		answers.push(answer);
		var clear;
		var yes = [];
		var no = [];
		for (var i = 0; i < answers.length; i++) {

				if (answers[i] === true) {
					yes.push(1);
				} 
				else {
					no.push(1);
				}
			}
		if (answers.length === names.length){
			if (yes.length === no.length) {
				clear = 'tie';
				io.emit('clear', clear);
				answers = [];
				yes = [];
				no = [];
			}
			else if (yes.length < no.length){
				clear = false;
				io.emit('clear', clear);
				answers = [];
				yes = [];
				no = [];
			}
			else if (yes.length > no.length) {
				clear = true;
				io.emit('clear', clear);
				answers = [];
				yes = [];
				no = [];
			}
		}
		else if (yes.length > names.length / 2) {
			clear = true;
			io.emit('clear', clear);
			answers = [];
			yes = [];
			no = [];
		}
		else if (no.length > names.length / 2) {
			clear = false;
			io.emit('clear', clear);
			answers = [];
			yes = [];
			no = [];
		}
	});

});


// sends user to the drawing board
app.get('/', function(req, res){
	res.render('drawing');
});
