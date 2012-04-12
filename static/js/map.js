var App = Em.Application.create({
    ready: function() {
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
            height: winHeight - 150
        });
        
        $("#operations_list").css({
            position: "absolute",
            top: winHeight - 150,
            left: 0,
            width: winWidth,
            height: 25,
        });
        
        $("#polygon_list_container").css({
            position: "absolute",
            top: winHeight - 125,
            left: 0,
            width: winWidth - 500,
            height: 125
        })
        
        $("#district_association_list_container").css({
            position: "absolute",
            top: winHeight - 125,
            left: winWidth - 500,
            width: 500,
            height: 125
        });
    },
    setupMap: function() {
        var polygons = [];
        var colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#FF8000'];
        var currentColor = 0;

        this.mapOptions = {
            center: new google.maps.LatLng(64.124690, -21.875839),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        
        this.polygonOptions = {
            strokeWeight: 1,
            editable: true
        };
        
        
        this.map = new google.maps.Map(document.getElementById("map_canvas"), this.mapOptions);
        
        this.drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: null, // We don't want to begin in a drawing mode.
            drawingControl: true,
            polygonOptions: $.extend({fillColor: colors[currentColor]}, this.polygonOptions),
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [ google.maps.drawing.OverlayType.POLYGON ]
            }
        });
        this.drawingManager.setMap(App.map);
        var that = this;

        google.maps.event.addListener(this.drawingManager, 'polygoncomplete', function(polygon) {
            var poly = App.Polygon.create({
                polyRef: polygon,
                name: 'Svæði ' + currentColor,
                color: colors[currentColor]
            });
            
            currentColor = (currentColor+1) % colors.length;
            
            that.drawingManager.setOptions({
                polygonOptions: $.extend({fillColor: colors[currentColor]}, that.polygonOptions)
            });
            
            App.PolygonController.addPolygon(poly);
        });
    }
});

//------------------------------------------------------------------------------------------------//
// View template for editable text fields. Stolen from the contacts example from the ember website.
Em.Handlebars.registerHelper('editable', function(path, options) {
    options.hash.valueBinding = path;
    return Em.Handlebars.helpers.view.call(this, App.EditField, options);
})

App.EditField = Em.View.extend({
    tagName: 'span',
    templateName: 'edit-field',
    
    click: function() {
        //alert('event!');
        var touchTime = new Date();
        if (this._lastTouchTime && touchTime - this._lastTouchTime < 150) {
            this.doubleClick();
        }
        else {
            this._lastTouchTime = touchTime;
        }
        return false;
    },
    doubleClick: function() {
        this.set('isEditing', true);
        return false;
    },
    focusOut: function() {
        this.set('isEditing', false);
    },
    keyUp: function(evt) {
        if (evt.keyCode === 13) {
            this.set('isEditing', false);
        }
    }
});

App.TextField = Em.TextField.extend({
  didInsertElement: function() {
    this.$().focus();
  }
});
//------------------------------------------------------------------------------------------------//



App.Marker = Em.Object.extend({
    markerRef: null,
    title: '',
    polygonModelRef: null,
    lat: NaN,
    lng: NaN
});

App.markerController = Em.ArrayController.create({
    content: [],
    init: function() {
        var that = this;
        $.getJSON('/locations', function(data) {
            var markers = [];
            for (key in data) {
                var marker = new App.Marker();
                marker.lat = data[key].lat;
                marker.lng = data[key].lng;
                marker.title = data[key].name;
                markers.push(marker);
            }
            that.set('content', markers);
            
        });
    },
    contentChanged: function() {
        $.each(this.content, function(i, item) {
            var marker = new google.maps.Marker({
                map: App.map,
                position: new google.maps.LatLng(item.lat, item.lng),
                title: item.name
            });
            item.markerRef = marker;
        });
    }.observes('content')
});



App.Polygon = Em.Object.extend({
    color: '#ffffff',
    name: '',
    polyRef: null,
    coordinates: [],
    markerModelRefs: [],
    
    colorStyleString: function() {
        return 'background: ' + this.get('color') + ';';
    }.property('color'),
    
    colorChanged: function() {
        var newColor = this.get('color');
        var polyRef = this.get('polyRef');
        
        polyRef.setOptions({ fillColor: newColor });
    }.observes('color'),
    
    export: function() {
        var exported = {
            color: this.color,
            name: this.name,
            coordinates: []
        };
        var path = this.polyRef.getPath();
        for (var i = 0; i < path.length; i++) {
            exported.coordinates.push({
                lat: path.getAt(i).lat(),
                lng: path.getAt(i).lng()
            })
        }
        
        return exported;
    }
});

App.PolygonController = Em.ArrayController.create({
    content: [],
    
    addPolygon: function(poly) {
        var path = poly.polyRef.getPath();
        for (var i = 0; i < path.length; i++) {
            poly.coordinates.push({
                lat: path.getAt(i).lat(),
                lng: path.getAt(i).lng()
            });
        }
        
        this.pushObject(poly);
    },
    
    upload: function() {
        var polygons = {};
        for (var i = 0; i < this.content.length; i++) {
            polygons[(i+1).toString()] = this.content[i].export();
        }
        
        
        $.ajax({
            url: '/polygons',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(polygons),
            dataType: 'json'
        })
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
        this.containerHeight = this.colorpickerContainer.outerHeight();
        this.colorpickerContainer.hide();
        this._super();
    },
    
    target: function(offset, initialColor, colorChangeCallback) {
        // Can't call this after setting offset, because jQuery doesn't like positioning hidden
        // elements.
        this.colorpickerContainer.fadeIn(150);
        offset.top -= this.containerHeight;
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
        this.colorpickerContainer.fadeOut(150);
    }
});


function districtize() {
    // Prepare the districts:
    var polygons = [];
    for (var i = 0; i < App.PolygonController.content.length; i++) {
        var path = App.PolygonController.content[i].polyRef.getPath();
        
        var poly = {
            coordinates: []
        }
        
        for (var j = 0; j < path.length; j++) {
            poly.coordinates.push({
                lat: path.getAt(j).lat(),
                lng: path.getAt(j).lng()
            })
        }
        polygon.boundingBox = boundingBox(polygon.coordinates);
        
        polygons.push(poly);
    }
}

function boundingBox(coordinates) {
    var bounds = {
        max: {lat: Number.POSITIVE_INFINITY, lng: Number.POSITIVE_INFINITY},
        min: {lat: Number.NEGATIVE_INFINITY, lng: Number.NEGATIVE_INFINITY}
    };
    
    for (var i = 0; i < coordinates.length; i++) {
        bounds.min.lat = Math.min(coordinates[i].lat, bounds.min.lat);
        bounds.min.lng = Math.min(coordinates[i].lng, bounds.min.lng);
        bounds.max.lat = Math.min(coordinates[i].lat, bounds.max.lat);
        bounds.max.lng = Math.min(coordinates[i].lng, bounds.max.lng);
    }
    
    return bounds;
}

function intersection(line1, line2) {
    // Algorithm pilfered from http://paulbourke.net/geometry/lineline2d/
    var x1 = line1.x1;
    var y1 = line1.y1;
    var x2 = line1.x2;
    var y2 = line1.y2;
    var x3 = line2.x1;
    var y3 = line2.y1;
    var x4 = line2.x2;
    var y4 = line2.y2;
    var denom  = (y4-y3) * (x2-x1) - (x4-x3) * (y2-y1);
    var numera = (x4-x3) * (y1-y3) - (y4-y3) * (x1-x3);
    var numerb = (x2-x1) * (y1-y3) - (y2-y1) * (x1-x3);
    
    // Are the lines coincident?
    if (denom == numera == numerb == 0.0) { return true; }
    
    // Are the lines parallel?
    if (denom == 0.0) { return false; }
    
    var mua = numera / denom;
    var mub = numerb / denom;
    
    // Is the intersection within the bounds of both lines?
    if (mua > 0.0 && mua < 1.0 && mub > 0.0 && mub < 1.0) { return true; }
    
    // We have exhausted other possibilities. The lines do not intersect.
    return false;
}

function point_in_boundingBox(point, boundingBox) {
    if (point.x < boundingBox.min.x || point.x > boundingBox.max.x) {
        return false;
    }
    if (point.y < boundingBox.min.y || point.y > boundingBox.max.y) {
        return false;
    }
    return true;
}

function point_in_polygon(point, polygon) {
    var eps = 0.1;
    var line = {x0: polygon.boundingBox.min.x - eps, y0: point.y, x1: point.x, y1: point.y};
    
    if (!point_in_boundingBox(point, polygon.boundingBox)) { return false; }
    
    var intersections = 0;
    
}

/*def segments(iterable):
    it = iterable.__iter__()
    first = p2 = it.next()
    for el in it:
        p1, p2 = p2, el
        yield p1, p2
    yield p2, first*/