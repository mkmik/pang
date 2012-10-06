'use strict';

$(function() {
    var paused = false;
    var dead = false;

    var stage = new Kinetic.Stage({
        container: "container",
        width: 640,
        height: 468,
        scale: {x:1, y:-1},
        offset: {x: 0, y: 468}
    });

    var layer = new Kinetic.Layer();

    var player = new Kinetic.Rect({
        x: Math.round(stage.getWidth()/2),
        y: 0,
        width: 20,
        height: 30,
        fill: "#00D2FF",
        stroke: "black",
        strokeWidth: 1
    });

    var players = [player];

    var LEFT = 37;
    var RIGHT = 39;
    var SPACE = 32;
    var KEY_P = 80;

    var keyboard = {};
    keyboard[LEFT] = false;
    keyboard[RIGHT] = false;
    keyboard[SPACE] = false;

    $(window).keydown(function(ev) {
        keyboard[ev.keyCode] = true;

        if(ev.keyCode == KEY_P) {
            if(paused)
                resume();
            else
                pause();
        }

        if(!paused) {
            if(ev.keyCode == SPACE)
                fire();
        }
    });
    $(window).keyup(function(ev) {
        keyboard[ev.keyCode] = false;
    });


    // add the shape to the layer
    layer.add(player);

    // add the layer to the stage
    stage.add(layer);

    var animPlayer = new Kinetic.Animation({
        func: function(frame) {
            if(paused)
                return;

            var step = 6;
            var delta = Math.round(frame.timeDiff / step);

            console.log();

            if(keyboard[LEFT])
                player.move(-delta, 0);
            if(keyboard[RIGHT])
                player.move(delta, 0);

            var pos = player.getPosition();
            if(pos.x < 0)
                player.setX(0);

            var usefulWidth = stage.getWidth() - player.getWidth();
            if(pos.x > usefulWidth)
                player.setX(usefulWidth);

        },
        node: layer
    });

    animPlayer.start();

    player.kill = function() {
        animPlayer.stop();
        player.remove();
    }

    var harpoons = [];
    function fire() {
        var limit = 2;
        if(harpoons.length >= limit)
            return;

        var harpoon = new Kinetic.Rect({
            x: player.getPosition().x + Math.round(player.getWidth()/2),
            y: player.getPosition().y,
            width: 4,
            height: 20,
            stroke: "blue",
            strokeWidth: 4
        });

        layer.add(harpoon);
        harpoons.push(harpoon);

        var animHarpoon = new Kinetic.Animation({
            node: layer,
            func: function(frame) {
                var step = 6;
                var delta = Math.round(frame.timeDiff / step);

                harpoon.setHeight(harpoon.getHeight() + delta);
                if(harpoon.getHeight() >= stage.getHeight())
                    harpoon.kill();
            }
        });

        harpoon.kill = function() {
            animHarpoon.stop();
            harpoon.remove();

            var hi = harpoons.indexOf(harpoon);
            harpoons.splice(hi, 1);
        }

        harpoon.pause = function() {
            animHarpoon.stop();
        }

        harpoon.resume = function() {
            animHarpoon.start();
        }

        animHarpoon.start();
    }

    var baloons = [];
    function createBaloon(size, x, y, dir) {
        var baloon = new Kinetic.Circle({
            x: x,
            y: y,
            radius: size,
            fill: "red",
            stroke: "black",
            strokeWidth: size / 8
        });

        baloon.velocity = {x: dir, y: 0};
        baloon.size = size;
        if(size == 32)
            baloon.step = 8;
        else if(size == 16)
            baloon.step = 16;
        else if(size == 8)
            baloon.step = 24;
        baloon.step = 24;


        layer.add(baloon);
        baloons.push(baloon);

        var animBaloon = new Kinetic.Animation({
            node: layer,
            func: function(frame) {
                var gravity = 0.002;

                var deltaX = Math.round(frame.timeDiff / baloon.step);
                var deltaY = Math.round(frame.timeDiff / baloon.step);

                baloon.velocity.y -= frame.timeDiff * gravity;

                var pos = baloon.getPosition();
                if(pos.x <= baloon.getRadius()) {
                    baloon.setX(baloon.getRadius());
                    baloon.velocity.x = -baloon.velocity.x;
                }

                if(pos.y <= baloon.getRadius()) {
                    baloon.setY(baloon.getRadius());
                    baloon.velocity.y = -baloon.velocity.y;
                }

                var usefulWidth = stage.getWidth() - baloon.getRadius();
                if(pos.x >= usefulWidth) {
                    baloon.setX(usefulWidth);
                    baloon.velocity.x = -baloon.velocity.x;
                }

                var usefulHeight = stage.getHeight() - baloon.getRadius();
                if(pos.y >= usefulHeight) {
                    baloon.setY(usefulHeight);
                    baloon.velocity.y = -baloon.velocity.y;
                }

                baloon.move(baloon.velocity.x * deltaX, baloon.velocity.y * deltaY);

                // detect collisions with weapons and players
                var bx = baloon.getX();
                var by = baloon.getY();
                var br = baloon.getRadius();

                for(var i=0; i<harpoons.length; i++ ) {
                    var h = harpoons[i];
                    var ax = h.getX();
                    var ay = h.getHeight();

                    var intersect = false;
                    if (ay >= by && Math.abs(ax - bx) <= br)
                        intersect = true;
                    else if(Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)) <= br)
                        intersect = true;

                    if(intersect) {
                        baloon.kill();
                        h.kill();
                        break;
                    }
                }

                for(var i=0; i<players.length; i++ ) {
                    var p = players[i];
                    var ax = p.getX() + p.getWidth()/2;
                    var ay = p.getHeight();

                    var intersect = false;

                    if (ay >= by && Math.abs(ax - bx) <= br)
                        intersect = true;
                    else if(Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)) <= br)
                        intersect = true;

                    if(intersect) {
                        lostStage(p);
                        break;
                    }
                }
            }
        });

        baloon.kill = function() {
            animBaloon.stop();
            baloon.remove();

            var hi = baloons.indexOf(baloon);
            baloons.splice(hi, 1);

            if(baloon.size > 8) {
                createBaloon(baloon.size / 2, baloon.getX(), baloon.getY(), 1);
                createBaloon(baloon.size / 2, baloon.getX(), baloon.getY(), -1);
            }

            if(baloons.length == 0)
                nextStage();
        }

        baloon.pause = function() {
            animBaloon.stop();
        }

        baloon.resume = function() {
            animBaloon.start();
        }

        animBaloon.start();
    }

    createBaloon(32, 120, 200, 1);
    createBaloon(32, 320, 200, -1);
    createBaloon(16, 20, 80, 1);
    createBaloon(16, 160, 80, -1);
    createBaloon(16, 240, 80, 1);

    function nextStage() {
        console.log("next stage");

        paused = true;

        for(var i=0; i<harpoons.length; i++) {
            harpoons[i].pause();
        }

        player.kill();

        var message = new Kinetic.Text({
            text: "Wow!",
            x: (stage.getWidth()-380) / 2,
            y: (stage.getHeight()+80) / 2,
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

        layer.add(message);
    }


    function lostStage(p) {
        paused = true;

        for(var i=0; i<baloons.length; i++) {
            baloons[i].pause();
        }

        for(var i=0; i<harpoons.length; i++) {
            harpoons[i].pause();
        }


        var message = new Kinetic.Text({
            text: "Buuuuu!",
            x: (stage.getWidth()-380) / 2,
            y: (stage.getHeight()+80) / 2,
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

        layer.add(message);

        dead = true;
    }

    function pause() {
        paused = true;

        for(var i=0; i<baloons.length; i++) {
            baloons[i].pause();
        }

        for(var i=0; i<harpoons.length; i++) {
            harpoons[i].pause();
        }
    }

    function resume() {
        paused = false;
        for(var i=0; i<baloons.length; i++) {
            baloons[i].resume();
        }

        for(var i=0; i<harpoons.length; i++) {
            harpoons[i].resume();
        }
    }

    $(document).on({
        'show.visibility': function() {
            if(!dead) {
                resume();
            }
        },
        'hide.visibility': function() {
            pause();
        }
    });
});
