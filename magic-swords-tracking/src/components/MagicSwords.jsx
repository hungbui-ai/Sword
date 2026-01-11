import React, { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800;
const JOINTS = 21;

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [isExploding, setIsExploding] = useState(false);
  const explosionTime = useRef(0);

  // Vị trí khớp mượt
  const jointPos = useMemo(() => Array.from({ length: JOINTS }, () => new THREE.Vector3()), []);

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0),
      vel: new THREE.Vector3(),
      jointIdx: i % JOINTS,
      offset: new THREE.Vector3().setFromSphericalCoords(
        Math.random() * 3 + 0.5, 
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      ),
      speed: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    if (handData) {
      handData.forEach((pt, i) => {
        const x = (pt.x - 0.5) * -24; 
        const y = (pt.y - 0.5) * -18;
        const z = pt.z * -20;
        jointPos[i].lerp(new THREE.Vector3(x, y, z), 0.2);
      });

      // LOGIC NỔ: Nếu vận tốc tay cực nhanh hoặc thay đổi vị trí đột ngột
      // Ở đây tôi dùng phím Space để bạn test trước, hoặc logic khoảng cách
      // (Giả lập nổ khi đưa tay lại gần tâm)
      const distToCenter = jointPos[9].length(); 
      if (distToCenter < 1 && !isExploding) {
        setIsExploding(true);
        explosionTime.current = time;
        setTimeout(() => setIsExploding(false), 1000);
      }
    }

    particles.forEach((p, i) => {
      const joint = jointPos[p.jointIdx];
      let target = new THREE.Vector3().copy(joint).add(p.offset);

      // Hiệu ứng Nổ
      if (isExploding) {
        const elapsed = time - explosionTime.current;
        const explodeDir = p.pos.clone().normalize().multiplyScalar(20 * (1 - elapsed));
        target.add(explodeDir);
      }

      const force = new THREE.Vector3().subVectors(target, p.pos);
      
      // Bản này giảm "tật" bằng cách dùng lực hút Elastic (Lò xo)
      p.vel.add(force.multiplyScalar(0.08)); 
      p.vel.multiplyScalar(0.92); // Ma sát vừa phải để có độ trôi
      p.pos.add(p.vel);

      dummy.position.copy(p.pos);
      
      // Hướng: Chĩa theo vận tốc + hướng tâm
      const lookAtTarget = p.pos.clone().add(p.vel).add(p.pos.clone().sub(joint).normalize().multiplyScalar(0.5));
      dummy.lookAt(lookAtTarget);
      dummy.rotation.x += Math.PI / 2;

      // Stretch
      const speed = p.vel.length();
      dummy.scale.set(0.6, 1 + speed * 4, 0.6);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <coneGeometry args={[0.012, 1.2, 4]} />
      <meshStandardMaterial 
        color={isExploding ? "#ffcc00" : "#00ffff"} 
        emissive={isExploding ? "#ff4400" : "#00ffff"} 
        emissiveIntensity={isExploding ? 10 : 3} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}