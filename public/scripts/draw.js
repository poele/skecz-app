$(function(){

var socket = io();


////// DRAWING LOGIC BELOW


	var canvas = document.getElementById("main-canvas");
	var range = document.getElementById("ranger");
	var sampling; 
	var thickness = 1;
	var colour = 'black';
	var blendMode = 'normal';
	var ctx = canvas.getContext("2d");


	var box = document.querySelector(".main-drawing-box");
	var boxStyle = getComputedStyle(box);
	canvas.width = parseInt(boxStyle.getPropertyValue('width'));
	canvas.height = parseInt(boxStyle.getPropertyValue('height'));

	// sets the canvas background to white

	ctx.fillStyle = "#FFF"
	ctx.fillRect(0,0, canvas.width, canvas.height)


	// emits a clear proposal to the server and the name of the user who sent the proposal 

	$("#clearer").click(function(){
		var user = $("#user").val();
		socket.emit('clearproposal', user);
	});

	// allows the user to download the picture to the desktop

	$("#downloader").on('click', function(){
		var dLink = canvas.toDataURL('image/jpeg');
    this.href = dLink;
	});



	// changes the thickness of the line and updates the number above the range to reflect that as the mouse is dragged

	var changingThickness;

	$(range).on('mousedown', function(){
		changingThickness = true;
	});

	$(range).on('mousemove', function(e){
		if (changingThickness === true){
			$("#tool-width").text(e.currentTarget.value);
		}
	});

	$(range).on('mouseup', function(e){
		changingThickness = false;
		$("#tool-width").text(e.currentTarget.value);
		thickness = e.currentTarget.value;
	});

	// bootstrap logic for the select box

	$('.selectpicker').selectpicker({
      style: 'btn-inverse',
      size: 'auto'
  });

  // changes the blend mode on the brush

  $("#modes").on('change', function(){
  	blendMode = $("#modes").val();
  });



// this will set the colour and store it in the variable colour with our colour picker, and also allow us to set it by just mousing out of the clicker
	$("#custom").spectrum({
		clickoutFiresChange: true,
		showAlpha: true,
		preferredFormat: "rgb",
		showButtons: false,
		replacerClassName: 'replacer-box',
		containerClassName: 'container-box',
		showPalette: true,
    palette: [ ],
    showSelectionPalette: true,

		change: function(color) {
    	colour = color.toRgbString();
// changes the username colour at the top to the currently selected colour on the canvas
    	$("#user").css('color', colour);
		}
	});

// switches on the colour sampler

$("#sampler").on('click', function(){
	sampling = true;
});



	var rgb;
	var isDrawing = false;

// gets coordinates to draw with and emits a socket signal
// also gets the colour at the current coordinates if var sampling is true

		$(canvas).mousemove(function(e){
				var x = e.pageX - this.offsetLeft;
				var y = e.pageY - this.offsetTop;
			if (isDrawing === true) {
				var data = {
					x: x,
					y: y,
					thickness: thickness,
					blend: blendMode,
					colour: colour
				};

				socket.emit('sketch', data);
			}
			else if (sampling === true) {
			
				var c = this.getContext('2d');
		    var p = c.getImageData(x, y, 1, 1).data; 
		    rgb = 'rgb(' + p[0] + ', ' +  p[1] + ', ' + p[2] + ')';
		  	$("#sampler").css('color', rgb);

			}

		});

	$(canvas).mousedown(function(e){


		var x = e.pageX - this.offsetLeft;
		var y = e.pageY - this.offsetTop;
		var start = {
			x: x,
			y: y
		};
		isDrawing = true;
		socket.emit('start', start);

	});


		// this will set isDrawing to false and stop the drawing 

	$(canvas).mouseup(function(){

		isDrawing = false;
		if (sampling === true) {
			colour = rgb;
			$("#sampler").css('color', rgb);
		}
		sampling = false;
	});

	$(canvas).mouseout(function(){
		isDrawing = false;
	});

	// takes a cue from the mousedown function and begins drawing

	socket.on('begindrawing', function(start){
			ctx.moveTo(start.x, start.y);
			ctx.beginPath();
	});

	// renders each line that is drawn while mousedown is still true/isDrawing is still true

	socket.on('draw', function(data){
			ctx.globalAlpha = 0.2;
			ctx.globalCompositeOperation = data.blend;
			ctx.lineWidth = data.thickness;
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';
			ctx.strokeStyle = data.colour;
			ctx.lineTo(data.x, data.y);
			ctx.stroke();
	});

	// polls the current users on if they wish to clear the board after receiving a clear board proposal

	socket.on('clearproposed', function(user) {

		var answer = window.confirm(user + " wants to clear the board. Continue?");
		socket.emit('clearanswer', answer);

	});

	socket.on('clear', function(clear){
		if (clear === 'tie') {
			window.alert("Looks like it was a tie. Perhaps another vote is in order?");
		}
		else if (clear === true){
			ctx.fillStyle = "#FFF";
			ctx.fillRect(0,0, canvas.width, canvas.height);
		} 
		else {
			window.alert("Sorry, most people don't want to clear the board yet.");
		}
	});

});