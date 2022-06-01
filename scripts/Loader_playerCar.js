const model = new Promise((res, rej) => {
  const loader = new FBXLoader();
  let pathStr= 'resources/car_pack/FBX/SportsCar.fbx'
  loader.load(pathStr, function (fbx) {
    fbx.scale.setScalar(0.0045);


    fbx.quaternion.setFromAxisAngle(
      new THREE.Vector3(1, 0, 0), -90*(Math.PI/180));
      

  fbx.traverse(c => {
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
  res(fbx);
    
  });
})
