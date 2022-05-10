//import model from "./Loader.js"
class Game {
  OBSTACLE_PREFAB = new THREE.BoxBufferGeometry(1, 1, 1);
  OBSTACLE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  TREE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x0000ff });


  LANELINE_PREFAB = new THREE.PlaneGeometry(0.09, 1); 
  LANELINE_MATERIAL = new THREE.MeshBasicMaterial({color: 0xffffff});

  ROADLINE_PREFAB = new THREE.PlaneGeometry(0.09, 32);

  COLLOSION_THRESHOLD = 0.1;

  constructor(scene, camera) {
    this.speedZ = 5; 
    this.speedX =0;
    this.translateX =0;
    this.score =0;

    this._initializeScene(scene, camera);

    //this.prevZ =0;

    document.addEventListener("keydown", this._keydown.bind(this));
    document.addEventListener("keyup", this._keyup.bind(this));
  }

  update() {
    this.time += this.clock.getDelta();
    
    this.translateX += this.speedX*-0.05;

    this._updateGrid();
    this._checkCollisions();
    this._updateInfoPanel();
  }

  _keydown(event) {
    let newSpeedX;
    switch(event.key){
      case 'ArrowLeft':
        newSpeedX = -1.0;
        break;
      case 'ArrowRight':
        newSpeedX = 1.0;
        break;
      case 'a':
        newSpeedX = -1.0;
        break;
      case 'A':
        newSpeedX = -1.0;
        break;
      case 'd':
        newSpeedX = 1.0;
        break;
      case 'D':
        newSpeedX = 1.0;
        break;
      default:
        return;
    }

    this.speedX = newSpeedX;

  }

  _keyup() {
    this.speedX = 0;
  }

  _updateGrid() {
    this.grid.material.uniforms.time.value = this.time;

    this.objectsParent.position.z = this.speedZ * this.time; //multiply by something to increase speed  
    this.lineParent.position.z = this.speedZ*this.time;
    this.treesParent.position.z = this.speedZ * this.time;


    this.grid.material.uniforms.translateX.value = this.translateX;

    if(this.grid.material.uniforms.translateX.value < 2.15 && this.grid.material.uniforms.translateX.value > -2.15 ){
    //console.log(this.grid.material.uniforms.translateX.value)
    this.objectsParent.position.x = this.translateX;    
    this.lineParent.position.x = this.translateX;
    this.treesParent.position.x = this.translateX;
    this.roadLineParent.position.x = this.translateX;
  }
    this.objectsParent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZPos = child.position.z + this.objectsParent.position.z;
        if (childZPos > 3) {
          if (child.userData.type == "obstacle") {
            this._setupObstacle(
              child,
              -this.objectsParent.position.z,
              this._randomInt(0, 4)
            );
          }
        }
      }
    });

    this.lineParent.traverse((child) =>{
      if(child instanceof THREE.Mesh){
        const childZPos = child.position.z + this.objectsParent.position.z;
        if (childZPos > 3) {
              this._setupLaneLines(
              child,
              child.userData.type,
              -this.objectsParent.position.z
              );          
        }
      }
    });

    this.treesParent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZPos = child.position.z + this.objectsParent.position.z;
        if (childZPos > 3) {
            this._setupTrees(
              child,
              -this.objectsParent.position.z,
              this._randomInt(0, 4)
            );
        }
      }
    });
    

  }

  _checkCollisions() {
    this.objectsParent.traverse((child) =>{
      if(child instanceof THREE.Mesh){
          const childZPos = child.position.z + this.objectsParent.position.z;
          //console.log(this.objectsParent.z);
          const thresholdX = this.COLLOSION_THRESHOLD +child.scale.x/2;
          const thresholdZ = this.COLLOSION_THRESHOLD + child.scale.z/2;
         // console.log(thresholdX,thresholdZ);
          //console.log(thresholdX, thresholdZ , childZPos , Math.abs(child.position.x -(-this.translateX)));
          if(childZPos > -thresholdZ && Math.abs(child.position.x + this.translateX) < thresholdX){
            console.log("collison");
          }
        }
      }
    );
  }

  _updateInfoPanel() {}

  _gameOver() {}

  _createPlayerCar(scene) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.scale.set(0.5, 0.5, 0.5);
    this.cube.translateY(0.75);
    scene.add(this.cube); 
  /*  model.then(object =>{
      scene.add(object);
    })*/
  }

  _createGrid(scene) {
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
      moveableX.push(0,0,1,1);
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

    scene.add(this.grid);
    this.time = 0;
    this.clock = new THREE.Clock();
  }

  _initializeScene(scene, camera) {
    this._createPlayerCar(scene);
    this._createGrid(scene);
    this.objectsParent = new THREE.Group();
    scene.add(this.objectsParent);

    this.lineParent = new THREE.Group();
    scene.add(this.lineParent);
  
    this.treesParent = new THREE.Group();
    scene.add(this.treesParent);

    this.roadLineParent = new THREE.Group();
    scene.add(this.roadLineParent);

    this._spawnRoadLines();

    for(let i = 0; i <8 ;i ++){
      this._spawnTrees();
    }

    for (let i = 0; i < 7; i++) {
      this._spawnObstacle();
    }

    let pos1 =0;
    let pos2= 0;
    let pos3= 0;
    for(let i =0; i<12 ;i ++){
        if(i == 0 || i ==1 || i == 2 || i == 3){
            this.lane = 0;
            this._spawnLaneLines(this.lane,pos1);
            pos1 = pos1+1;
            
        }else if(i == 4 || i == 5 || i ==6 || i ==7 ){
            this.lane =1;
            this._spawnLaneLines(this.lane,pos2);
            pos2 = pos2+1;

        }else{
            this.lane = 2;
            this._spawnLaneLines(this.lane,pos3);
            pos3 = pos3+1;
        }
    }
    camera.rotateX((-20 * Math.PI) / 180);
    camera.position.set(0, 1.5, 2);


    //camera.rotateX((-75 * Math.PI) / 180); //top view .. needs work
    //camera.position.set(0, 8,2);
  }

  _spawnTrees(){
    const obj = new THREE.Mesh(this.OBSTACLE_PREFAB, this.TREE_MATERIAL);
    obj.scale.set(0.25, 1, 0.25);
    this._setupTrees(obj);
    obj.userData = { type: "Tree" };
    this.treesParent.add(obj);
  }

  _setupTrees(obj, refZPos = 0){
      let lane = this._randomInt(0, 2);
      //console.log(lane);
      if (lane == 0) {
        obj.position.set(
          -5.5,
          obj.scale.y * 0.5,
          refZPos-2 -this._randomFloat(10, 17)
       );
      } else if (lane == 1) {
         obj.position.set(
          5.5,
          obj.scale.y * 0.5,
          refZPos-2 - this._randomFloat(10, 17)
        );
     }
}

_spawnRoadLines(){
  const leftLine = new THREE.Mesh(this.ROADLINE_PREFAB, this.LANELINE_MATERIAL);
  leftLine.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI);

  leftLine.position.set(
    -2.45,
    leftLine.scale.y*0.5,
    -1
  )

  this.roadLineParent.add(leftLine);

  const rightLine = new THREE.Mesh(this.ROADLINE_PREFAB, this.LANELINE_MATERIAL);
  rightLine.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI);

  rightLine.position.set(
    2.45,
    rightLine.scale.y*0.5,
    -1
  )

  this.roadLineParent.add(rightLine);
}

  _spawnLaneLines(lane,pos) {
        const plane = new THREE.Mesh(this.LANELINE_PREFAB, this.LANELINE_MATERIAL);
        plane.rotation.set(-Math.PI/2, Math.PI/2000, Math.PI);
        plane.userData = {type: lane};
        this._setupLaneLines(plane, lane,0,pos);
        this.lineParent.add(plane);
    
  }

  _setupLaneLines(laneLine, lane, refZPos =0, pos= refZPos-12 ){
    if(pos == 0){
      pos = refZPos;
    }else if(pos == 1){
      pos = refZPos -4;
    }else if(pos == 2){
      pos = refZPos -8;
    }else if(pos == 3){
      pos = refZPos -12;
    }
    //console.log(pos);

    if(lane == 0){
        laneLine.position.set(
          -1.2,
          laneLine.scale.y*0.5,
          //refZPos - 16
          pos
        );
      }else if(lane ==1){
        laneLine.position.set(
          0,
          laneLine.scale.y*0.5,
          pos
        );
      }else if(lane == 2){
        laneLine.position.set(
          1.2,
          laneLine.scale.y*0.5,
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
  }

  _setupObstacle(obj, refZPos = 0) {
    let lane = this._randomInt(0, 4);

    //let currZ = refZPos - 16 - this._randomFloat(0,16);
    // let dist = this.prevZ - currZ;

    /*while(dist <= 0 ){
            currZ = refZPos - 16 - this._randomFloat(0,16);
            dist = this.prevZ - currZ;
        }*/ //potential lag point

    // console.log(dist);

    if (lane == 0) {
      //1st lane from left
      obj.position.set(
        -2,
        obj.scale.y * 0.5,
        refZPos - 16 - this._randomFloat(10, 16)
        //currZ
      );
      //console.log(refZPos);
    } else if (lane == 1) {
      //2nd lane from left
      obj.position.set(
        -0.75,
        obj.scale.y * 0.5,
        //refZPos - 16 - this._randomFloat(0,4)
        refZPos - 16 - this._randomFloat(0, 16)
        //currZ
      );
    } else if (lane == 2) {
      obj.position.set(
        0.75,
        obj.scale.y * 0.5,
        //refZPos - 16 - this._randomFloat(0,4)
        refZPos - 16 - this._randomFloat(10, 16)
        //currZ
      );
    } else if (lane == 3) {
      obj.position.set(
        2,
        obj.scale.y * 0.5,
        //refZPos - 16 - this._randomFloat(0,4)
        refZPos - 16 - this._randomFloat(0, 16)
        //currZ
      );
    }
    obj.translateY(0.4);
    //this.prevZ = currZ;
  }



  _randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  _randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

}

