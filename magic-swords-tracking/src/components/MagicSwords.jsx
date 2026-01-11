import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1200;

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const attractorPos = useRef(new THREE.Vector3(0, 0, 0));
  const explosionPower = useRef(0);
  const lastPos = useRef(new THREE.Vector3(0, 0, 0));

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      // Offset hình cầu ban đầu
      offset: new THREE.Vector3().setFromSphericalCoords(
        Math.random() * 3 + 1, 
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      ),
      friction: 0.85, // Giảm ma sát để kiếm dứt khoát hơn
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    if (handData) {
      // 1. NHẬN DIỆN NGÓN TRỎ CỰC NHẠY
      const indexTip = handData[8];
      const middleTip = handData[12];
      const ringTip = handData[16];
      // Chỉ khi ngón trỏ cao hơn hẳn ngón giữa và ngón áp út mới tính là Pointing
      const isPointing = indexTip.y < middleTip.y - 0.15 && indexTip.y < ringTip.y - 0.15;

      const targetLandmark = isPointing ? handData[8] : handData[9];
      const targetPos = new THREE.Vector3(
        (targetLandmark.x - 0.5) * -25,
        (targetLandmark.y - 0.5) * -18,
        targetLandmark.z * -20
      );

      // 2. CHỈ NỔ KHI VẬN TỐC THỰC SỰ LỚN (Ngưỡng 2.5 thay vì 1.2)
      const moveDist = targetPos.distanceTo(lastPos.current);
      if (moveDist > 2.5) {
        explosionPower.current = 1.0;
      }
      lastPos.current.copy(targetPos);

      // Cập nhật tâm hút (giảm lerp để bám cực sát)
      attractorPos.current.lerp(targetPos, 0.3);

      particles.forEach((p, i) => {
        // 3. THU NHỎ KHI CHỈ TAY (Mũi khoan năng lượng)
        // Nếu pointing, offset thu nhỏ lại 0.3, nếu không thì xòe ra 1.0
        const scaleFactor = isPointing ? 0.3 : 1.0;
        const currentOffset = p.offset.clone().multiplyScalar(scaleFactor);
        
        const target = attractorPos.current.clone().add(currentOffset);
        
        // Thêm chuyển động xoáy xung quanh tâm hút
        const orbitSpeed = isPointing ? 10 : 2;
        target.x += Math.sin(time * orbitSpeed + p.phase) * (0.2 * scaleFactor);
        target.y += Math.cos(time * orbitSpeed + p.phase) * (0.2 * scaleFactor);

        // 4. LỰC HÚT SIÊU CẤP (Magnetic Power)
        const force = new THREE.Vector3().subVectors(target, p.pos);
        
        // Lực nổ
        if (explosionPower.current > 0.1) {
          const boom = p.pos.clone().sub(attractorPos.current).normalize();
          force.add(boom.multiplyScalar(explosionPower.current * 15));
        }

        p.vel.add(force.multiplyScalar(0.2)); // Tăng lực hút lên 0.2
        p.vel.multiplyScalar(p.friction);
        p.pos.add(p.vel);

        // HIỂN THỊ
        dummy.position.copy(p.pos);
        
        // Hướng theo vận tốc (Dòng chảy)
        const lookTarget = p.pos.clone().add(p.vel);
        if (p.vel.length() > 0.05) {
            dummy.lookAt(lookTarget);
        } else {
            // Khi đứng yên hướng ra ngoài tâm
            dummy.lookAt(p.pos.clone().add(p.pos.clone().sub(attractorPos.current)));
        }
        dummy.rotation.x += Math.PI / 2;

        // Stretch cực mạnh tạo vệt trail
        const speed = p.vel.length();
        dummy.scale.set(0.3, 1 + speed * 12, 0.3);

        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
    }
    
    explosionPower.current *= 0.92; // Nổ xong thu lại nhanh hơn
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <coneGeometry args={[0.015, 1.2, 3]} />
      <meshStandardMaterial 
        color={explosionPower.current > 0.5 ? "#ffffff" : "#00ffff"} 
        emissive={explosionPower.current > 0.5 ? "#00ffff" : "#0044ff"} 
        emissiveIntensity={explosionPower.current > 0.5 ? 20 : 5} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}