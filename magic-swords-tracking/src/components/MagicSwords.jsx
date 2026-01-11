import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Giảm số lượng xuống mức an toàn cho đa số thiết bị
const COUNT = 500; 

export default function MagicSwords({ handData }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Dùng Vector3 để làm mượt chuyển động tay
  const target = useMemo(() => new THREE.Vector3(0,0,0), []);

  // Tạo dữ liệu hạt phong phú hơn
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => ({
      t: Math.random() * 100, // Thời gian riêng
      factor: 2 + Math.random() * 5, // Bán kính quỹ đạo
      speed: 0.01 + Math.random() * 0.02, // Tốc độ riêng
      offset: Math.random() * Math.PI * 2, // Góc lệch pha
      myY: Math.random() * 2 - 1, // Độ cao ngẫu nhiên
    }));
  }, []);

  // Tạo geometry và material một lần duy nhất bên ngoài useFrame
  const geometry = useMemo(() => new THREE.BoxGeometry(0.04, 1, 0.02), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#20ff80",
    emissive: "#40ffaa",
    emissiveIntensity: 4,
    roughness: 0.1,
    metalness: 0.8,
    toneMapped: false // Quan trọng để màu phát sáng rực rỡ
  }), []);


  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    // 1. Làm mượt vị trí tay (Lerp)
    let tx = 0, ty = 0;
    if (handData) {
       tx = (handData.x - 0.5) * -22; // Mở rộng phạm vi di chuyển
       ty = (handData.y - 0.5) * -16;
    }
    // Di chuyển điểm target từ từ đến vị trí tay mới (độ trễ 0.1)
    target.lerp(new THREE.Vector3(tx, ty, 0), 0.1);

    particles.forEach((p, i) => {
      p.t += p.speed;
      
      // CÔNG THỨC TOÁN HỌC TẠO ĐỘ "ẢO"
      // Kết hợp nhiều sóng sin/cos để tạo chuyển động hữu cơ (organic)
      const angle = p.offset + p.t * 0.5;
      // Bán kính thay đổi theo thời gian
      const radius = p.factor + Math.sin(time * 2 + p.offset) * 0.5;
      // Tạo độ nhấp nhô theo trục Z
      const zWave = Math.sin(angle * 3 + time) * 1.5 + Math.cos(time + p.myY) * 1.5;
      
      const x = target.x + Math.cos(angle) * radius;
      const y = target.y + Math.sin(angle) * radius + p.myY * 2; // Thêm độ cao riêng
      const z = target.z + zWave;

      dummy.position.set(x, y, z);
      
      // Hướng kiếm về phía tay nhưng có chút nhiễu động
      dummy.lookAt(target.x, target.y + Math.sin(time + i) * 2, target.z);
      dummy.rotation.x += Math.PI / 2; // Xoay để lưỡi kiếm hướng tới trước
      
      // HIỆU ỨNG KÉO DÃN KHI DI CHUYỂN (Stretch)
      // Tính khoảng cách đến tâm để biết tốc độ ở rìa
      const distToCenter = Math.sqrt(x*x + y*y);
      const stretch = 1 + distToCenter * 0.05; // Càng xa tâm càng dài ra
      dummy.scale.set(1, stretch, 1);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    // Quay nhẹ toàn bộ khối kiếm
    meshRef.current.rotation.z = time * 0.05;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false}>
    </instancedMesh>
  );
}