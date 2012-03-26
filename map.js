var App = Em.Application.create({
    ready: function() {
        console.log("Er að keyra constructorinn!");
        this.setupMap();
        $(window).resize(this.reflow);
        this.reflow();
        this._super();
    },
    reflow: function() {
        var winHeight = $(window).height();
        var winWidth = $(window).width();

        $("#map_canvas").css({
            position: "absolute",
            top: 0,
            left: 0,
            width: winWidth,
            height: winHeight - 250
        });

        $("#polygon_list_container").css({
            position: "absolute",
            top: winHeight - 250,
            left: 0,
            width: winWidth,
            height: 250
        })
    },
    setupMap: function() {
        var polygons = [];
        var colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#FF8000'];
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
            var poly = App.Polygon.create({
                polyRef: polygon,
                name: 'Svæði ' + currentColor,
                color: colors[currentColor]
            });
            
            currentColor = (currentColor+1) % colors.length;

            drawingManager.setOptions({
                polygonOptions: { fillColor: colors[currentColor] }
            });
            
            App.PolygonController.addPolygon(poly);
        });
    }
});

App.Polygon = Em.Object.extend({
    color: '#ffffff',
    name: '',
    polyRef: null,
    colorStyleString: function() {
        return 'background: ' + this.get('color') + ';';
    }.property('color')
});

App.PolygonController = Em.ArrayController.create({
    content: [],
    
    addPolygon: function(poly) {
        this.pushObject(poly);
    }
});

App.PolygonListView = Em.View.extend({
   nameBinding: 'this.content.name',
   colorBinding: 'this.content.color',
   
   colorPick: function(context, ev, something) {
       var element = $(ev.srcElement);
   } 
});