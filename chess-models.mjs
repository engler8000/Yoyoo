// Original procedural Staunton-style models: turned bases and carved horse heads.
export function createPieceFactory(T,scene,mesh){
 const materials={w:new T.MeshStandardMaterial({color:'#d8aa6b',metalness:.08,roughness:.26}),b:new T.MeshStandardMaterial({color:'#252329',metalness:.15,roughness:.25})};
 const profiles={
  p:[[0,0],[.32,0],[.35,.06],[.35,.12],[.29,.17],[.28,.21],[.22,.24],[.21,.28],[.15,.31],[.12,.49],[.15,.53],[.19,.55],[.19,.6],[.13,.64],[0,.64]],
  tall:[[0,0],[.33,0],[.36,.06],[.36,.12],[.3,.17],[.29,.21],[.23,.24],[.22,.29],[.17,.34],[.12,.58],[.13,.66],[.19,.69],[.21,.73],[.21,.78],[.16,.8],[0,.8]]
 };
 return function piece(type,color,x,z){const g=new T.Group();g.position.set(x,0,z);scene.add(g);const m=materials[color],points=profiles[type==='p'?'p':'tall'].map(([r,y])=>new T.Vector2(r,y));mesh(new T.LatheGeometry(points,24),m,0,0,0,g);
   const band=(y,r)=>mesh(new T.TorusGeometry(r,.025,6,24),m,0,y,0,g).rotation.x=Math.PI/2;
   band(.17,.29);band(.25,.22);
   if(type==='p'){mesh(new T.SphereGeometry(.18,20,14),m,0,.75,0,g);band(.57,.18);}
   if(type==='r'){mesh(new T.CylinderGeometry(.25,.2,.3,20),m,0,.8,0,g);mesh(new T.CylinderGeometry(.3,.27,.12,20),m,0,.99,0,g);for(let i=0;i<6;i++){const a=i*Math.PI/3;const tooth=mesh(new T.BoxGeometry(.12,.17,.12),m,Math.cos(a)*.235,1.105,Math.sin(a)*.235,g);tooth.rotation.y=-a;}band(.96,.28);}
   if(type==='b'){const head=[[0,0],[.11,.03],[.19,.14],[.2,.22],[.15,.33],[.06,.43],[0,.5]].map(([r,y])=>new T.Vector2(r,y));mesh(new T.LatheGeometry(head,20),m,0,.77,0,g);mesh(new T.SphereGeometry(.045,12,8),m,0,1.28,0,g);const slit=mesh(new T.BoxGeometry(.026,.23,.016),new T.MeshStandardMaterial({color:color==='w'?'#70411f':'#08080d',roughness:.8}),.02,1.07,-.165,g);slit.rotation.z=-.5;}
   if(type==='q'){mesh(new T.CylinderGeometry(.27,.16,.26,20),m,0,.9,0,g);band(.8,.2);band(1.04,.26);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;mesh(new T.SphereGeometry(.055,10,8),m,Math.cos(a)*.24,1.1,Math.sin(a)*.24,g);}mesh(new T.SphereGeometry(.075,14,10),m,0,1.12,0,g);}
   if(type==='k'){mesh(new T.SphereGeometry(.21,18,12),m,0,.91,0,g);band(1.01,.17);mesh(new T.BoxGeometry(.09,.4,.09),m,0,1.16,0,g);mesh(new T.BoxGeometry(.29,.085,.09),m,0,1.22,0,g);}
   if(type==='n'){
     const shape=new T.Shape();shape.moveTo(-.22,.68);shape.bezierCurveTo(-.21,.82,-.1,.94,-.16,1.08);shape.lineTo(-.18,1.2);shape.lineTo(-.09,1.32);shape.lineTo(-.04,1.24);shape.lineTo(.04,1.31);shape.lineTo(.1,1.19);shape.bezierCurveTo(.18,1.15,.21,1.08,.22,1.02);shape.lineTo(.34,.88);shape.quadraticCurveTo(.36,.82,.28,.81);shape.lineTo(.15,.88);shape.lineTo(.08,.96);shape.quadraticCurveTo(-.02,.88,.11,.79);shape.lineTo(.22,.67);shape.closePath();
     const horse=mesh(new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025}),m,0,0,-.1,g);horse.rotation.y=Math.PI/2;
     const eye=new T.MeshStandardMaterial({color:color==='w'?'#2b1c14':'#a9a59a',roughness:.32});mesh(new T.SphereGeometry(.025,10,8),eye,-.13,1.075,-.1,g);mesh(new T.SphereGeometry(.025,10,8),eye,.13,1.075,-.1,g);
     for(let i=0;i<5;i++){const notch=mesh(new T.BoxGeometry(.23,.025,.07),m,0,.9+i*.055,.12-i*.02,g);notch.rotation.x=-.3;}band(.72,.22);
   }
   return g;
 };
}
