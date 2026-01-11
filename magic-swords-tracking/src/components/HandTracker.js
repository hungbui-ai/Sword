import { Hands } from "@mediapipe/hands";

export const setupHands = (onResults) => {
  const hands = new Hands({
    locateFile: (file) => {
      // Sử dụng link CDN ổn định thay vì trỏ vào node_modules
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
    },
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  hands.onResults(onResults);
  return hands;
};