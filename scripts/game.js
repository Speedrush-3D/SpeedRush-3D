class Game {

  // Buffer Geometry Properties
  OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(1, 1, 1);
  OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  LANELINE_PREFAB = new THREE.PlaneGeometry(0.09, 1);
  LANELINE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xffffff });
  ROADLINE_PREFAB = new THREE.PlaneGeometry(0.09, 32);
  TREE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x0000ff });

  COLLOSION_THRESHOLD = 0.4;

  // Constructor
  constructor(scene, camera) {
      // Initialize UI Elements
      this.divScore = document.getElementById("score");
      this.divDistance = document.getElementById("distance");
      this.divGameOverPanel = document.getElementById("game-over-panel");
      this.divGameOverScore = document.getElementById("game-over-score");
      this.divGameOverDistance = document.getElementById("game-over-distance");
      this.divPausePanel = document.getElementById("pause-panel");
      this.divPauseScore = document.getElementById("pause-score");
      this.divPauseDistance = document.getElementById("pause-distance");
  
      // Define UI Logic
      this._documentLogic();

      // Initialize Game Variables
      this.scene = scene;
      this.camera = camera;
      this.difficulty = 0;
      this.divScore.innerText = this.score;
      this.divDistance.innerText = 0;
      this.running = false;
      this._reset(false);
      document.addEventListener("keydown", this._keydown.bind(this));
      document.addEventListener("keyup", this._keyup.bind(this));
  }
  
  update() {
    if (!this.running) return;

    this.time += this.clock.getDelta();
    this.translateX += this.speedX * -0.05;

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
        if (soundAudio) {
          soundAudio.play('left');
        }
        break;
      case "ArrowRight":
        newSpeedX = 1.0;
        if (soundAudio) {
          soundAudio.play('right');
        }
        break;
      case "a":
        newSpeedX = -1.0;
        if (soundAudio) {
          soundAudio.play('left');
        }
        break;
      case "A":
        newSpeedX = -1.0;
        if (soundAudio) {
          soundAudio.play('left');
        }
        break;
      case "d":
        newSpeedX = 1.0;
        if (soundAudio) {
          soundAudio.play('right');
        }
        break;
      case "D":
        newSpeedX = 1.0;
        if (soundAudio) {
          soundAudio.play('right');
        }
        break;
      case "P":
        this._pause();
        if (soundAudio) {
          soundAudio.play('button');
        }
        newSpeedX = 0;
        break;
      case "p":
        this._pause();
        if (soundAudio) {
          soundAudio.play('button');
        }
        newSpeedX = 0;
        break;
      case "v":
        this._changeView(this.camera);
        if (soundAudio) {
          soundAudio.play('button');
        }
        newSpeedX = 0;
        break;
      case "V":
        this._changeView(this.camera);
        if (soundAudio) {
          soundAudio.play('button');
        }
        newSpeedX = 0;
        break;
      default:
        return;
    }

    this.speedX = newSpeedX;
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
            this._randomInt(0, 4)
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
    if(this.difficulty == 0){
      this.speedZ = 5;
    }else if(this.difficulty ==1){
      this.speedZ = 8;
    }else{
      this.speedZ = 10;
    }

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
    this.objectsParent.traverse((child) => {
      if (child.name == "obs") {
        if (
          child.position.z + this.objectsParent.position.z > -2.3 &&
          Math.abs(child.position.x + this.translateX) <= 0.7
        ) {
          this.collisionCount = this.collisionCount + 1;
          this.prevTime = this.time;
        }

        if (this.time - this.prevTime > 0.75) {
          this.collisionCount = 0;
        }

        if (this.collisionCount > 1) {
          
          this._gameOver();
            
          if (soundAudio) {
            soundAudio.play('crash');
          }
        }
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
    }, 10);
  }

  _gameOver() {

    setTimeout(() => {
      this.Crash.visible = true;
    }, 10);
    
    this.running = false;
    this.divGameOverScore.innerText = this.score;
    this.divGameOverDistance.innerText =
      this.objectsParent.position.z.toFixed(0);
    setTimeout(() => {
      this.divGameOverPanel.style.display = "grid";
      this._reset(true);
      this.Crash.visible = false;
    }, 3000);
  }

  _createPlayerCar(scene) {
    // const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // this.cube = new THREE.Mesh(geometry, material);
    // this.cube.scale.set(0.5, 0.5, 0.5);
    // this.cube.translateY(0.75);
    // scene.add(this.cube);
    this.playerBox = new THREE.Box3();
    model.then((object) => {
      this.playerBox.setFromObject(object);
      scene.add(object);
    });
  }

  _initializeScene(scene, camera, replay) {//in game
    if (!replay) {
      this._createSky();
      this._createPlayerCar(scene);
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
      this.Crash.visible = false;
      this.objectsParent.traverse((item) => {
        if (item.name == "obs") {
          this._setupObstacle(item);
        } else if (item.userData.type == "obstacle_parent") {
          item.position.set(0, 0, 0);
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
        } else {
          item.position.set(0, 0, 0);
        }
      });
    }
  }
  
  _spawnTrees() {
    const obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.TREE_MATERIAL);
    obj.scale.set(0.25, 1, 0.25);
    this._setupTrees(obj);
    obj.userData = { type: "Tree" };
    obj.name = "Tree";
    this.treesParent.add(obj);
    /*const obj = new THREE.Group();
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
    });*/

    obj.userData = { type: "Tree" };
    obj.name = "Tree";
    this._setupTrees(obj);
    this.treesParent.add(obj);
  }

  _setupTrees(obj, refZPos = 0) {
    let lane = this._randomInt(0, 2);
    if (lane == 0) {
      obj.position.set(
        -5.5,
        0,
        refZPos - 2 - this._randomFloat(10, 30)
      );
    } else if (lane == 1) {
      obj.position.set(
        5.5,
        0,
        refZPos - 2 - this._randomFloat(10, 30)
      );
    }
  }

  _randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  _spawnRoadLines() {
    const leftLine = new THREE.Mesh(
      this.ROADLINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    leftLine.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);

    leftLine.position.set(
      -2.45,
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
    
    var geo = new THREE.PlaneGeometry(5, 32, 1);
    var mat = new THREE.MeshBasicMaterial();
    var texture = new THREE.TextureLoader().load("resources/road.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set( 4, 4 );
    mat.map = texture;

    var road = new THREE.Mesh(geo, mat);
    road.position.set(0, -0.01, -10);
    road.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);


    var geo = new THREE.PlaneGeometry(32, 32, 1);
    var crash = new THREE.MeshBasicMaterial();
    var texture = new THREE.TextureLoader().load("resources/crash.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.flipY =true;
    texture.repeat.set( 5, 5 );
    crash.map = texture;
    this.Crash = new THREE.Mesh(geo, crash);
    this.Crash.position.set(0, 0.01,0 );
    this.Crash.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    this.Crash.scale.set(-1,-1,1);
    this.Crash.visible = false;
    
    this.roadLineParent.add(this.Crash);
    this.roadLineParent.add(road);
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

    if (lane == 0) {
      laneLine.position.set(
        -1.2,
        0,
        pos
      );
    } else if (lane == 1) {
      laneLine.position.set(
        0,
        0,
        pos
      );
    } else if (lane == 2) {
      laneLine.position.set(
        1.2,
        0,
        pos
      );
    }
  }

  _spawnObstacle() {
    const obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.OBSTACLE_MATERIAL);
        obj.scale.set(0.5, 0.5, 0.5);
        this._setupObstacle(obj);
        obj.userData = { type: "obstacle" };
        this.objectsParent.add(obj);

    /*const obj = new THREE.Group();
    const loader = new FBXLoader();

    let rand = this._randomInt(0, 6);
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
    });*/

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
    var geometry = new THREE.SphereGeometry(30, 100, 60);

    var material = new THREE.MeshBasicMaterial();
    material.map = new THREE.TextureLoader().load("resources/sky.jpg");
    material.side = THREE.BackSide;
    this.skydome = new THREE.Mesh(geometry, material);
    
    var geometry2 = new THREE.SphereGeometry(8.5, 100, 60);
    
    var material2 = new THREE.MeshBasicMaterial();
    material2.map = new THREE.TextureLoader().load("resources/night_sky.jpg");
    material2.side = THREE.BackSide;
    this.skydome2 = new THREE.Mesh(geometry2, material2);

    var geometry3 = new THREE.SphereGeometry(13, 100, 60);
    var material3 = new THREE.MeshBasicMaterial();
    material3.map = new THREE.TextureLoader().load(
      "resources/afternoon_sky.jpg"
    );
    material3.side = THREE.BackSide;
    this.skydome3 = new THREE.Mesh(geometry3, material3);
    this.scene.add(this.skydome);
    this.scene.add(this.skydome2);
    this.scene.add(this.skydome3);

  }

  _setupObstacle(obj, refZPos = 0) {
    let lane = this._randomInt(0, 4);
    let currZ = refZPos - 10 - this._randomFloat(0, 10);

    this.posArr[this.obstacleCounter] = currZ;

    for (let j = 0; j < this.posArr.length; j++) {
      for (let i = 0; i < this.posArr.length; i++) {
        if (this.posArr[i] - currZ - this.objectsParent.position.z < 0.75) {
          currZ = currZ - 1;
          this.posArr[this.obstacleCounter] = currZ;
        }
      }
    }

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

  _documentLogic(){
      // Start Button
      document.getElementById("start-button").onclick = () => { 
          this.running = true;
          document.getElementById("intro-panel").style.display = "none";
      };

      // Menu Selector
      document.getElementById("level-replay-button").onclick = () => {
          document.getElementById("menu-holder").style.display = "grid";
          document.getElementById("game-over-panel").style.display = "none";
      };
  
      // Difficulty - easy
      document.getElementById("easy").onclick = () => {
          this.difficulty =0;
          this._changeLevel();
          this.running = true;
          this.clock.start();
          document.getElementById("menu-holder").style.display = "none";
      };

      // Difficulty - medium
      document.getElementById("med").onclick = () => {
          this.difficulty = 1;
          this._changeLevel();
          this.running = true;
          this.clock.start();
          document.getElementById("menu-holder").style.display = "none";
      };

      // Difficulty - hard
      document.getElementById("hard").onclick = () => {
          this.difficulty = 2;
          this._changeLevel();
          this.running = true;
          this.clock.start();
          document.getElementById("menu-holder").style.display = "none";
      };

      // Replay Button
      document.getElementById("replay-button").onclick = () => {
          this.running = true;
          this.divGameOverPanel.style.display = "none";
      };

      // Pause Button
      document.getElementById("replay-button-pause").onclick = () => {
          this._reset(true);
          this.running = true;
          this.divPausePanel.style.display = "none";
      };
  
      // Resume Button
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
          } else {
              item.position.set(0, 0, this.lineParent.position.z);
          }
          });
      };
  }
}   