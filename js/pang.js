'use strict';

var LEFT = 37;
var RIGHT = 39;
var SPACE = 32;
var KEY_P = 80;

function Scene() {
    this.demo = false;
//    this.demo = true;

    var hh = 200;
    this.stage = new Kinetic.Stage({
	container: "container",
	width: 400,
	height: hh,
	scale: {x:1, y:-1},
	offset: {x: 0, y: hh}
    });

    this.layer = new Kinetic.Layer();
    this.stage.add(this.layer);

    this.objects = {baloons: [], harpoons: [], players: []};
    this.paused = false;
    this.dead = false;

    this.keyboard = {};
    this.keyboard[LEFT] = false;
    this.keyboard[RIGHT] = false;

    $(window).keydown(this.keydown.bind(this));
    $(window).keyup(this.keyup.bind(this));

    $(document).on({
	'show.visibility': function() {
	    if(!this.dead) {
		this.resume();
	    }
	}.bind(this),
	'hide.visibility': function() {
	    this.pause();
	}.bind(this)
    });

}

Scene.prototype.keydown = function(ev) {
    this.keyboard[ev.keyCode] = true;

    if(ev.keyCode == KEY_P) {
	if(this.paused)
	    this.resume();
	else
	    this.pause();
    }

    if(!this.paused) {
	if(ev.keyCode == SPACE)
	    this.objects.players[0].fire();
    }
}

Scene.prototype.keyup = function(ev) {
    this.keyboard[ev.keyCode] = false;
}

Scene.prototype.pause = function() {
    this.paused = true;
    for (var kind in this.objects)
	for(var i = 0; i < this.objects[kind].length; i++)
	    this.objects[kind][i].anim.stop();
}

Scene.prototype.resume = function() {
    this.paused = false;
    for (var kind in this.objects)
	for(var i = 0; i < this.objects[kind].length; i++)
	    this.objects[kind][i].anim.start();
}

Scene.prototype.message = function(msg) {
    var message = new Kinetic.Text({
	text: msg,
	x: (this.stage.getWidth()-380) / 2,
	y: (this.stage.getHeight()+80) / 2,
	strokeWidth: 5,
	fill: '#ddd',
	fontSize: 14,
	fontFamily: 'Calibri',
	textFill: '#555',
	width: 380,
	padding: 20,
	align: 'center',
	scale: {x: 1, y: -1}
    });

    this.layer.add(message);
}

Scene.prototype.lost = function() {
    this.pause();
    this.message("Buuuu!");
    this.dead = true;
}

Scene.prototype.nextStage = function() {
    this.pause();
    this.message("Wow!");
}

function SceneObject(scene, object ,kind) {
    this.scene = scene;

    scene.objects[kind].push(this);
    scene.layer.add(this.object);

    this.anim = new Kinetic.Animation({
	node: scene.layer,
	func: function(frame) {
	    if(!this.scene.paused) {
		this.render(frame);
		this.collisions();
	    }
	}.bind(this)
    });

    this.anim.start();
}

function Baloon(scene, type, x, y, dir, yvel) {
    this.type = type;

    var size;
    if(type == 1)
	size = 42;
    else if(type == 2)
	size = 32;
    else if(type == 3)
	size = 16;
    else if(type == 4)
	size = 8;

    size = size / 2; // size is radius

    if(yvel === undefined)
	yvel = 0;

    this.object = new Kinetic.Circle({
	x: x,
	y: y,
	radius: size,
//	fill: "red",
//	stroke: "black",
//	strokeWidth: size / 8
	strokeWidth: 0
    });

    this.maxVelocity = Math.sqrt(16 * size/32);
    this.velocity = {x: dir * this.maxVelocity / 4, y: yvel};
    this.size = size;
    this.step = 24;

    SceneObject.apply(this, [scene, this.object, 'baloons']);

    ///

    var imageObj = new Image();
    imageObj.onload = function() {
	var blob = new Kinetic.Image({
	    x: x - imageObj.width / 2,
	    y: y + imageObj.height / 2,
	    image: imageObj,
	});
	blob.setScale(1, -1);

	scene.layer.add(blob);
	this.blob = blob;

    }.bind(this);

    imageObj.src = "img/sprites/baloon"+type+".png";

}

Baloon.prototype.render = function(frame) {
    var gravity = 0.002;

    var deltaX = Math.round(frame.timeDiff / this.step);
    var deltaY = Math.round(frame.timeDiff / this.step);

    this.velocity.y -= frame.timeDiff * gravity;

    var pos = this.object.getPosition();
    if(pos.x <= this.object.getRadius()) {
	this.object.setX(this.object.getRadius());
	this.blob.setX(0);
	this.velocity.x = -this.velocity.x;
    }

    if(pos.y <= this.object.getRadius()) {
	this.object.setY(this.object.getRadius());
	this.blob.setY(this.blob.getHeight());
	this.velocity.y = this.maxVelocity;
    }

    var usefulWidth = this.scene.stage.getWidth() - this.object.getRadius();
    if(pos.x >= usefulWidth) {
	this.object.setX(usefulWidth);
	if(this.blob)
	    this.blob.setX(this.scene.stage.getWidth() - this.blob.getWidth());
	this.velocity.x = -this.velocity.x;
    }

    var usefulHeight = this.scene.stage.getHeight() - this.object.getRadius();
    if(pos.y >= usefulHeight) {
	this.object.setY(usefulHeight);
	if(this.blob)
	    this.blob.setY(this.scene.stage.getHeight());
	this.velocity.y = -this.velocity.y;
    }

    this.object.move(this.velocity.x * deltaX, this.velocity.y * deltaY);
    if(this.blob !== undefined)
	this.blob.move(this.velocity.x * deltaX, this.velocity.y * deltaY);
}

Baloon.prototype.collisions = function() {
    // detect collisions with weapons and players
    var bx = this.object.getX();
    var by = this.object.getY();
    var br = this.object.getRadius();

    var harpoons = this.scene.objects.harpoons;
    for(var i=0; i < harpoons.length; i++) {
	var h = harpoons[i];
	var ax = h.object.getX();
	var ay = h.object.getHeight();

	var intersect = false;
	if (ay >= by && Math.abs(ax - bx) <= br)
	    intersect = true;
	else if(Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)) <= br)
	    intersect = true;

	if(intersect) {
	    this.kill();
	    h.kill();
	    break;
	}
    }

    var players = this.scene.objects.players;
    for(var i=0; i<players.length; i++ ) {
	var p = players[i];
	var ax = p.object.getX() + p.object.getWidth()/2;
	var ay = p.object.getHeight();

	var intersect = false;

	if (ay >= by && Math.abs(ax - bx) <= br)
	    intersect = true;
	else if(Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)) <= br)
	    intersect = true;

	if(intersect) {
	    if(!this.scene.demo)
		this.scene.lost(p);
	    break;
	}
    }
}

Baloon.prototype.kill = function() {
    this.anim.stop();
    this.object.remove();
    this.blob.remove();

    var hi = this.scene.objects.baloons.indexOf(this);
    this.scene.objects.baloons.splice(hi, 1);

    if(this.type < 4) {
	new Baloon(this.scene, this.type + 1, this.object.getX(), this.object.getY(),  1, 1);
	new Baloon(this.scene, this.type + 1, this.object.getX(), this.object.getY(), -1, 1);
    }

    if(this.scene.objects.baloons.length == 0) {
	this.scene.nextStage();
    }
}

function Player(scene, x, y) {
    this.scene = scene;
    this.object = new Kinetic.Rect({
	x: Math.round(scene.stage.getWidth()/2),
	y: 0,
	width: 26,
	height: 30,
//        fill: "#00D2FF",
//        stroke: "black",
//        strokeWidth: 1
	strokeWidth: 0
    });

    this.keyboard = {};
    $(window).keydown(function(ev) {
	if(!this.keyboard[ev.keyCode])
	    this.keydown(ev);
	this.keyboard[ev.keyCode] = true;
    }.bind(this));
    $(window).keyup(function(ev) {
	this.keyup(ev);
	this.keyboard[ev.keyCode] = false;
    }.bind(this));

    var imageObj = new Image();
    var ww = 34;
    var animations = {};

    function genFrame(i) {
	return {
		x: ww*i,
		y: 1,
		width: 32,
		height: 32
	};
    }

    function genFrameRange(from, len) {
	var res = [];
	for(var i=from; i<(from+len); i++)
	    res.push(genFrame(i));
	return res;
    }

    function genFrames() {
	var res = [];
	for(var i=0; i<arguments.length; i++)
	    res.push(genFrame(arguments[i]));
	return res;
    }

    animations.leftIdle = genFrameRange(16, 1);
    animations.rightIdle = genFrameRange(5, 1);

    animations.right = genFrameRange(0, 4);
    animations.left = genFrameRange(11, 4);

    animations.leftFire = genFrames(21, 16);
    animations.rightFire = genFrames(20, 5);

    imageObj.onload = function() {
	console.log("loaded");
	var blob = new Kinetic.Sprite({
	    x: x,
	    y: y + 32,
	    image: imageObj,
	    animation: 'rightIdle',
	    animations: animations,
	    frameRate: 10
	});
	blob.setScale(1, -1);
	console.log(blob);

	scene.layer.add(blob);
	blob.start();
	this.blob = blob;

    }.bind(this);

    imageObj.src = "img/sprites/pang.png";

    SceneObject.apply(this, [scene, this.object, 'players'])
}

Player.prototype.keydown = function(ev) {
    if(ev.keyCode == LEFT) {
	this.direction = LEFT;
	this.blob.setAnimation('left');
    } else if(ev.keyCode == RIGHT) {
	this.direction = RIGHT;
	this.blob.setAnimation('right');
    }
}

Player.prototype.keyup = function(ev) {
    if(ev.keyCode == LEFT && this.direction == LEFT) {
	this.blob.setAnimation('leftIdle');
	this.direction = undefined;
    } else if(ev.keyCode == RIGHT && this.direction == RIGHT) {
	this.blob.setAnimation('rightIdle');
	this.direction = undefined;
    }
}

Player.prototype.render = function(frame) {
    var step = 6;
    var delta = Math.round(frame.timeDiff / step);

    if(this.direction == LEFT) {
	this.object.move(-delta, 0);
	this.blob.move(-delta, 0);
    } else if(this.direction == RIGHT) {
	this.object.move(delta, 0);
	this.blob.move(delta, 0);
    }

    var pos = this.object.getPosition();
    if(pos.x < 0) {
	this.object.setX(0);
	this.blob.setX(0);
    }

    var usefulWidth = this.scene.stage.getWidth() - this.object.getWidth();
    if(pos.x > usefulWidth) {
	this.object.setX(usefulWidth);
	this.blob.setX(usefulWidth);
    }
}

Player.prototype.collisions = function() {
}

Player.prototype.fire = function() {
    var prev = this.blob.getAnimation();
    if(prev != 'leftFire' && prev != 'nextFire') {
	var anim = 'leftFire';
	if(this.direction == RIGHT || prev == 'rightIdle')
	    anim = 'rightFire';

	this.blob.setAnimation(anim);
	this.blob.afterFrame(1, function() {
	    this.blob.setAnimation(prev);
	}.bind(this));
    }

    new Harpoon(this.scene, this);
}

function Harpoon(scene, player) {
    this.scene = scene;

    var x = player.object.getPosition().x + Math.round(player.object.getWidth()/2);
    var y = player.object.getPosition().y;

    this.object = new Kinetic.Rect({
	x: x,
	y: y,
	width: 4,
	height: 20,
//	stroke: "blue",
	strokeWidth: 0
    });

    SceneObject.apply(this, [scene, this.object, 'harpoons']);
    this.object.setZIndex(0);

    ///

    var imageObj = new Image();
    imageObj.onload = function() {
	console.log("loaded");
	var blob = new Kinetic.Image({
	    x: x - 6,
	    y: y + 22,
	    width: 12,
	    height: 203,
	    image: imageObj,
	    crop: {x: 18, y: 0, width: 12, height: 203}
	});
	blob.setScale(1, -1);

	scene.layer.add(blob);
	this.blob = blob;

    }.bind(this);

    imageObj.src = "img/sprites/pang2.png";

}

Harpoon.prototype.render = function(frame) {
    var step = 6;
    var delta = Math.round(frame.timeDiff / step);

    this.object.setHeight(this.object.getHeight() + delta);
    if(this.blob !== undefined)
	this.blob.move(0, delta);
    if(this.object.getHeight() >= this.scene.stage.getHeight())
	this.kill();
}

Harpoon.prototype.collisions = function(frame) {
}

Harpoon.prototype.kill = function() {
    this.anim.stop();
    this.object.remove();
    this.blob.remove();

    var hi = this.scene.objects.harpoons.indexOf(this);
    this.scene.objects.harpoons.splice(hi, 1);
}

$(function() {
    var scene = new Scene();
    new Player(scene, scene.stage.getWidth()/2, 0);

    new Baloon(scene, 1, 120, 200, 1);
    new Baloon(scene, 1, 320, 200, -1);
    new Baloon(scene, 2, 20,  80, 1);
    new Baloon(scene, 2, 160, 80, 1);
    new Baloon(scene, 2, 240, 80, 1);
})
