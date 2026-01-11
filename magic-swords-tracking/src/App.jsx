import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { setupHands } from "./components/HandTracker";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    const hands = setupHands((results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
        // Lấy tọa độ ngón tay trỏ (index 8)
        setHandData(results.multiHandLandmarks[0][8]);
      }
    });

    const camera = new (require("@mediapipe/camera_utils").Camera)(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      
      <Canvas camera={{ position: [0, 0, 10] }}>
        <color attach="background" args={["#050505"]} />
        <MagicSwords handData={handData} />
        
        <EffectComposer>
          <Bloom intensity={2.0} luminanceThreshold={0.1} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
