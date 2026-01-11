// Xóa bỏ các dòng import @mediapipe
import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Truy cập trực tiếp từ biến toàn cục do script ngoài tạo ra
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
        setHandData(results.multiHandLandmarks[0][8]);
      } else {
        setHandData(null);
      }
    });

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
    camera.start();

    return () => camera.stop();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      <Canvas camera={{ position: [0, 0, 12] }}>
        <MagicSwords handData={handData} />
        <EffectComposer>
          <Bloom intensity={2.0} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}