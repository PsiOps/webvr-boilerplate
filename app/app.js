/* globals THREE navigator webvrui */

// THREE stuff
var scene, camera, renderer;
var lastRenderTime = 0;
var water, cube;

// VR stuff
var vrButton, vrDisplay, vrControls, vrEffect;

function getLight(){
    
    var light = new THREE.DirectionalLight( 0xffffff );
    
    light.position.set( 0, 1, 1 ).normalize();
    
    return light;
}

function getCamera(){
    
    var aspect = window.innerWidth / window.innerHeight;
    
    var camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100000);
    
    return camera;
}

function addVrControls(){
    
    vrControls = new THREE.VRControls(camera);
    vrControls.standing = true;
    //camera.position.y = vrControls.userHeight;
    camera.position.y=1000;
    camera.rotation.x=-0.2;
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

function getSkybox(){

    var cubeMap = new THREE.CubeTexture( [] );
    cubeMap.format = THREE.RGBFormat;    
    
    var loader = new THREE.ImageLoader();
    
    loader.load( 'img/skybox.png', function ( image ) {

        var getSide = function ( x, y ) {
            
            var size = 1024;
            
            var canvas = document.createElement( 'canvas' );
            canvas.width = size;
            canvas.height = size;
            
            var context = canvas.getContext( '2d' );
            context.drawImage( image, - x * size, - y * size );
            
            return canvas;
        };
        
        cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
        cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
        cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
        cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
        cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
        cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
        cubeMap.needsUpdate = true;
    });
    
    var cubeShader = THREE.ShaderLib[ 'cube' ];
    cubeShader.uniforms[ 'tCube' ].value = cubeMap;

    var skyBoxMaterial = new THREE.ShaderMaterial( {
      fragmentShader: cubeShader.fragmentShader,
      vertexShader: cubeShader.vertexShader,
      uniforms: cubeShader.uniforms,
      depthWrite: false,
      side: THREE.BackSide
    } );

    var skyBox = new THREE.Mesh(
      new THREE.BoxGeometry( 100000, 100000, 100000 ),
      skyBoxMaterial
    );

    skyBox.position.y= -10;
    skyBox.position.z= -10;
    
    return skyBox;
}

function getOcean(){
    
    var waterNormals = new THREE.ImageUtils.loadTexture( 'img/water-normals.jpg' );
    
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    
    water = new THREE.Water( renderer, camera, scene, {
      waterNormals: waterNormals,
      waterColor: 0x1F4F4F,
    } );

    var mirrorMesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(100000, 100000 ),
      water.material
    );

    mirrorMesh.add( water );
    mirrorMesh.rotation.x = - Math.PI * 0.5;
    mirrorMesh.position.y = -10;
    
    return mirrorMesh;
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
    
    scene.add(getSkybox());
    
    scene.add(getOcean());
    
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
    
    water.material.uniforms.time.value += 1.0 / 40.0;
    water.render();
    
    // Only update controls if we're presenting.
    if (vrButton.isPresenting()) 
        vrControls.update();
    
    // Render the scene.
    vrEffect.render(scene, camera);
    
    vrDisplay.requestAnimationFrame(animate);
}

window.addEventListener('load', init);