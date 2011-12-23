(function($) {
    var Point = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
    var PointColor = function(r, g, b) {
        var a = arguments[3] || 100;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    };
    var PointCloud = function() {
        this.format = 'pcd';
        this.points_type = ''; //xyz or xyzrgb
        this.points = [];
        this.has_colored_points = false;
        this.points_color = [];
    };
    PointCloud.prototype.add_point = function(point) {
        var color = arguments[1];
        
        this.points.push(point);
        if (color != undefined) {
            if ((this.points.length > 0) && !this.has_colored_points) {
                throw 'Can\'t add colored points to an uncolored point cloud';
            }
            
            this.points_color.push(color);
        }
    };
    
    var Importer = {
        from_pcd: function(raw_data) {
            var point_cloud = new PointCloud();
            
            var handle_line = function(line) {
                var parts = line.split(' ');
                for (var i=0; i<parts.length; ++i) {
                    parts[i] = parts[i].toLowerCase();
                    parts[i] = parts[i].replace('\n', '');
                }
                
                switch (parts[0]) {
                    case 'fields':
                        var type = '';
                        for (var i=1; i<parts.length; ++i) {
                            type+= parts[i];
                        }
                        
                        point_cloud.points_type = type;
                        break;
                        
                    case 'data':
                        if (parts[1] != 'ascii') {
                            throw 'Only ascii-PCD files can be imported';
                        }
                        break;
                        
                    default:
                        //Check for float, indicates point info
                        if (parts[0].match('^[0-9]+?\.[0-9]+?$')) {
                            if (parts.length == 3) {
                                point_cloud.add_point(
                                    new Point(
                                    parseFloat(parts[0]),
                                    parseFloat(parts[1]),
                                    parseFloat(parts[2]))
                                );
                            } else if (parts.length == 6) {
                                point_cloud.add_point(
                                    new Point(
                                        parseFloat(parts[0]),
                                        parseFloat(parts[1]),
                                        parseFloat(parts[2])
                                    ),
                                    new PointColor(
                                        parseFloat(parts[3]),
                                        parseFloat(parts[4]),
                                        parseFloat(parts[5])
                                    )
                                );
                            } else {
                                throw 'Points have to be in xyz or xyzrgb mode';
                            }
                        }
                }
            };
            
            this._for_each_line(raw_data, handle_line);
            
            return point_cloud;
        },
        
        _for_each_line: function(string, callback) {
            var line = '';
            for (var i=0; i<string.length; ++i) {
                line+= string[i];
                
                if (string[i] == '\n') {
                    callback(line);
                    line = '';
                }
            }
        }
    };
    
    var Viewer = function() {
        this.callbacks = {
            'new_cloud': $.Callbacks()
        };
        
        this.on('new_cloud', this.reset_renderer);
    };
    
    Viewer.prototype.on = function(event, handler) {
        if (this.callbacks[event] == undefined) {
            throw 'Unknown event type "' + event;
        }
        
        this.callbacks[event].add(handler);
    };
    
    Viewer.prototype.set_point_cloud = function(point_cloud) {
        this.point_cloud = point_cloud;
        this.callbacks['new_cloud'].fire(this);
    };
    
    Viewer.prototype.display_point = function(point) {
        var color = arguments[1];
        
        // set up the sphere vars
        var radius = 5, segments = 2, rings = 2;
        // create the sphere's material
        var sphereMaterial = new THREE.MeshLambertMaterial(
        {
            color: 0x444444
        });
        // create a new mesh with sphere geometry -
        // we will cover the sphereMaterial next!
        var sphere = new THREE.Mesh(
           new THREE.SphereGeometry(radius,
           segments,
           rings),
        
           sphereMaterial);
        
        sphere.position.x = point.x;
        sphere.position.y = point.y;
        sphere.position.z = point.z;
        
        // add the sphere to the scene
        this.scene.add(sphere);
    };
    
    Viewer.prototype.reset_renderer = function(this_) {
        // set the scene size
        var WIDTH = $(document).width(),
            HEIGHT = $(document).height();
        
        console.log('width, height', WIDTH, HEIGHT);

        // set some camera attributes
        var VIEW_ANGLE = 45,
            ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1,
            FAR = 10000;

        // get the DOM element to attach to
        // - assume we've got jQuery to hand
        var $container = $('#viewport');

        // create a WebGL renderer, camera
        // and a scene
        var renderer = new THREE.WebGLRenderer();
        var camera = new THREE.PerspectiveCamera(
                           VIEW_ANGLE,
                           ASPECT,
                           NEAR,
                           FAR );
        
        camera.position.y = 200;

        this_.scene = new THREE.Scene();
        
        // create a point light
        var pointLight = new THREE.PointLight( 0xFFFFFF );
        // set its position
        pointLight.position.x = 10;
        pointLight.position.y = 50;
        pointLight.position.z = 130;
        // add to the scene
        this_.scene.add(pointLight);
        this_.scene.add(camera);

        var particles = new THREE.Geometry();
        var particlesMaterial = new THREE.ParticleBasicMaterial({
            color: 0x555555,
            size: 10
        });
        for (var i=0; i<this_.point_cloud.points.length; ++i) {
            if ((i % 50000) == 0) {
                console.log(i, 'points added');
            }
            var point = this_.point_cloud.points[i];
            //this_.display_point(this_.point_cloud.points[i]);
            
            var particle = new THREE.Vertex(
                new THREE.Vector3(point.x, point.y*-1, point.z*-1)
            );
            
            particles.vertices.push(particle);
        }
        
        var particleSystem = new THREE.ParticleSystem(
            particles,
            particlesMaterial
        );
        
        this_.scene.add(particleSystem);
         
        window.camera = camera;
        // the camera starts at 0,0,0 so pull it back
        camera.position.z = 6000;

        // start the renderer
        renderer.setSize(WIDTH, HEIGHT);

        // attach the render-supplied DOM element
        $container.append(renderer.domElement);
        
            // shim layer with setTimeout fallback
        window.requestAnimFrame = (function(){
          return window.requestAnimationFrame       || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame    || 
                  window.oRequestAnimationFrame      || 
                  window.msRequestAnimationFrame     || 
                  function(/* function */ callback, /* DOMElement */ element){
                      window.setTimeout(callback, 1000 / 60);
                  };
        })();
        
        var leftPressed = false;
        var rightPressed = false;
        var oldPosition = null;
        $(document).bind('contextmenu', function(event) {
            event.preventDefault();
        });
        $(document).mousedown(function(event) {
            event.preventDefault();
            
            if (event.which === 1) {
                leftPressed = true;
            }
            if (event.which === 3) {
                rightPressed = true;
            }
        });
        $(document).mouseup(function(event) {
            event.preventDefault();
            
            if (event.which === 1) {
                leftPressed = false;
            }
            if (event.which === 3) {
                rightPressed = false;
            }
        });
        $(document).mousemove(function(event) {
            if (leftPressed && (oldPosition !== null)) {
                deltaX = event.clientX - oldPosition.x;
                deltaY = event.clientY - oldPosition.y;
                
                camera.position.x+= (deltaX * 10);
                camera.position.y+= (deltaY * 10);
            }
            if (rightPressed && (oldPosition !== null)) {
                deltaX = event.clientX - oldPosition.x;
                deltaY = event.clientY - oldPosition.y;
                
                camera.rotation.x+= (deltaY / 100);
                camera.rotation.y+= (deltaX / 100);
            }
            
            oldPosition = {
                x: event.clientX,
                y: event.clientY
            };
        });
        $(document).mousewheel(function(event, delta) {
            if (delta < 0) {
                camera.position.z+= 100;
            } else {
                camera.position.z-= 100;
            }
        });
        
        
        (function animloop() {
            requestAnimFrame(animloop, $container);
            renderer.render(this_.scene, camera);
        })();
    };
    
    window.PCDImporter = function(raw_data) {
        window.Viewer.set_point_cloud(Importer.from_pcd(raw_data));
    };
    window.Viewer = new Viewer();
})(jQuery);