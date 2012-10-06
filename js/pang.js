'use strict';

$(function() {
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

    var LEFT = 37;
    var RIGHT = 39;
    var SPACE = 32;

    var keyboard = {};
    keyboard[LEFT] = false;
    keyboard[RIGHT] = false;
    keyboard[SPACE] = false;
    
    $(window).keydown(function(ev) {
        keyboard[ev.keyCode] = true;

        if(ev.keyCode == SPACE)
            fire();
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

    var harpoons = [];
    function fire() {
        console.log("fire");
        var harpoon = new Kinetic.Rect({
            x: player.getPosition().x + Math.round(player.getWidth()/2),
            y: player.getPosition().y,
            width: 4,
            height: 20,
            stroke: "blue",
            strokeWidth: 4
        });

        layer.add(harpoon);

        console.log(harpoon);
        var animHarpoon = new Kinetic.Animation({
            node: layer,
            func: function(frame) {
                var step = 6;
                var delta = Math.round(frame.timeDiff / step);

                harpoon.setHeight(harpoon.getHeight() + delta);
                if(harpoon.getHeight() >= stage.getHeight()) {
                    animHarpoon.stop();
                    harpoon.remove();
                }
            }
        });

        animHarpoon.start();
        
    }
})
