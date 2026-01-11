import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1000; 

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Điểm hút mượt (Smooth Attractor)
  const smoothAttractor = useRef(new THREE.Vector3(0, 0, 0));
  const isGrip = useRef(false);

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      // Mỗi hạt có một quỹ đạo xoay riêng để tạo cảm giác dòng nước
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 3 + 1,
      speed: 0.02 + Math.random() * 0.05,
      friction: 0.9 + Math.random() * 0.05,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    if (handData) {
      // 1. NHẬN DIỆN NẮM TAY (GRIP)
      // Tính khoảng cách từ đầu các ngón đến lòng bàn tay (landmark 0)
      const tips = [8, 12, 16, 20];
      const avgDist = tips.reduce((acc, idx) => {
        const d = Math.sqrt(
          Math.pow(handData[idx].x - handData[0].x, 2) +
          Math.pow(handData[idx].y - handData[0].y, 2)
        );
        return acc + d;
      }, 0) / 4;

      isGrip.current = avgDist < 0.15; // Ngưỡng nắm tay

      // 2. TÂM HÚT MƯỢT
      const targetPos = new THREE.Vector3(
        (handData[9].x - 0.5) * -25,
        (handData[9].y - 0.5) * -18,
        handData[9].z * -20
      );
      // Lerp cực thấp (0.1) để tạo độ trễ như nước, giảm lag do tay rung
      smoothAttractor.current.lerp(targetPos, 0.1);
    }

    particles.forEach((p, i) => {
      // 3. LOGIC DÒNG NƯỚC & QUẢ CẦU
      p.angle += p.speed;
      
      // Nếu nắm tay: Thu nhỏ bán kính và tăng tốc độ xoay để tạo quả cầu
      const targetRadius = isGrip.current ? 1.5 : 4.0;
      p.radius = THREE.MathUtils.lerp(p.radius, targetRadius, 0.05);

      // Tính toán điểm đích dựa trên quỹ đạo xoay xung quanh tâm hút
      const target = new THREE.Vector3(
        smoothAttractor.current.x + Math.cos(p.angle + time) * p.radius,
        smoothAttractor.current.y + Math.sin(p.angle + time * 0.8) * p.radius,
        smoothAttractor.current.z + Math.sin(p.angle + time * 0.5) * p.radius
      );

      // Thêm lực hút "mềm"
      const force = target.sub(p.pos).multiplyScalar(0.02);
      p.vel.add(force);
      p.vel.multiplyScalar(p.friction);
      p.pos.add(p.vel);

      // 4. HIỂN THỊ
      dummy.position.copy(p.pos);
      
      // Hướng: Luôn hướng theo dòng chảy của nước (Vận tốc)
      const lookAtTarget = p.pos.clone().add(p.vel);
      if (p.vel.length() > 0.01) dummy.lookAt(lookAtTarget);
      dummy.rotation.x += Math.PI / 2;

      // Độ mảnh: Nắm tay thì kiếm ngắn lại (như giọt nước), xòe tay thì dài ra (như dòng chảy)
      const s = isGrip.current ? 0.5 : 1.2;
      dummy.scale.set(0.4, s + p.vel.length() * 5, 0.4);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      {/* Dùng khối hình nón mảnh để trông như tia nước */}
      <coneGeometry args={[0.012, 1, 3]} /> 
      <meshStandardMaterial 
        color={isGrip.current ? "#0099ff" : "#00ffff"} 
        emissive={isGrip.current ? "#0033ff" : "#00ffff"} 
        emissiveIntensity={isGrip.current ? 10 : 2} 
        transparent
        opacity={0.8}
        toneMapped={false} 
      />
    </instancedMesh>
  );
}