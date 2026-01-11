import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1000; // Số lượng lớn để tạo thành dòng chảy liên tục

// Hàm tạo "tạp nhiễu 3D" giả lập (Curl Noise approximation)
// Giúp kiếm chuyển động uốn lượn như khói/nước
const curlNoise = (p, time) => {
  const scale = 0.5; // Độ lớn của xoáy
  const x = Math.sin(p.y * scale + time) * Math.cos(p.z * scale + time * 0.5);
  const y = Math.sin(p.z * scale + time) * Math.cos(p.x * scale + time * 0.5);
  const z = Math.sin(p.x * scale + time) * Math.cos(p.y * scale + time * 0.5);
  return new THREE.Vector3(x, y, z).multiplyScalar(0.2); // Sức mạnh của dòng chảy
};

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Vị trí trung tâm của bàn tay (để làm điểm hút chính)
  const handCenter = useRef(new THREE.Vector3(0, 0, 0));
  // Vận tốc của tay (để tạo quán tính)
  const handVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const prevHandPos = useRef(new THREE.Vector3(0, 0, 0));

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => ({
      position: new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*20, 0),
      velocity: new THREE.Vector3(),
      // Mỗi hạt có một "offset" riêng để không tụ vào cùng 1 điểm
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2
      ),
      speed: 0.5 + Math.random(), // Tốc độ trôi khác nhau
      life: Math.random(), // Để tạo hiệu ứng nhấp nháy
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const dt = 0.016; // Time step cố định cho vật lý ổn định

    // 1. CẬP NHẬT VỊ TRÍ TAY & VẬN TỐC
    let hasHand = false;
    if (handData) {
      hasHand = true;
      // Tính trung tâm bàn tay (trung bình cộng cổ tay và ngón giữa)
      const x = (handData[9].x - 0.5) * 22; // Landmark 9 là khớp giữa bàn tay
      const y = (handData[9].y - 0.5) * -16;
      const z = handData[9].z * -20;
      
      const currentPos = new THREE.Vector3(x, y, z);
      
      // Tính vận tốc tay: (Mới - Cũ) / thời gian
      handVelocity.current.subVectors(currentPos, prevHandPos.current).multiplyScalar(0.1);
      prevHandPos.current.copy(currentPos);
      
      // Di chuyển điểm hút về phía tay (có độ trễ để mềm mại)
      handCenter.current.lerp(currentPos, 0.1);
    }

    particles.forEach((p, i) => {
      // 2. LỰC HÚT (Attraction Force)
      // Thay vì hút vào từng ngón tay, tất cả bị hút vào "dòng chảy" quanh bàn tay
      const target = handCenter.current.clone().add(p.offset);
      
      // Nếu tay di chuyển nhanh, dòng chảy bị kéo dãn ra sau (Trail effect)
      if (hasHand) {
        target.sub(handVelocity.current.clone().multiplyScalar(10)); 
      }

      const force = new THREE.Vector3().subVectors(target, p.position);
      const dist = force.length();

      // Hút càng mạnh khi càng xa, nhưng rất nhẹ khi ở gần -> Tạo độ bồng bềnh
      force.normalize().multiplyScalar(dist * 0.05);

      // 3. CỘNG LỰC DÒNG CHẢY (Flow Noise)
      // Đây là bí mật: Cộng thêm vector xoáy vào lực hút
      const noise = curlNoise(p.position, time * 1.5);
      
      // Tổng hợp lực: Hút về tay + Nhiễu động dòng chảy
      p.velocity.add(force);
      p.velocity.add(noise);

      // 4. MA SÁT (Damping)
      // Giúp kiếm không bay vèo vèo mất kiểm soát. 
      // Giá trị 0.9 tạo cảm giác như bơi trong nước.
      p.velocity.multiplyScalar(0.92);

      // Cập nhật vị trí
      p.position.add(p.velocity);

      // 5. HIỂN THỊ
      dummy.position.copy(p.position);
      
      // Hướng: Luôn hướng theo chiều dòng chảy (Velocity)
      // Cộng thêm position để lookAt tính đúng hướng trong không gian
      const lookTarget = p.position.clone().add(p.velocity);
      dummy.lookAt(lookTarget);
      dummy.rotation.x += Math.PI / 2; // Xoay lại cho đúng trục nón

      // Scale: Kéo dãn cực đại khi di chuyển nhanh (Stretch)
      const speed = p.velocity.length();
      const stretch = 1 + speed * 6; // Kéo dài hơn nữa
      const thickness = Math.max(0.3, 1 - speed * 0.5); // Càng nhanh càng mảnh
      
      dummy.scale.set(thickness, stretch, thickness);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      {/* Hình nón cực mảnh và dài */}
      <coneGeometry args={[0.015, 1.0, 4]} /> 
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#00eeff" 
        emissiveIntensity={4} 
        toneMapped={false} 
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}