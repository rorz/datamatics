import { useEffect } from "react";
import "./index.css";

const SCENE_WIDTH_PX = 1584;
const SCENE_HEIGHT_PX = 396;
const ROW_WIDTH_PX = SCENE_WIDTH_PX;
const ROW_HEIGHT_PX = 17;

export function App() {
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    if (canvas === null || !(canvas instanceof HTMLCanvasElement))
      throw new Error("No canvas!");
    const ctx = canvas.getContext("2d");
    if (ctx === null) throw new Error("No context!");
    ctx.clearRect(0, 0, SCENE_WIDTH_PX, SCENE_HEIGHT_PX);

    for (let y = 0; y < SCENE_HEIGHT_PX; y += ROW_HEIGHT_PX) {
      if ((y / ROW_HEIGHT_PX) % 3 === 2) continue;

      let i = 0;
      while (i < ROW_WIDTH_PX) {
        const blockSize = 1 + Math.floor(Math.random() ** 3 * 15);
        const colorRand = Math.random();

        if (colorRand < 0.4) {
          ctx.fillStyle = "white";
        } else {
          ctx.fillStyle = "black";
        }
        ctx.fillRect(i, y, blockSize, ROW_HEIGHT_PX);
        i += blockSize;
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center bg-zinc-900 min-h-screen w-screen">
      <canvas
        id="canvas"
        width={SCENE_WIDTH_PX}
        height={SCENE_HEIGHT_PX}
        className="bg-black"
      ></canvas>
    </div>
  );
}

export default App;
