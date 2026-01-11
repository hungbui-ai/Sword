import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import MagicSwords from "./components/MagicSwords";

export default function App() {
  const videoRef = useRef(null);
  const [handData, setHandData] = useState(null);

  useEffect(() => {
    let camera = null;
    let hands = null;

    const init = () => {
      if (!window.Hands || !window.Camera || !videoRef.current) {
        requestAnimationFrame(init);
        return;
      }

      hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
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
        onFrame: async () => {
          if (videoRef.current) await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    };
    init();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <color attach="background" args={["#020202"]} />
        <ambientLight intensity={1} />
        <MagicSwords handData={handData} />
        <EffectComposer>
          <Bloom intensity={1.5} luminanceThreshold={0.4} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}