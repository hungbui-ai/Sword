import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1200;

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Tâm trọng lực hiện tại (Current Attractor)
  const attractorPos = useRef(new THREE.Vector3(0, 0, 0));
  const explosionPower = useRef(0);
  const prevPos = useRef(new THREE.Vector3(0, 0, 0));

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0),
      vel: new THREE.Vector3(),
      offset: new THREE.Vector3().setFromSphericalCoords(
        Math.random() * 4 + 1, 
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      ),
      friction: 0.92 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    if (handData) {
      // LOGIC: QUYẾT ĐỊNH TÂM TRỌNG LỰC
      // So sánh độ cao ngón trỏ (8) với ngón giữa (12) và ngón áp út (16)
      const indexTip = handData[8];
      const middleTip = handData[12];
      const isPointing = indexTip.y < middleTip.y - 0.1; // Trong MediaPipe, y nhỏ hơn là cao hơn

      let targetLandmark = isPointing ? handData[8] : handData[9]; // 8: Trỏ, 9: Lòng bàn tay

      const targetX = (targetLandmark.x - 0.5) * -25;
      const targetY = (targetLandmark.y - 0.5) * -18;
      const targetZ = targetLandmark.z * -20;
      
      const newPos = new THREE.Vector3(targetX, targetY, targetZ);
      
      // Tính vận tốc tay để kích nổ
      if (newPos.distanceTo(prevPos.current) > 1.2) explosionPower.current = 1.0;
      prevPos.current.copy(newPos);

      // Cập nhật tâm trọng lực với độ mượt (lerp)
      attractorPos.current.lerp(newPos, 0.15);
    }
    
    explosionPower.current *= 0.96;

    particles.forEach((p, i) => {
      // Điểm đích = Tâm trọng lực hiện tại + Offset cầu
      const target = attractorPos.current.clone().add(p.offset);
      
      // Thêm nhiễu động nhẹ cho dòng chảy
      target.x += Math.sin(time * 2 + i) * 0.5;
      target.y += Math.cos(time * 1.5 + i) * 0.5;

      const force = new THREE.Vector3().subVectors(target, p.pos);
      const dist = force.length();

      // Lực hút dòng chảy
      force.normalize().multiplyScalar(dist * 0.025);
      
      // Hiệu ứng nổ
      if (explosionPower.current > 0.1) {
        const boom = p.pos.clone().sub(attractorPos.current).normalize();
        force.add(boom.multiplyScalar(explosionPower.current * 3));
      }

      p.vel.add(force);
      p.vel.multiplyScalar(p.friction);
      p.pos.add(p.vel);

      // Hiển thị
      dummy.position.copy(p.pos);
      
      // Hướng theo vận tốc
      const lookTarget = p.pos.clone().add(p.vel);
      if (p.vel.length() > 0.01) dummy.lookAt(lookTarget);
      dummy.rotation.x += Math.PI / 2;

      // Stretch
      const speed = p.vel.length();
      dummy.scale.set(0.4, 1 + speed * 10, 0.4);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <coneGeometry args={[0.01, 1.4, 4]} />
      <meshStandardMaterial 
        color={explosionPower.current > 0.5 ? "#ffaa00" : "#00ffff"} 
        emissive={explosionPower.current > 0.5 ? "#ff4400" : "#0088ff"} 
        emissiveIntensity={3 + explosionPower.current * 15} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}