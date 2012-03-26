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
    }.property('color'),
    
    colorChanged: function() {
        var newColor = this.get('color');
        var polyRef = this.get('polyRef');
        
        polyRef.setOptions({ fillColor: newColor });
    }.observes('color')
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
   colorStyleStringBinding: 'this.content.colorStyleString',
   
   colorPick: function(context, ev, something) {
       var el = $(ev.srcElement);
       var content = this.get('content');
       var offset = el.offset();
       var currentColor = content.get('color');
       offset.top += el.outerHeight();
       
       App.colorpickerController.target(offset, currentColor, function(color) {
           content.set('color', color);
       })
   }
});



App.overlayController = Em.Object.create({
    active: false,
    
    activeChanged: function() {
        if (!this.active) {
            App.colorpickerController.disable();
        }
    }.observes('active')
});

App.OverlayView = Em.View.extend({
    activeBinding: 'App.overlayController.active',
    
    overlayMode: function() {
        return (App.overlayController.get('active')) ? 'overlay-active' : 'overlay-inactive';
    }.property('active'),
    
    click: function(e) {
        App.overlayController.set('active', false);
    }
});



App.colorpickerController = Em.Object.create({
    init: function() {
        this.colorpicker = $.farbtastic('#colorpicker');
        this.colorpickerContainer = $('#colorpicker-container');
        this._super();
    },
    
    target: function(offset, initialColor, colorChangeCallback) {
        // Can't call this after setting offset, because jQuery doesn't like positioning hidden
        // elements.
        this.colorpickerContainer.show(300);
        this.colorpickerContainer.offset(offset);
        this.colorpicker.setColor(initialColor);
        this.colorpicker.linkTo(function(color) {
            if (color != '#NaNNaNNaN') {
                colorChangeCallback(color);
            }
        });
        App.overlayController.set('active', true);
    },
    disable: function() {
        // So that the colorpicker.setColor() call next time the colorpicker is activated doesn't
        // change the color of the last object linked to it.
        this.colorpicker.linkTo(function() {});
        this.colorpickerContainer.hide(300);
    }
});