var data;
var paper;
var graph;

function drawAtom(from, atom) {
    var b;

    var node = graph.newNode({ label: atom.element });

    for (b = 0; b < atom.bonds.length; b++) {
        var bond = atom.bonds[b];
        var otherAtom = atom.bonds[b].getOtherAtom(atom);
        if (otherAtom != from) {
            var n = drawAtom(atom, otherAtom);
            graph.newEdge(node, n, { directional: false });
        }
    }

    return node;
}

var gworld;
var grenderer;
var verletConstraints;
var allBodies = [];
var constraints = [];

function clearAll() {
    var i;
    for (i = 0; i < allBodies.length; i++) {
        var body = allBodies[i];
        if (body.view) {
            grenderer.scene.remove(body.view);
        }
        gworld.removeBody(body);
    }
    allBodies = [];
    for (i = 0; i < constraints.length; i++) {
        var cons = constraints[i];
        if (cons.mesh) {
            grenderer.scene.remove(cons.mesh);
        }
        verletConstraints.remove(cons);
    }
    constraints = [];
}

function drawAtomPhysicsJs(from, atom) {
    var b;

//    var node = graph.newNode({ label: atom.element });

    var radius = atom.element == 'H' ? 4 : 8;
    var mass = atom.element == 'H' ? 3 : 1;
    var color = atom.element == 'H' ? 0x888888 : 0x5555FF;

    var node = Physics.body('circle', {
        x: Math.random() - 0.5,
        y: Math.random() - 0.5,
//        x: (Math.random()-0.5)* 200 + 1024/2, // x-coordinate
//        y: (Math.random()-0.5)* 200 + 768/2, // y-coordinate
        vx: 0, // velocity in x-direction
        vy: 0, // velocity in y-direction
        radius: radius,
        mass: mass,
        color: color
    });
    gworld.add(node);
    allBodies.push(node);

    for (b = 0; b < atom.bonds.length; b++) {
        var bond = atom.bonds[b];
        var otherAtom = atom.bonds[b].getOtherAtom(atom);
        if (otherAtom != from) {
            var n = drawAtomPhysicsJs(atom, otherAtom);

            constraints.push(verletConstraints.distanceConstraint(node, n, 0.9, 30));
//            graph.newEdge(node, n, { directional: false });
        }
    }

    return node;
}

function parse(str) {
    graph.nodes = [];
    graph.edges = [];
    $("#errorMsg").text('');

    try {
        data = iupac.parse(str);
    } catch (ex) {
        $("#errorMsg").text(ex);
        return;
    }

    var atom = organicNameToMolecyle(data);

    clearAll();
    drawAtomPhysicsJs(null, atom);
    return atom;

    //paper.clear();
    //renderAtom(atom, paper, 20, 50);
}

function initThree() {
    var camera, scene, renderer;
    var geometry, material, mesh;

    //init();
    //animate();

    var init = function () {

        camera = new THREE.PerspectiveCamera(75, 1024 / 768, 1, 10000);
        camera.position.z = 300;

        scene = new THREE.Scene();

        geometry = new THREE.CubeGeometry(200, 200, 200);
        material = new THREE.MeshLambertMaterial(
    {
        color: 0xCC0000
    });//THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // create a point light
        var pointLight =
          new THREE.PointLight(0xFFFFFF);

        // set its position
        pointLight.position.x = 10;
        pointLight.position.y = 50;
        pointLight.position.z = 130;

        // add to the scene
        scene.add(pointLight);

        //renderer = new THREE.CanvasRenderer();
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(1024, 768);

        $('#3dcontainer').append(renderer.domElement);

    };
    init();

    var animate = function () {

        // note: three.js includes requestAnimationFrame shim
        requestAnimationFrame(animate);

        //mesh.rotation.x += 0.01;
        //mesh.rotation.y += 0.02;
        camera.rotation.x += 0.01;
        camera.rotation.y += 0.02;

        renderer.render(scene, camera);

    };
    animate();
}

var corners = [];
var center;

function orientMesh(geom, mesh, vstart, vend) {
    var HALF_PI = Math.PI * .5;
    var position = vend.clone().add(vstart).divideScalar(2);
    var rotationM = new THREE.Matrix4();
    rotationM.makeRotationX(HALF_PI);//rotate 90 degs on X
    geom.applyMatrix(rotationM);
    mesh.lookAt(vstart);
    mesh.position = position;
    return;
}

$(document).ready(function () {
    graph = new Springy.Graph();

    $("#parseButton").click(function () {
        parse($('#iupacName').val());
    });

    //paper = Raphael(10, 50, 320, 200);

    iupac.lexer = {
        lex: function () { return tokens.shift(); },
        setInput: function (str) { tokens = scanner.Tokenize(str) }
    }

    //$('#springycanvas').springy({ graph: graph });

    //initThree();
//    return;

    Physics(function (world) {
        gworld = world;

        Physics.renderer('canvasWebGL', function (proto) {

            // utility methods
            var thePrefix = {};

            return {

                /**
                 * Initialization
                 * @param  {Object} options Config options passed by initializer
                 * @return {void}
                 */
                init: function (options) {

                    // call proto init
                    proto.init.call(this, options);

                    this.camera = new THREE.PerspectiveCamera(75, 1024 / 768, 1, 10000);
                    this.camera.position.z = 200;
                    this.camera.position.y = -200;

                    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

                    this.scene = new THREE.Scene();

                    this.material = new THREE.MeshLambertMaterial(
    {
        color: 0xCC0000
    });

                    // create a point light
                    var pointLight = new THREE.PointLight(0xFFFFFF);

                    // set its position
                    pointLight.position.x = 10;
                    pointLight.position.y = 50;
                    pointLight.position.z = 130;

                    // add to the scene
                    this.scene.add(pointLight);

                    this.renderer = new THREE.WebGLRenderer({ antialias: true });
                    this.renderer.setSize(1024, 768);
                    // Set the background color of the scene.
                    this.renderer.setClearColorHex(0x111111, 1);

                    $('#3dcontainer').append(this.renderer.domElement);
                },

                /**
                 * Create a dom element for the specified geometry
                 * @param  {Geometry} geometry The bodie's geometry
                 * @return {HTMLElement}          The element
                 */
                createView: function (geometry) {

                    var mesh;

                    if (geometry.name == 'circle') {
                        //var geometry = new THREE.CubeGeometry(20, 20, 20);
                        var sphere = new THREE.SphereGeometry(geometry.radius, 20, 10);
                        var material = new THREE.MeshLambertMaterial(
                            {
                                color: 0x55FFFF//geometry.body.options.color
                            });
                        mesh = new THREE.Mesh(sphere, material);
                        this.scene.add(mesh);
                    } else {
                        throw "createView unknown geometry";
                    }
                    return mesh;
                },

                /**
                 * Draw the meta data
                 * @param  {Object} meta The meta data
                 * @return {void}
                 */
                drawMeta: function (meta) {

                    //this.els.fps.innerHTML = meta.fps.toFixed(2);
                    //this.els.ipf.innerHTML = meta.ipf;
                },

                drawLine: function () {
                    // TODO
                },

                /**
                 * Update dom element to reflect bodie's current state
                 * @param  {Body} body The body to draw
                 * @param  {HTMLElement} view The view for that body
                 * @return {void}
                 */
                drawBody: function (body, view) {
                    var pos = body.state.pos;

                    view.position.set(pos.get(0), pos.get(1), 0);

//                    view.style[cssTransform] = 'translate(' + pos.get(0) + 'px,' + pos.get(1) + 'px) rotate(' + body.state.angular.pos + 'rad)';
                }
            };
        });

//        var renderer = Physics.renderer('canvas', {
        var renderer = Physics.renderer('canvasWebGL', {
                el: 'springycanvas',
            width: 1024,
            height: 768,
            meta: false, // don't display meta data
            styles: {
                // set colors for the circle bodies
                'circle': {
                    strokeStyle: 'hsla(60, 37%, 17%, 1)',
                    lineWidth: 1,
                    fillStyle: 'hsla(60, 37%, 57%, 0.8)',
                    angleIndicator: 'hsla(60, 37%, 17%, 0.4)'
                }
            }
        });
        grenderer = renderer;

        world.add(renderer);

        var edgeBounce = Physics.behavior('edge-collision-detection', {
            aabb: Physics.aabb(0, 0, 1024, 768),
            restitution: 0.99,
            cof: 0.99
        });

        /*world.subscribe('step', function () {
            // Note: equivalent to just calling world.render() after world.step()
            world.render();
        });*/

        verletConstraints = Physics.behavior('verlet-constraints', {
            iterations: 2
        });

        var rigidConstraints = Physics.behavior('rigid-constraint-manager', {
            targetLength: 100
        });

        world.add(verletConstraints);
        world.add(rigidConstraints);
        world.add(edgeBounce);

        // add some gravity
        var gravity = Physics.behavior('constant-acceleration', {
            acc: { x: 0, y: 0.004 } // this is the default
        });
        //gravity.setAcceleration({ x: 0, y: 0.0004 });
  //      world.add(gravity);
        world.add(Physics.behavior('newtonian', { strength: -5 }));
//        world.add(Physics.behavior('body-impulse-response'));

        // render the "branches"
        world.subscribe('beforeRender', function (data) {

            var renderer = data.renderer
                , constrs = verletConstraints.getConstraints().distanceConstraints
                , c
            ;

            for (var i = 0, l = constrs.length; i < l; ++i) {

                c = constrs[i];

                if (!c.mesh) {
                    var cyl = new THREE.CylinderGeometry(2, 2, c.targetLength);
                    var material = new THREE.MeshLambertMaterial(
                        {
                            color: 0xFF9999
                        });
                    var mesh = new THREE.Mesh(cyl, material);
                    renderer.scene.add(mesh);
                    c.mesh = mesh;
                    c.geom = cyl;
                }

                orientMesh(c.geom, c.mesh,
                    new THREE.Vector3(c.bodyA.state.pos.get(0), c.bodyA.state.pos.get(1), 0),
                    new THREE.Vector3(c.bodyB.state.pos.get(0), c.bodyB.state.pos.get(1), 0));

                //c.mesh.position.set(pos.get(0), pos.get(1), 0);

                /*renderer.drawLine(c.bodyA.state.pos, c.bodyB.state.pos, {
                    strokeStyle: '#1133ff',
                    lineCap: 'round',
                    lineWidth: c.targetLength * c.targetLength * 0.0016
                });*/
            }
        });

        /*Physics.util.ticker.subscribe(function (time, dt) {
            //center.state.pos = Physics.vector(1024 / 2, 768 / 2);
            world.step(time);
            // Note: FPS ~= 1/dt
        });
        // start the ticker
        Physics.util.ticker.start();*/

        var animate = function () {
            requestAnimationFrame(animate);

            //mesh.rotation.x += 0.01;
            //mesh.rotation.y += 0.02;
            //renderer.camera.rotation.x += 0.01;
            //renderer.camera.rotation.y += 0.02;

            world.step(new Date().getTime());
            world.render();

            renderer.renderer.render(renderer.scene, renderer.camera);
        };

        animate();

        $("#startButton").click(function () {
            Physics.util.ticker.start();
        });

        $("#stopButton").click(function () {
            Physics.util.ticker.stop();
        });

        parse($('#iupacName').val());
    });
});
