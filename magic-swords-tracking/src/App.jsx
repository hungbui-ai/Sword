import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    let camera = null;
    const init = () => {
      if (!window.Hands || !window.Camera || !videoRef.current) {
        setTimeout(init, 500);
        return;
      }
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6, // Tăng nhẹ để ổn định
        minTrackingConfidence: 0.6,
        selfieMode: true
      });
      hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
          setHandData(results.multiHandLandmarks[0]);
        } else {
          setHandData(null);
        }
      });
      camera = new window.Camera(videoRef.current, {
        onFrame: async () => { await hands.send({ image: videoRef.current }); },
        width: 1280, height: 720,
      });
      camera.start();
    };
    init();
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      {/* Dùng dpr thấp để tăng hiệu năng, antialias false để nét */}
      <Canvas camera={{ position: [0, 0, 14], fov: 50 }} gl={{ antialias: false }} dpr={[1, 1.5]}>
        <color attach="background" args={["#030303"]} />
        <MagicSwords handData={handData} />
        <EffectComposer disableNormalPass>
          {/* Tinh chỉnh Bloom: Giảm intensity, tăng threshold để chỉ sáng phần lõi */}
          <Bloom intensity={1.2} luminanceThreshold={0.6} luminanceSmoothing={0.9} mipmapBlur radius={0.5} />
          <ChromaticAberration offset={[0.002, 0.002]} />
          <Vignette darkness={0.6} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}