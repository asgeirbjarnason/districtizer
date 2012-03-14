function initialize() {
    var polygons = [];
    var colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    var currentColor = 0;

    var myOptions = {
        center: new google.maps.LatLng(64.124690, -21.875839),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"),
    myOptions);

    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null, // We don't want to begin in a drawing mode.
        drawingControl: true,
        polygonOptions: {
            editable: true,
            fillColor: colors[currentColor]
        },
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
            google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });
    drawingManager.setMap(map);

    google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
        currentColor = (currentColor+1) % colors.length;

        drawingManager.setOptions({
            polygonOptions: {
                fillColor: colors[currentColor]
            }
        });
        polygons.push(polygon);
        path = polygon.getPath();

        var coords = 'Coordinates:\n';
        for (var i = 0; i < path.length; i++) {
            coords += '\t' + path.getAt(i).lat() + ', ' + path.getAt(i).lng() + '\n';
        }
        console.log(coords);
    });
    
    jQuery(window).resize(reflow);
    reflow();
}

function reflow() {
    var winHeight = $(window).height();
    var winWidth = $(window).width();
    
    // topmost_container
    //    map_canvas
    //    polygon_list
    $("#map_canvas").css({
        position: "absolute",
        top: 0,
        left: 0,
        width: winWidth,
        height: winHeight - 150
    });
    
    $("#polygon_list").css({
        position: "absolute",
        top: winHeight - 150,
        left: 0,
        width: winWidth,
        height: 150
    })
}