import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    let camera = null;
    
    const initTracking = () => {
      // Kiểm tra xem script từ index.html đã load xong chưa
      if (!window.Hands || !window.Camera) {
        setTimeout(initTracking, 500);
        return;
      }

      if (!videoRef.current) return;

      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
          // Lấy tọa độ ngón trỏ (Index 8)
          setHandData(results.multiHandLandmarks[0][8]);
        } else {
          setHandData(null);
        }
      });

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    };

    initTracking();

    return () => {
      if (camera) camera.stop();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", margin: 0 }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={["#000"]} />
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        
        <MagicSwords handData={handData} />

        <EffectComposer>
          <Bloom intensity={2.5} luminanceThreshold={0.1} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {!handData && (
        <div style={{
          position: "absolute", bottom: "10%", width: "100%", textAlign: "center",
          color: "#00ffaa", fontFamily: "Arial", textShadow: "0 0 10px #00ffaa"
        }}>
          GIƠ TAY LÊN ĐỂ TRIỆU HỒI KIẾM
        </div>
      )}
    </div>
  );
}