window.onload = () => {

  // Setup Game Instance
  const scene = createScene();
  const camera = createCamera();
  const renderer = setupRenderer();
  setupLights(scene);
  setupAudio();
  
  // Create Game Instance & Animate
  const gameInstance = new Game(scene, camera);
  animate();
};

// Setup Scene
function createScene(){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);
  return scene;
};

// Setup Camera
function createCamera(){
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight
  );
  return camera;
};

// Setup Lighting
function setupLights(scene){
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 200, 0);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;

  scene.add(hemiLight);
  scene.add(dirLight);
};

// Render Scene
function setupRenderer(){
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
};

// Animate Game Loop
function animate() {
  requestAnimationFrame(animate);
  gameInstance.update();
  renderer.render(scene, camera);
}