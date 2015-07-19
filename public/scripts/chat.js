$(function(){

	var socket = io();

		// gets the username of the user logged on and changes the username box to the username
	socket.on('username', function(name) {
		$("#user").val(name['username']['name']);
	});

	// send a message to the server from a user when the + button is pressed
	$("#chat-submit").click(function() {
		// $("#message-list").append("<li>" + $("#user").val() + ": " + $("#message").val() + "</li>");
		socket.emit('chat', {message: '<span class="username-chat">' + $("#user").val() + "</span>" + ": " + $("#message").val()});
		socket.emit('command', {command: $("#message").val()});
		$("#message").val("");
	});

	// send a message to the server from a user when enter is pressed
	$("#message").keydown("13", function(event) {
		if ( event.which == 13 ) {
			socket.emit('chat', {message: '<span class="username-chat">' + $("#user").val() + "</span>" + ": " + $("#message").val()});
			socket.emit('command', {command: $("#message").val()});
			$("#message").val("");
		}
	});

	// append a user's message to the message list
	socket.on('message', function(message){
		$("#chat-message-list").append("<li><p>" + message['message'] + "</p></li>");
	});

	// append the date with the user's message to the message list
	socket.on('date', function(date){
		$("#chat-message-list").append("<li>" + "<span class='date-time'>" + date + "</span>" + "</li>");
	});


});