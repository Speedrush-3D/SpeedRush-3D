import * as THREE from "../vendors/three.module.js";
import model from "./Loader_playerCar.js";
//import {obstacle} from './Loader_obstacleCars.js'
import { math } from "./math.js";
import { FBXLoader } from "../vendors/FBXLoader.js";

window.onload = () => {
  const scene = new THREE.Scene();

  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 200, 100);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -100;
  dirLight.shadow.camera.left = -120;
  dirLight.shadow.camera.right = 120;
  scene.add(dirLight);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  const gameInstance = new Game(scene, camera);

  //camera.position.z = 3;

  function animate() {
    requestAnimationFrame(animate);
    gameInstance.update();
    renderer.render(scene, camera);
  }
  animate();
};

class Game {
  OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(1, 1, 1);
  OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  TREE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x0000ff });

  LANELINE_PREFAB = new THREE.PlaneGeometry(0.09, 1);
  LANELINE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffffff });

  ROADLINE_PREFAB = new THREE.PlaneGeometry(0.09, 32);

  COLLOSION_THRESHOLD = 0.5;

  constructor(scene, camera) {
    this.divScore = document.getElementById("score");
    this.divDistance = document.getElementById("distance");

    this.divScore.innerText = this.score;
    this.divDistance.innerText = 0;

    this.divGameOverPanel = document.getElementById("game-over-panel");
    this.divGameOverScore = document.getElementById("game-over-score");
    this.divGameOverDistance = document.getElementById("game-over-distance");

    this.divPausePanel = document.getElementById("pause-panel");
    this.divPauseScore = document.getElementById("pause-score");
    this.divPauseDistance = document.getElementById("pause-distance");

    document.getElementById("start-button").onclick = () => {
      this.running = true;
      document.getElementById("intro-panel").style.display = "none";
    };

    document.getElementById("level-replay-button").onclick = () => {
      document.getElementById("menu-holder").style.display = "grid";
      document.getElementById("game-over-panel").style.display = "none";
    };

    document.getElementById("level-select-button-pause").onclick = () => {
      document.getElementById("menu-holder").style.display = "grid";
      this.divPausePanel.style.display = "none";
    };

    this.difficulty = 0;
    document.getElementById("easy").onclick = () => {
      this.difficulty =0;
      this._changeLevel();
      this.running = true;
      this.clock.start();
      document.getElementById("menu-holder").style.display = "none";
    };
    document.getElementById("med").onclick = () => {
      this.difficulty = 1;
      this._changeLevel();
      this.running = true;
      this.clock.start();
      document.getElementById("menu-holder").style.display = "none";
    };
    document.getElementById("hard").onclick = () => {
      this.difficulty = 2;
      this._changeLevel();
      this.running = true;
      this.clock.start();
      document.getElementById("menu-holder").style.display = "none";
    };
    document.getElementById("replay-button").onclick = () => {
      this.running = true;
      this.divGameOverPanel.style.display = "none";
    };
    document.getElementById("replay-button-pause").onclick = () => {
      this._reset(true);
      this.running = true;
      this.divPausePanel.style.display = "none";
    };

    document.getElementById("continue-button").onclick = () => {
      this.running = true;
      this.clock.start();
      this.divPausePanel.style.display = "none";
      this.lineParent.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          this._setupLaneLines(
            item,
            item.userData.type,
            -this.lineParent.position.z,
            item.userData.pos
          );
          //console.log(item.userData.pos);
        } else {
          // console.log(this.lineParent.position.z)
          item.position.set(0, 0, this.lineParent.position.z);
        }
      });

      
    };

    this.scene = scene;
    this.camera = camera;
   // console.log(this.difficulty);
    this._reset(false);
    //this.obstacleCounter =0;

    document.addEventListener("keydown", this._keydown.bind(this));
    document.addEventListener("keyup", this._keyup.bind(this));
  }

  update() {
    if (!this.running) return;

    this.time += this.clock.getDelta();
    //console.log(this.time);

    this.translateX += this.speedX * -0.05;
    //console.log(this.translateX);
    this._checkCollisions();
    this._updateGrid();
    this._updateInfoPanel();
  }

  _changeLevel(){
    if(this.difficulty == 0){
     // console.log(true);
      this.skydome.visible = true;
      this.skydome3.visible = false;
      this.skydome2.visible =false;      
    }else if(this.difficulty ==1){
      this.skydome.visible = false;
      this.skydome3.visible =true;
      this.skydome2.visible = false;
    }else{
      this.skydome.visible = false;
      this.skydome3.visible = false;
      this.skydome2.visible =true;
    }
  }

  _keydown(event) {
    let newSpeedX;
    switch (event.key) {
      case "ArrowLeft":
        newSpeedX = -1.0;
        break;
      case "ArrowRight":
        newSpeedX = 1.0;
        break;
      case "a":
        newSpeedX = -1.0;
        break;
      case "A":
        newSpeedX = -1.0;
        break;
      case "d":
        newSpeedX = 1.0;
        break;
      case "D":
        newSpeedX = 1.0;
        break;
      case "P":
        this._pause();
        newSpeedX = 0;
        break;
      case "p":
        this._pause();
        newSpeedX = 0;
        break;
      case "v":
        this._changeView(this.camera);
        newSpeedX = 0;
        break;
      case "V":
        this._changeView(this.camera);
        newSpeedX = 0;
        break;
      default:
        return;
    }

    this.speedX = newSpeedX;
    //console.log(this.speedX);
  }

  _keyup() {
    this.speedX = 0;
  }

  _changeView(camera) {
    if (camera.position.z == 3) {
      camera.position.set(0, 1, -0.2);
    } else if (camera.position.z == -0.2) {
      camera.rotateX((-65 * Math.PI) / 180);
  
      camera.position.set(0, 8, -3);
    } else {
      camera.position.set(0, 1.5, 3);
      camera.lookAt(0, 0, 0);
    }
  }

  _updateGrid() {
   // console.log(this.speedZ);
    this.skydome.rotateY(0.1 * (Math.PI / 180));
    this.skydome2.rotateY(0.1 * (Math.PI / 180));
    this.skydome3.rotateY(0.1 * (Math.PI / 180));


    this.speedIncrementor = this.speedIncrementor + 0.15;
    //this.grid.material.uniforms.time.value = this.time;
    // console.log(this.speedIncrementor);
    if(this.difficulty == 1 && this.speedZ < 9){
      this.speedZ = this.speedZ + 0.00045;
      //console.log(this.speedZ);
    }else if(this.difficulty == 2 && this.speedZ <12 ){
      this.speedZ = this.speedZ + 0.00045;
    }

    this.objectsParent.position.z =
      this.speedZ * this.time + this.speedIncrementor; //multiply by something to increase speed
    this.lineParent.position.z =
      this.speedZ * this.time + 1.5 * this.speedIncrementor;
    this.treesParent.position.z =
      this.speedZ * this.time + this.speedIncrementor;
    // this.grid.material.uniforms.translateX.value = this.translateX;

    if (this.translateX < 2.15 && this.translateX > -2.15) {
      //console.log(this.grid.material.uniforms.translateX.value)
      this.objectsParent.position.x = this.translateX;
      this.lineParent.position.x = this.translateX;
      this.treesParent.position.x = this.translateX;
      this.roadLineParent.position.x = this.translateX;
    }

    this.objectsParent.traverse((child) => {
      //if (child instanceof THREE.Mesh) {
      const childZPos = child.position.z + this.objectsParent.position.z;
      //console.log(this.objectsParent.position.z);
      if (childZPos > 3) {
        if (child.name == "obs") {
          this.score += 5;
          this.divScore.innerText = this.score;

          this._setupObstacle(
            child,
            -this.objectsParent.position.z,
            math._randomInt(0, 4)
          );
        }
      }
      // }
    });

    this.lineParent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZPos = child.position.z + this.lineParent.position.z;
        if (childZPos > 3) {
          this._setupLaneLines(
            child,
            child.userData.type,
            -this.lineParent.position.z
          );
        }
      }
    });

    this.treesParent.traverse((child) => {
      if (child.name == "Tree") {
        const childZPos = child.position.z + this.treesParent.position.z;
        if (childZPos > 3) {
          this._setupTrees(child, -this.treesParent.position.z);
        }
      }
    });

    if(this.score > 300 && this.difficulty == 0){
      this.difficulty = 1;
      this._changeLevel();
      
    }else if(this.score > 800 && this.difficulty == 1){
      this.difficulty =2;
      this._changeLevel();
      
    }

    //console.log(this.speedZ);


  }

  _reset(replay) {
    this.running = false;

    //console.log(this.difficulty);

    if(this.difficulty == 0){
      this.speedZ = 5;
    }else if(this.difficulty ==1){
      this.speedZ = 8;
    }else{
      this.speedZ = 10;
    }

    //this.speedZ =5;
    this.speedX = 0;
    this.translateX = 0;
    this.score = 0;
    this.collisionCount = 0;
    this.prevTime = 0;
    this.speedIncrementor = 0;
    this.obstacleCounter = 0;
    this.posArr = new Array(7);
    for (let i = 0; i < this.posArr.length; i++) {
      this.posArr[i] = 0;
    }
    
    this.divScore.innerText = this.score;
    this.divDistance.innerText = 0;
    
    this.time = 0;
    this.clock = new THREE.Clock();
  
    this._initializeScene(this.scene, this.camera, replay);
    this._changeLevel();
   
    
  }

  _checkCollisions() {
    /*  this.objectsParent.traverse((child) =>{
          if(child.userData.type == "obstacle"){
            const childZPos = child.position.z + this.objectsParent.position.z;
            //console.log(childZPos);
            const thresholdX = this.COLLOSION_THRESHOLD +child.scale.x/2.5;
            const thresholdZ = this.COLLOSION_THRESHOLD + child.scale.z/2.5;
            if(childZPos > -thresholdZ && Math.abs(child.position.x + this.translateX) < thresholdX){
              console.log("collison");
            }
          }
        }
      );*/

    //console.log(this.objectsParent.position.x, "parent");
    this.objectsParent.traverse((child) => {
      if (child.name == "obs") {
        /*const childZPos = child.position.z + this.objectsParent.position.z;
        const thresholdX = this.COLLOSION_THRESHOLD + child.scale.x / 2;
        const thresholdZ = this.COLLOSION_THRESHOLD + child.scale.z / 2;*/
        // console.log(child.position.x, "child", this.translateX, "trans");

        /* if(child.position.z+this.objectsParent.position.z>0.25){
            console.log("z");
          }*/
        /*if( Math.abs(child.position.x+this.translateX)<0.55){
            console.log("x")
          }*/
        if (
          child.position.z + this.objectsParent.position.z > 0.25 &&
          Math.abs(child.position.x + this.translateX) <= 0.7
        ) {
          this.collisionCount = this.collisionCount + 1;
          this.prevTime = this.time;
          // console.log(Math.abs(child.position.x + this.translateX), "x");
          //console.log(child.position.z + this.objectsParent.position.z, "z");
        }

        if (this.time - this.prevTime > 0.75) {
          this.collisionCount = 0;
        }
        //console.log(this.collisionCount);

        if (this.collisionCount > 3) {
          //console.log("collison");
          this._gameOver();
        } /*else{
            this.score +=1;
            this.divScore.innerText = this.score;
          }*/
      }
    });
  }

  _updateInfoPanel() {
    this.divDistance.innerText = this.objectsParent.position.z.toFixed(0);
  }

  _pause() {
    this.running = false;
    this.divPauseScore.innerText = this.score;
    this.divPauseDistance.innerText = this.objectsParent.position.z.toFixed(0);
    this.clock.stop();
    setTimeout(() => {
      this.divPausePanel.style.display = "grid";
      //this._reset(true);
    }, 10);
  }

  _gameOver() {
    this.running = false;
    this.divGameOverScore.innerText = this.score;
    this.divGameOverDistance.innerText =
      this.objectsParent.position.z.toFixed(0);
    setTimeout(() => {
      this.divGameOverPanel.style.display = "grid";
      this._reset(true);
    }, 1000);
  }

  _createPlayerCar(scene) {
    /*const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      this.cube = new THREE.Mesh(geometry, material);
      this.cube.scale.set(0.5, 0.5, 0.5);
      this.cube.translateY(0.75);
      scene.add(this.cube);*/
    this.playerBox = new THREE.Box3();
    model.then((object) => {
      this.playerBox.setFromObject(object);
      scene.add(object);
    });
  }

  _initializeScene(scene, camera, replay) {
    if (!replay) {
      this._createSky();
      this._createPlayerCar(scene);
      //this._createGrid(scene);
      this.objectsParent = new THREE.Group();
      scene.add(this.objectsParent);
      this.objectsParent.userData = { type: "obstacle_parent" };

      this.lineParent = new THREE.Group();
      scene.add(this.lineParent);

      this.treesParent = new THREE.Group();
      scene.add(this.treesParent);
      this.treesParent.userData = { type: "trees_parent" };

      this.roadLineParent = new THREE.Group();
      scene.add(this.roadLineParent);

      this._spawnRoadLines();

      for (let i = 0; i < 8; i++) {
        this._spawnTrees();
      }

      for (let i = 0; i < 7; i++) {
        this._spawnObstacle();
      }
      // console.log(this.objectsParent);

      let pos1 = 0;
      let pos2 = 0;
      let pos3 = 0;
      for (let i = 0; i < 12; i++) {
        if (i == 0 || i == 1 || i == 2 || i == 3) {
          this.lane = 0;
          this._spawnLaneLines(this.lane, pos1);
          pos1 = pos1 + 1;
        } else if (i == 4 || i == 5 || i == 6 || i == 7) {
          this.lane = 1;
          this._spawnLaneLines(this.lane, pos2);
          pos2 = pos2 + 1;
        } else {
          this.lane = 2;
          this._spawnLaneLines(this.lane, pos3);
          pos3 = pos3 + 1;
        }
      }

      camera.rotateX((-20 * Math.PI) / 180);
      camera.position.set(0, 1.5, 3);
    } else {
      this.objectsParent.traverse((item) => {
        if (item.name == "obs") {
          //console.log("kid");
          this._setupObstacle(item);
        } else if (item.userData.type == "obstacle_parent") {
          item.position.set(0, 0, 0);
          //console.log("parent");
        }
      });

      this.treesParent.traverse((item) => {
        if (item.name == "Tree") {
          this._setupTrees(item);
        } else if (item.userData.type == "trees_parent") {
          item.position.set(0, 0, 0);
        }
      });

      this.lineParent.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          this._setupLaneLines(item, item.userData.type, 0, item.userData.pos);
          //console.log(item.userData.pos);
        } else {
          item.position.set(0, 0, 0);
        }
      });
    }

    //camera.rotateX((-75 * Math.PI) / 180); //top view .. needs work
    //camera.position.set(0, 8,2);
  }

  _spawnTrees() {
    /* const obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.TREE_MATERIAL);
    obj.scale.set(0.25, 1, 0.25);
    this._setupTrees(obj);
    obj.userData = { type: "Tree" };
    obj.name = "Tree";
    this.treesParent.add(obj);*/
    const obj = new THREE.Group();
    const loader = new FBXLoader();

    let rand = math._randomInt(0, 4);
    let pathStr = "";
    switch (rand) {
      case 0:
        pathStr = "resources/nature_pack/FBX/Bush2.fbx";
        break;
      case 1:
        pathStr = "resources/nature_pack/FBX/Tree1.fbx";
        break;
      case 2:
        pathStr = "resources/nature_pack/FBX/Rock2.fbx";
        break;
      case 3:
        pathStr = "resources/nature_pack/FBX/Tree4.fbx";
        break;
      default:
        pathStr = "resources/nature_pack/FBX/Tree1.fbx";
        break;
    }
    //console.log(rand);
    loader.load(pathStr, function (fbx) {
      fbx.scale.setScalar(0.007);

      /* fbx.quaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -90 * (Math.PI / 180)
      );*/

      fbx.traverse((c) => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            m.specular = new THREE.Color(0x000000);
            m.color.offsetHSL(0, 0.25, 0);
          }
        }
        c.castShadow = true;
        c.receiveShadow = true;
      });
      obj.add(fbx);
    });

    obj.userData = { type: "Tree" };
    obj.name = "Tree";
    this._setupTrees(obj);
    this.treesParent.add(obj);
  }

  _setupTrees(obj, refZPos = 0) {
    let lane = math._randomInt(0, 2);
    //console.log(lane);
    if (lane == 0) {
      obj.position.set(
        -5.5,
        //obj.scale.y * 0.5,
        0,
        refZPos - 2 - math._randomFloat(10, 30)
      );
    } else if (lane == 1) {
      obj.position.set(
        5.5,
        //obj.scale.y * 0.5,
        0,
        refZPos - 2 - math._randomFloat(10, 30)
      );
    }
  }

  _spawnRoadLines() {
    const leftLine = new THREE.Mesh(
      this.ROADLINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    leftLine.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);

    leftLine.position.set(
      -2.45,
      //leftLine.scale.y*0.5,
      0,
      -1
    );

    this.roadLineParent.add(leftLine);

    const rightLine = new THREE.Mesh(
      this.ROADLINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    rightLine.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);

    rightLine.position.set(
      2.45,
      //rightLine.scale.y*0.5,
      0,
      -1
    );

    this.roadLineParent.add(rightLine);

    const laneLine_1 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_1.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_1.position.set(-1.2, 0, -16);

    const laneLine_2 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_2.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_2.position.set(0, 0, -16);

    const laneLine_3 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_3.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_3.position.set(1.2, 0, -16);

    const laneLine_4 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_4.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_4.position.set(-1.2, 0, -20);

    const laneLine_5 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_5.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_5.position.set(0, 0, -20);

    const laneLine_6 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_6.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_6.position.set(1.2, 0, -20);

    this.roadLineParent.add(laneLine_1);
    this.roadLineParent.add(laneLine_2);
    this.roadLineParent.add(laneLine_3);
    this.roadLineParent.add(laneLine_4);
    this.roadLineParent.add(laneLine_5);
    this.roadLineParent.add(laneLine_6);
  }

  _spawnLaneLines(lane, pos) {
    const plane = new THREE.Mesh(this.LANELINE_PREFAB, this.LANELINE_MATERIAL);
    plane.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    plane.userData = { type: lane, pos: pos };
    this._setupLaneLines(plane, lane, 0, pos);
    this.lineParent.add(plane);
  }

  _setupLaneLines(laneLine, lane, refZPos = 0, pos = -1) {
    if (pos == 0) {
      pos = refZPos;
    } else if (pos == 1) {
      pos = refZPos - 4;
    } else if (pos == 2) {
      pos = refZPos - 8;
    } else if (pos == 3) {
      pos = refZPos - 12;
    } else {
      pos = refZPos - 12;
    }
    //console.log(pos);

    if (lane == 0) {
      laneLine.position.set(
        -1.2,
        //laneLine.scale.y*0.5,
        0,
        //refZPos - 16
        pos
      );
    } else if (lane == 1) {
      laneLine.position.set(
        0,
        //laneLine.scale.y*0.5,
        0,
        pos
      );
    } else if (lane == 2) {
      laneLine.position.set(
        1.2,
        //laneLine.scale.y*0.5,
        0,
        pos
      );
    }
  }

  _spawnObstacle() {
    /*const obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.OBSTACLE_MATERIAL);
        obj.scale.set(0.5, 0.5, 0.5);
        this._setupObstacle(obj);
        obj.userData = { type: "obstacle" };
        this.objectsParent.add(obj);*/

    const obj = new THREE.Group();
    const loader = new FBXLoader();

    let rand = math._randomInt(0, 6);
    let pathStr = "";
    switch (rand) {
      case 0:
        pathStr = "resources/car_pack/FBX/NormalCar1.fbx";
        break;
      case 1:
        pathStr = "resources/car_pack/FBX/NormalCar2.fbx";
        break;
      case 2:
        pathStr = "resources/car_pack/FBX/SportsCar2.fbx";
        break;
      case 3:
        pathStr = "resources/car_pack/FBX/SUV.fbx";
        break;
      case 4:
        pathStr = "resources/car_pack/FBX/Taxi.fbx";
        break;
      case 5:
        pathStr = "resources/car_pack/FBX/Cop.fbx";
        break;
      default:
        pathStr = "resources/car_pack/FBX/NormalCar1.fbx";
        break;
    }
    //console.log(rand);
    loader.load(pathStr, function (fbx) {
      fbx.scale.setScalar(0.0045);

      fbx.quaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -90 * (Math.PI / 180)
      );

      fbx.traverse((c) => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            m.specular = new THREE.Color(0x000000);
            m.color.offsetHSL(0, 0.25, 0);
          }
        }
        c.castShadow = true;
        c.receiveShadow = true;
      });
      obj.add(fbx);
    });

    obj.userData = { type: "obstacle" };
    obj.name = "obs";
    this._setupObstacle(obj);
    this.objectsParent.add(obj);

    /*model_obstacle.then(obj =>{
     // let obj = new model_obstacle();
          //console.log(obj);  
          this._setupObstacle(obj);
          obj.userData = { type: "obstacle" };
          this.objectsParent.add(obj);
      })
      console.log(this.objectsParent);*/
  }

  _createSky() {
    //var geometry = new THREE.SphereGeometry(5, 100, 60);
    var geometry = new THREE.SphereGeometry(30, 100, 60);

    var material = new THREE.MeshBasicMaterial();
    material.map = new THREE.TextureLoader().load("resources/sky.jpg");
    material.side = THREE.BackSide;
    this.skydome = new THREE.Mesh(geometry, material);
    //this.skydome.rotateX(900*(Math.PI/180));
    
    var geometry2 = new THREE.SphereGeometry(8.5, 100, 60);
    
    var material2 = new THREE.MeshBasicMaterial();
    material2.map = new THREE.TextureLoader().load("resources/night_sky.jpg");
    material2.side = THREE.BackSide;
    this.skydome2 = new THREE.Mesh(geometry2, material2);
    //this.skydome.rotateX(900*(Math.PI/180));
    //this.scene.add(this.skydome2);

    var geometry3 = new THREE.SphereGeometry(13, 100, 60);
    var material3 = new THREE.MeshBasicMaterial();
    material3.map = new THREE.TextureLoader().load(
      "resources/afternoon_sky.jpg"
    );
    material3.side = THREE.BackSide;
    this.skydome3 = new THREE.Mesh(geometry3, material3);
    //this.skydome.rotateX(900*(Math.PI/180));
    //this.scene.add(this.skydome3);
   // this.skydome = this.skydome2;
    this.scene.add(this.skydome);
    this.scene.add(this.skydome2);
    this.scene.add(this.skydome3);

  }

  _setupObstacle(obj, refZPos = 0) {
    let lane = math._randomInt(0, 4);
    let currZ = refZPos - 10 - math._randomFloat(0, 10);

    this.posArr[this.obstacleCounter] = currZ;

    //this.posArr = this.posArr.sort((a,b) => b-a);

    for (let j = 0; j < this.posArr.length; j++) {
      for (let i = 0; i < this.posArr.length; i++) {
        if (this.posArr[i] - currZ - this.objectsParent.position.z < 0.75) {
          currZ = currZ - 0.75;
          this.posArr[this.obstacleCounter] = currZ;
        }
      }
    }

    //console.log(this.posArr);
    //console.log(-this.objectsParent.position.z, "first");
    //console.log(-this.obstacleCounter-refZPos, "sec");

    // let dist = this.obstacleCounter - currZ;

    /*while(dist <= 0 ){
              currZ = refZPos - 16 - this._randomFloat(0,16);
              dist = this.obstacleCounter - currZ;
          }*/ //potential lag point

    // console.log(dist);

    if (lane == 0) {
      //1st lane from left
      obj.position.set(
        -2,
        //obj.scale.y * 0.5,
        0,
        //refZPos - 16 - math._randomFloat(10, 16)
        currZ
      );
      //console.log(refZPos);
    } else if (lane == 1) {
      //2nd lane from left
      obj.position.set(
        -0.75,
        //obj.scale.y * 0.5,
        0,
        //refZPos - 16 - this._randomFloat(0,4)
        //refZPos - 16 - math._randomFloat(0, 16)
        currZ
      );
    } else if (lane == 2) {
      obj.position.set(
        0.75,
        //obj.scale.y * 0.5,
        0,
        //refZPos - 16 - this._randomFloat(0,4)
        //refZPos - 16 - math._randomFloat(10, 16)
        currZ
      );
    } else if (lane == 3) {
      obj.position.set(
        2,
        //obj.scale.y * 0.5,
        0,
        //refZPos - 16 - this._randomFloat(0,4)
        //refZPos - 16 - math._randomFloat(0, 16)
        currZ
      );
    }
    //obj.translateY(0.4);

    // console.log(this.obstacleCounter);
    this.obstacleCounter = this.obstacleCounter + 1;
    if (this.obstacleCounter == this.posArr.length) {
      this.obstacleCounter = 0;
    }
  }
}

/* _createGrid() {
    let divisions = 4;
    let gridLimit = 8;
    this.grid = new THREE.GridHelper(
      gridLimit * 2,
      divisions,
      0x000000,
      0x000000
    );
    const moveableZ = [];
    const moveableX = [];

    for (let i = 0; i <= divisions; i++) {
      moveableX.push(0, 0, 1, 1);
      moveableZ.push(1, 1, 0, 0); // move horizontal lines only (1 - point is moveable)
    }
    this.grid.geometry.setAttribute(
      "moveableZ",
      new THREE.BufferAttribute(new Uint8Array(moveableZ), 1)
    );

    this.grid.geometry.setAttribute(
      "moveableX",
      new THREE.BufferAttribute(new Uint8Array(moveableX), 1)
    );
    this.grid.material = new THREE.ShaderMaterial({
      uniforms: {
        speedZ: {
          value: this.speedZ,
        },
        translateX: {
          value: this.translateX,
        },
        gridLimits: {
          value: new THREE.Vector2(-gridLimit, gridLimit),
        },
        time: {
          value: 0,
        },
      },
      vertexShader: `
              uniform float time;
              uniform vec2 gridLimits;
              uniform float speedZ;
              uniform float translateX;
  
              attribute float moveableZ;
              attribute float moveableX;
  
              varying vec3 vColor;
          
              void main() {
              vColor = color;
              float limLen = gridLimits.y - gridLimits.x;
              vec3 pos = position;
              if (floor(moveableX + 0.5) > 0.5) { // if a point has "moveableZ" attribute = 1 
                  float xDist = translateX;
                  float curXPos = mod((pos.x + xDist) - gridLimits.x, limLen) + gridLimits.x;
                  pos.x = curXPos;
              }
  
              if (floor(moveableZ + 0.5) > 0.5) { // if a point has "moveableZ" attribute = 1 
                float zDist = speedZ * time;
                float curZPos = mod((pos.z + zDist) - gridLimits.x, limLen) + gridLimits.x;
                pos.z = curZPos;
            }
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
              }
          `,
      fragmentShader: `
              varying vec3 vColor;
          
              void main() {
              gl_FragColor = vec4(vColor, 1.); // r, g, b channels + alpha (transparency)
              }
          `,
      vertexColors: THREE.VertexColors,
    });
    this.grid.scale.set(0.45, 1, 5);

    //scene.add(this.grid);
  }*/
