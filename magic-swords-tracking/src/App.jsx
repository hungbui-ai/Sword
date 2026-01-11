import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import * as cam from "@mediapipe/camera_utils";
import { setupHands } from "./components/HandTracker";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Khởi tạo MediaPipe Hands
    const hands = setupHands((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
        // Landmark số 8 là đầu ngón trỏ
        setHandData(results.multiHandLandmarks[0][8]);
      } else {
        setHandData(null);
      }
    });

    // Khởi tạo Camera Utils
    const camera = new cam.Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
    
    camera.start();

    // Dọn dẹp khi tắt component
    return () => {
      camera.stop();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", margin: 0, padding: 0 }}>
      {/* Video ẩn dùng để xử lý hình ảnh đầu vào */}
      <video 
        ref={videoRef} 
        style={{ display: "none" }} 
        playsInline 
      />
      
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <color attach="background" args={["#050505"]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        
        <MagicSwords handData={handData} />
        
        <EffectComposer>
          <Bloom 
            intensity={2.0} 
            luminanceThreshold={0.15} 
            mipmapBlur 
          />
          <Noise opacity={0.04} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>

      {/* Hiển thị hướng dẫn nhỏ nếu chưa nhận diện được tay */}
      {!handData && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          width: "100%",
          textAlign: "center",
          color: "#00ffaa",
          fontFamily: "sans-serif",
          pointerEvents: "none",
          textShadow: "0 0 10px #00ffaa"
        }}>
          GIƠ TAY TRƯỚC CAMERA ĐỂ KÍCH HOẠT KIẾM
        </div>
      )}
    </div>
  );
}
