import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800;
const JOINTS = 21;

// Hàm phụ trợ: Tạo điểm ngẫu nhiên trên mặt cầu (Spherical distribution)
const randomSpherePoint = (radius) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  // Đảm bảo phân bố đều 3D
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // 1. KHỞI TẠO VẬT LÝ HẠT
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      position: randomSpherePoint(15), // Bắt đầu ở dạng cầu
      velocity: new THREE.Vector3(),
      jointIdx: Math.floor(Math.random() * JOINTS),
      // OFFSET HÌNH CẦU: Quan trọng để không bị Donut
      offset: randomSpherePoint(Math.random() * 3 + 1), 
      mass: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  const jointPositions = useMemo(() => Array.from({ length: JOINTS }, () => new THREE.Vector3()), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // 2. TÍNH TOÁN ĐỘ MỞ BÀN TAY (GESTURE)
    let openness = 1.0;
    if (handData) {
      const d = new THREE.Vector3(handData[0].x, handData[0].y, 0)
                .distanceTo(new THREE.Vector3(handData[12].x, handData[12].y, 0));
      openness = THREE.MathUtils.mapLinear(d, 0.15, 0.4, 0.1, 1.2);
      openness = THREE.MathUtils.clamp(openness, 0.1, 1.5);

      handData.forEach((pt, i) => {
        // Tăng hệ số Z để tạo độ sâu 3D rõ ràng hơn
        jointPositions[i].set((pt.x - 0.5) * 24, (pt.y - 0.5) * -18, pt.z * -25);
      });
    }

    // 3. VÒNG LẶP VẬT LÝ
    particles.forEach((p, i) => {
      const joint = jointPositions[p.jointIdx];
      const target = new THREE.Vector3();

      if (handData) {
        // Mục tiêu = Vị trí khớp + Offset hình cầu (được scale theo độ mở tay)
        target.copy(joint).add(p.offset.clone().multiplyScalar(openness));
        
        // Thêm nhiễu động 3D
        const noiseScale = openness * 0.5;
        target.x += Math.sin(time * 3 + p.phase) * noiseScale;
        target.y += Math.cos(time * 2 + p.phase) * noiseScale;
        target.z += Math.sin(time * 4 + p.phase) * noiseScale; // Nhiễu động trục Z mạnh hơn
      } else {
        // Bay lơ lửng dạng cầu khi không có tay
        const idleSphere = randomSpherePoint(10 + Math.sin(time + p.phase)*2);
        target.copy(idleSphere);
      }

      // Lực hút đàn hồi (Spring force)
      const force = new THREE.Vector3().subVectors(target, p.position);
      const dist = force.length();
      force.normalize().multiplyScalar(dist * 0.05); // Lực hút mạnh hơn chút
      
      p.velocity.add(force.divideScalar(p.mass));
      p.velocity.multiplyScalar(0.91); // Ma sát cao để chuyển động dứt khoát
      p.position.add(p.velocity);

      // HIỂN THỊ
      dummy.position.copy(p.position);
      const velocityDir = p.position.clone().add(p.velocity);
      dummy.lookAt(velocityDir);
      dummy.rotation.x += Math.PI / 2;

      // Kéo dãn theo tốc độ
      const speed = p.velocity.length();
      const stretch = 1 + speed * 4;
      // Scale nhỏ lại khi nắm tay
      const baseScale = openness * 0.4 + 0.6;
      dummy.scale.set(baseScale, stretch * baseScale, baseScale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      {/* HÌNH NÓN CỰC MẢNH (Needle shape) */}
      <coneGeometry args={[0.008, 1.5, 4]} /> 
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#00fff2" 
        // GIẢM ĐỘ SÁNG ĐỂ TRÁNH CHÓI
        emissiveIntensity={3} 
        toneMapped={false}
        roughness={0.1}
        metalness={0.8}
      />
    </instancedMesh>
  );
}