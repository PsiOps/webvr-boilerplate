/* globals THREE navigator webvrui */

// THREE stuff
var scene, camera, renderer;
var lastRenderTime = 0;
var cube;

// VR stuff
var vrButton, vrDisplay, vrControls, vrEffect;


function getLight(){
    
    var light = new THREE.DirectionalLight( 0xffffff );
    
    light.position.set( 0, 1, 1 ).normalize();
    
    return light;
}

function getCamera(){
    
    var aspect = window.innerWidth / window.innerHeight;
    
    var camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);
    
    return camera;
}

function addVrControls(){
    
    vrControls = new THREE.VRControls(camera);
    vrControls.standing = true;
    camera.position.y = vrControls.userHeight;
}

function addVrEffect(){
    
    // Apply VR stereo rendering to renderer.
    vrEffect = new THREE.VREffect(renderer);
    vrEffect.setSize(window.innerWidth, window.innerHeight);
}

function addVrButton(){
    
    // Initialize the WebVR UI.
    var uiOptions = {
        color: 'black',
        background: 'white',
        corners: 'square'
    };
    
    vrButton = new webvrui.EnterVRButton(renderer.domElement, uiOptions);
    
    vrButton.on('exit', function() {
        console.log("VrButton Exit callback");
        camera.quaternion.set(0, 0, 0, 1);
        camera.position.set(0, vrControls.userHeight, 0);
    });
    
    vrButton.on('hide', function() {
        document.getElementById('ui').style.display = 'none';
    });
    
    vrButton.on('show', function() {
        document.getElementById('ui').style.display = 'inherit';
    });
    
    document.getElementById('vr-button').appendChild(vrButton.domElement);
    document.getElementById('magic-window').addEventListener('click', function() {
        vrButton.requestEnterFullscreen();
    });
}

function addVr(){
    
    addVrControls();
    
    addVrEffect();

    addVrButton();
}

function rgbToElevation(rgb, offset, step){
    
    return (rgb - offset) * step;
}

function getTerrain(){
    
    // Create a plane with y based on image declared in dom
    var img = document.getElementById("landscape-image");
    var canvas = document.getElementById("canvas");
    
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    
    var data = canvas.getContext('2d').getImageData(0,0, img.height, img.width).data;

    var heightStep = -0.2; // A 10 decrease in avg RGB corresponds with one 1 increase in elevation
    var offset = 160; // Average RGB = 160 should correspond to zero elevation
    var planeGeometry = new THREE.PlaneGeometry(500, 500, 499, 499);
    
    for (var i = 0, n = data.length; i < n; i += 4) {
        
        var avgRgb = (data[i] + data[i+1] + data[i+2]) / 3;
        
        var elevation = rgbToElevation(avgRgb, offset, heightStep);
        
        planeGeometry.vertices[i/4].z = planeGeometry.vertices[i/4].z + (elevation);
    }
    
    // so the shading according to the light-source is correct.
    planeGeometry.computeFaceNormals();
    planeGeometry.computeVertexNormals();
    
    var planeMaterial = new THREE.MeshPhongMaterial( { color: 0x0000ff} );
    
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    
    plane.material.side = THREE.DoubleSide;
    plane.rotation.x = THREE.Math.degToRad(-90); // Rotating a mesh rotates the axes along with it.
    plane.position.set(0, -2, 0); // So positional transformations need to take this into account.
    
    return plane;
}

function getCube(){
    
    // Add a cube to the scene
    var cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var cubeMaterial = new THREE.MeshPhongMaterial();
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    
    // Position cube mesh to be right in front of you.
    cube.position.set(0, 1, -3);
    
    return cube;
}

function onResize(e) {
  
    vrEffect.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function getVrDisplay() {
    
    navigator.getVRDisplays().then(function(displays) {
        
        if (displays.length == 0) return;
        
        vrDisplay = displays[0];
        
        // This starts the loop, as animate calls requestAnimationFrame with itself
        vrDisplay.requestAnimationFrame(animate);
    });
}

function init(){

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    
    document.body.appendChild(renderer.domElement);
    
    scene = new THREE.Scene();
    
    scene.add(getLight());
    
    camera = getCamera();
    
    addVr();
    
    scene.add(camera);
    
    scene.add(getTerrain());
    cube = getCube();
    scene.add(cube);
    
    window.addEventListener('resize', onResize, true);
    window.addEventListener('vrdisplaypresentchange', onResize, true);
    
    getVrDisplay();
}

function animate(timestamp) {

    var delta = Math.min(timestamp - lastRenderTime, 500);
    lastRenderTime = timestamp;
    
    // Apply rotation to cube mesh
    cube.rotation.y += delta * 0.0006;
    
    // Only update controls if we're presenting.
    if (vrButton.isPresenting()) 
        vrControls.update();
    
    // Render the scene.
    vrEffect.render(scene, camera);
    
    vrDisplay.requestAnimationFrame(animate);
}

window.addEventListener('load', init);