import { useEffect } from "react";
import "./index.css";

const SCENE_WIDTH_PX = 1584;
const SCENE_HEIGHT_PX = 396;
const ROW_WIDTH_PX = SCENE_WIDTH_PX;
const ROW_HEIGHT_PX = 14;
const RED_THREAD_LINE_PX = 444;
const PAIR_COMPLEMENT_CHANCE = 0.92;
const LONG_BAR_MIN_PX = 24;

const TEXTURES = {
  fine: { width: [1, 9], gap: [1, 3], bias: 3 },
  mixed: { width: [2, 24], gap: [1, 5], bias: 2 },
  sparse: { width: [3, 18], gap: [3, 12], bias: 2 },
  broad: { width: [26, 100], gap: [5, 24], bias: 1.5 },
} as const;

type GroupStyle = {
  textures: readonly (keyof typeof TEXTURES)[];
  pause: readonly [number, number];
};

const GROUP_STYLES: readonly GroupStyle[] = [
  { textures: ["fine", "fine", "mixed"], pause: [8, 28] },
  { textures: ["broad", "sparse", "sparse", "mixed"], pause: [24, 70] },
  { textures: ["fine", "mixed", "mixed"], pause: [4, 20] },
  { textures: ["sparse", "sparse", "fine"], pause: [30, 80] },
  { textures: ["broad", "broad", "sparse", "fine"], pause: [16, 50] },
];

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function App() {
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    if (canvas === null || !(canvas instanceof HTMLCanvasElement))
      throw new Error("No canvas!");
    const ctx = canvas.getContext("2d");
    if (ctx === null) throw new Error("No context!");
    ctx.clearRect(0, 0, SCENE_WIDTH_PX, SCENE_HEIGHT_PX);

    const groupHeight = ROW_HEIGHT_PX * 3;
    for (let group = 0; group * groupHeight < SCENE_HEIGHT_PX; group++) {
      const style = GROUP_STYLES[group % GROUP_STYLES.length]!;
      const y = group * groupHeight;
      let x = randomInt(0, 20);
      let previousWidth = 0;

      while (x < ROW_WIDTH_PX) {
        // Keep a texture and spacing for a whole passage, then leave a pause.
        const textureName =
          style.textures[randomInt(0, style.textures.length - 1)]!;
        const texture = TEXTURES[textureName];
        const passageEnd = Math.min(ROW_WIDTH_PX, x + randomInt(90, 220));
        const gap = randomInt(texture.gap[0], texture.gap[1]);
        let hasLongBar = false;

        while (x < passageEnd) {
          // Each passage has at most one long anchor, followed by fine detail.
          const barTexture = hasLongBar ? TEXTURES.fine : texture;
          const accent =
            !hasLongBar &&
            (textureName === "fine" || textureName === "mixed") &&
            Math.random() < 0.025;
          let width: number = accent
            ? randomInt(32, 90)
            : Math.round(
                barTexture.width[0] +
                  Math.random() ** barTexture.bias *
                    (barTexture.width[1] - barTexture.width[0]),
              );

          // Space both sides of a wide bar according to its width.
          const adjacentWidth = Math.max(previousWidth, width);
          const clearance =
            adjacentWidth >= ROW_HEIGHT_PX ? Math.ceil(adjacentWidth * 0.4) : 1;
          const localGap = hasLongBar ? Math.min(gap, 3) : gap;
          x += Math.max(
            clearance,
            Math.round(localGap * (0.4 + Math.random() * 1.2)),
          );
          if (x >= ROW_WIDTH_PX) break;
          width = Math.min(width, ROW_WIDTH_PX - x);

          // A span belongs to one row; exceptions leave both rows black.
          if (Math.random() < PAIR_COMPLEMENT_CHANCE) {
            const row = randomInt(0, 1);
            ctx.fillStyle =
              x <= RED_THREAD_LINE_PX && RED_THREAD_LINE_PX < x + width
                ? "#ff0000"
                : "white";
            ctx.fillRect(x, y + row * ROW_HEIGHT_PX, width, ROW_HEIGHT_PX);
          }

          previousWidth = width;
          hasLongBar ||= width >= LONG_BAR_MIN_PX;
          x += width;
        }

        x += randomInt(...style.pause);
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
