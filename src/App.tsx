import { useEffect } from "react";
import "./index.css";

const SCENE_WIDTH_PX = 1584;
const SCENE_HEIGHT_PX = 396;
const ROW_WIDTH_PX = SCENE_WIDTH_PX;
const ROW_HEIGHT_PX = 14;
const RED_THREAD_LINE_PX = 444;
const PAIR_COMPLEMENT_CHANCE = 0.92;
const LONG_BAR_MIN_PX = 24;
const TIGHT_GAP_CHANCE = 0.12;

const TEXTURES = {
  fine: { width: [1, 9], gap: [1, 2], bias: 3 },
  mixed: { width: [2, 24], gap: [1, 4], bias: 2 },
  sparse: { width: [3, 18], gap: [2, 8], bias: 2 },
  broad: { width: [26, 100], gap: [4, 14], bias: 1.5 },
} as const;

type GroupStyle = {
  textures: readonly (keyof typeof TEXTURES)[];
  pause: readonly [number, number];
};

const GROUP_STYLES: readonly GroupStyle[] = [
  { textures: ["fine", "fine", "mixed"], pause: [4, 16] },
  { textures: ["broad", "sparse", "sparse", "mixed"], pause: [12, 36] },
  { textures: ["fine", "mixed", "mixed"], pause: [2, 10] },
  { textures: ["sparse", "sparse", "fine"], pause: [16, 42] },
  { textures: ["broad", "broad", "sparse", "fine"], pause: [8, 24] },
];

const TEXT_CHARACTERS = (
  [
    [0x0030, 0x007a], // Latin and digits
    [0x00c0, 0x024f], // Extended Latin
    [0x0370, 0x03ff], // Greek
    [0x0400, 0x04ff], // Cyrillic
    [0x0531, 0x0586], // Armenian
    [0x10a0, 0x10ff], // Georgian
    [0x2070, 0x209f], // Superscripts and subscripts
    [0x2190, 0x21ff], // Arrows
    [0x2200, 0x22ff], // Mathematics
    [0x3041, 0x3096], // Hiragana
    [0x30a1, 0x30fa], // Katakana
    [0x4e00, 0x4eff], // CJK
  ] as const
)
  .flatMap(([start, end]) =>
    Array.from({ length: end - start + 1 }, (_, index) =>
      String.fromCodePoint(start + index),
    ),
  )
  .filter((character) => /[\p{L}\p{N}\p{S}]/u.test(character));

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function drawTextRow(ctx: CanvasRenderingContext2D, y: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y, ROW_WIDTH_PX, ROW_HEIGHT_PX);
  ctx.clip();
  ctx.fillStyle = "white";
  ctx.font =
    "100 " +
    Math.round(ROW_HEIGHT_PX * 0.78) +
    'px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Apple Symbols", sans-serif';
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";

  let x = 0;
  while (x < ROW_WIDTH_PX) {
    const length = randomInt(4, 14);
    let bunch = "";
    for (let character = 0; character < length; character++) {
      bunch += TEXT_CHARACTERS[randomInt(0, TEXT_CHARACTERS.length - 1)]!;
    }
    bunch += " " + "—".repeat(randomInt(1, 3)) + " ";
    ctx.fillText(bunch, x, y + ROW_HEIGHT_PX / 2);
    x += ctx.measureText(bunch).width;
  }

  ctx.restore();
}

function downloadCanvas() {
  const canvas = document.getElementById("canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  canvas.toBlob((blob) => {
    if (blob === null) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "datamatics.png";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

export function App() {
  useEffect(() => {
    const canvas = document.getElementById("canvas");
    if (canvas === null || !(canvas instanceof HTMLCanvasElement))
      throw new Error("No canvas!");
    const ctx = canvas.getContext("2d");
    if (ctx === null) throw new Error("No context!");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, SCENE_WIDTH_PX, SCENE_HEIGHT_PX);

    const groupHeight = ROW_HEIGHT_PX * 3;
    for (let group = 0; group * groupHeight < SCENE_HEIGHT_PX; group++) {
      const style = GROUP_STYLES[group % GROUP_STYLES.length]!;
      const y = group * groupHeight;
      let x = 0;
      let previousWidth = 0;

      while (x < ROW_WIDTH_PX) {
        // Keep a texture and spacing for a whole passage, then leave a pause.
        const textureName =
          style.textures[randomInt(0, style.textures.length - 1)]!;
        const texture = TEXTURES[textureName];
        const passageEnd = Math.min(ROW_WIDTH_PX, x + randomInt(90, 220));
        const gap = randomInt(texture.gap[0], texture.gap[1]);
        const longBarLimit = Math.random() < 0.1 ? 2 : 1;
        let longBarCount = 0;

        while (x < passageEnd) {
          // Usually one long anchor per passage, with an occasional second.
          const allowLongBar = longBarCount < longBarLimit;
          const barTexture = allowLongBar ? texture : TEXTURES.fine;
          const accent =
            allowLongBar &&
            (textureName === "fine" || textureName === "mixed") &&
            Math.random() < 0.025;
          let width: number = accent
            ? randomInt(32, 90)
            : Math.round(
                barTexture.width[0] +
                  Math.random() ** barTexture.bias *
                    (barTexture.width[1] - barTexture.width[0]),
              );

          const firstSpan = previousWidth === 0;
          if (!firstSpan) {
            const adjacentWidth = Math.max(previousWidth, width);
            const localGap = allowLongBar
              ? gap
              : Math.min(gap, TEXTURES.fine.gap[1]);
            let spacing = Math.max(
              1,
              Math.round(localGap * (0.4 + Math.random() * 1.2)),
            );
            if (adjacentWidth >= LONG_BAR_MIN_PX) {
              // Wide bars usually breathe, but occasionally sit very close.
              spacing =
                Math.random() < TIGHT_GAP_CHANCE
                  ? randomInt(1, 2)
                  : Math.max(spacing, Math.ceil(adjacentWidth * 0.24));
            }
            x += spacing;
          }
          if (x >= ROW_WIDTH_PX) break;
          width = Math.min(width, ROW_WIDTH_PX - x);

          // Always start one row at the left edge; later spans can be empty.
          if (firstSpan || Math.random() < PAIR_COMPLEMENT_CHANCE) {
            const row = randomInt(0, 1);
            ctx.fillStyle =
              x <= RED_THREAD_LINE_PX && RED_THREAD_LINE_PX < x + width
                ? "#ff0000"
                : "white";
            ctx.fillRect(x, y + row * ROW_HEIGHT_PX, width, ROW_HEIGHT_PX);
          }

          previousWidth = width;
          if (width >= LONG_BAR_MIN_PX) longBarCount++;
          x += width;
        }

        x += randomInt(...style.pause);
      }

      const textY = y + ROW_HEIGHT_PX * 2;
      if (textY < SCENE_HEIGHT_PX) drawTextRow(ctx, textY);
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
      <button
        type="button"
        onClick={downloadCanvas}
        className="mt-4 rounded border border-white/20 px-3 py-1.5 text-xs font-light text-white/70 transition hover:border-white/50 hover:text-white"
      >
        Download PNG
      </button>
    </div>
  );
}

export default App;
