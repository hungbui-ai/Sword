import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Camera } from "@mediapipe/camera_utils";
import { setupHands } from "./components/HandTracker";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = setupHands((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
        // Lấy tọa độ ngón trỏ (8)
        setHandData(results.multiHandLandmarks[0][8]);
      } else {
        setHandData(null);
      }
    });

    const camera = new Camera(videoRef.current, {
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
      {/* Webcam ẩn */}
      <video ref={videoRef} style={{ display: "none" }} />
      
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <color attach="background" args={["#020202"]} />
        <ambientLight intensity={0.2} />
        
        <MagicSwords handData={handData} />
        
        <EffectComposer>
          <Bloom 
            intensity={2.5} 
            luminanceThreshold={0.2} 
            mipmapBlur 
          />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
