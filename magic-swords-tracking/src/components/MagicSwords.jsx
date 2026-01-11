import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 600; // Tăng số lượng để nhìn cho sướng
const JOINTS = 21;

export default function MagicSwords({ handLandmarks }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Khởi tạo các thuộc tính vật lý cho từng thanh kiếm
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      position: new THREE.Vector3(Math.random() * 20 - 10, Math.random() * 20 - 10, 0),
      velocity: new THREE.Vector3(),
      accel: new THREE.Vector3(),
      jointIdx: Math.floor(Math.random() * JOINTS), // Bám theo khớp ngẫu nhiên
      mass: 0.5 + Math.random() * 1.5, // Khối lượng khác nhau tạo quán tính khác nhau
      randomOffset: new THREE.Vector3(
        (Math.random() - 0.5) * 8, // Tăng độ văng cực rộng
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ),
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  // Vị trí các khớp tay trong không gian 3D
  const jointTargets = useMemo(() => Array.from({ length: JOINTS }, () => new THREE.Vector3()), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // Cập nhật vị trí các khớp tay từ MediaPipe
    if (handLandmarks) {
      handLandmarks.forEach((pt, i) => {
        jointTargets[i].set((0.5 - pt.x) * 25, (0.5 - pt.y) * 18, pt.z * -20);
      });
    }

    particles.forEach((p, i) => {
      const target = new THREE.Vector3();
      
      if (handLandmarks) {
        // LỰC HÚT: Mỗi thanh kiếm bị hút về khớp tay của nó + một khoảng cách ngẫu nhiên
        target.copy(jointTargets[p.jointIdx]).add(p.randomOffset);
        
        // Thêm một chút chuyển động "bơi" tự do
        target.x += Math.sin(time + p.phase) * 2;
        target.y += Math.cos(time + p.phase) * 2;
      } else {
        // Khi không có tay, bay tự do lơ lửng
        target.set(Math.sin(time * 0.5 + p.phase) * 12, Math.cos(time * 0.5 + p.phase) * 8, 0);
      }

      // Logic Vật Lý Quán Tính:
      // 1. Tính toán lực hút (Vector từ kiếm tới tay)
      const force = new THREE.Vector3().subVectors(target, p.position);
      const dist = force.length();
      
      // Càng xa hút càng mạnh, nhưng giới hạn lại để không bị giật
      force.normalize().multiplyScalar(dist * 0.05); 
      
      // 2. Cập nhật gia tốc và vận tốc
      p.accel.copy(force).divideScalar(p.mass);
      p.velocity.add(p.accel);
      
      // 3. MA SÁT (Damping): Quan trọng để kiếm không bay mất tiêu (0.92 là mức rất mượt)
      p.velocity.multiplyScalar(0.92); 
      
      // 4. Cập nhật vị trí
      p.position.add(p.velocity);

      // Thiết lập hiển thị
      dummy.position.copy(p.position);
      
      // Hướng kiếm: Luôn quay theo hướng di chuyển (giống mũi tên)
      const lookAtPos = new THREE.Vector3().addVectors(p.position, p.velocity);
      dummy.lookAt(lookAtPos);
      dummy.rotation.x += Math.PI / 2;

      // Kéo dãn theo vận tốc (Quán tính thị giác)
      const speed = p.velocity.length();
      dummy.scale.set(1, 1 + speed * 2, 1);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <cylinderGeometry args={[0.01, 0.03, 1.2, 3]} />
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#00fff2" 
        emissiveIntensity={15} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}