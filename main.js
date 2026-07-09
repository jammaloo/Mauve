(() => {
  "use strict";

  const SLICE_COUNT = 20;       // vertical slices per fish
  const SLICE_OVERLAP = 1;      // px each slice bleeds into the next, so neighbours cover any seam
  const SWIM_AMP = 2;           // px of vertical bob per slice ("slight")
  const SWIM_PERIOD = 1.2;      // s for one full up-down bob
  const PHASE_STEP = 0.09;      // s of delay between adjacent slices → travelling sine head→tail

  /*
   * One entry per fish on screen.
   *   size      display px (image is square, 740×740)
   *   top       vertical band, % of viewport height
   *   duration  seconds to cross the full screen
   *   delay     negative seconds so fish are mid-journey on load and never in sync
   *   ltr       true = swims left→right (flipped), false = right→left (original facing)
   *   hue       hue-rotate degrees; 0 = original colour
   */
  const FISH = [
    { size: 170, top: "18%", duration: 26, delay:  0, ltr: false, hue:   0 }, // always one original-colour fish
    { size: 130, top: "68%", duration: 20, delay: -4, ltr: true,  hue:  45 },
    { size: 200, top: "42%", duration: 34, delay: -9, ltr: false, hue: 110 },
    { size: 110, top: "82%", duration: 17, delay: -2, ltr: true,  hue: 180 },
    { size: 150, top: "30%", duration: 29, delay: -13,ltr: false, hue: 230 },
    { size: 120, top: "55%", duration: 22, delay: -7, ltr: true,  hue: 300 },
  ];

  const ocean = document.getElementById("ocean");

  function buildFish(cfg) {
    const track = document.createElement("div");
    track.className = "fish-track" + (cfg.ltr ? " ltr" : "");
    track.style.setProperty("--top", cfg.top);
    track.style.animationDuration = cfg.duration + "s";
    track.style.animationDelay = cfg.delay + "s";

    const fish = document.createElement("div");
    fish.className = "fish" + (cfg.ltr ? " flip" : "");
    fish.style.setProperty("--size", cfg.size + "px");
    fish.style.setProperty("--hue", cfg.hue + "deg");

    const sliceW = cfg.size / SLICE_COUNT;

    for (let i = 0; i < SLICE_COUNT; i++) {
      const slice = document.createElement("div");
      slice.className = "slice";

      // Each slice shows one column (+ overlap into the next). Slices lay out
      // left→right, so slice 0 = the head and slice 9 = the tail.
      slice.style.width = sliceW + SLICE_OVERLAP + "px";
      slice.style.left = i * sliceW + "px";
      slice.style.height = cfg.size + "px";
      slice.style.backgroundPositionX = -(i * sliceW) + "px";

      // Head on top, tail at the bottom layer (10 → 1).
      slice.style.zIndex = SLICE_COUNT - i;

      // Negative per-slice delay turns the single "swim" keyframe into a sine
      // wave that travels head→tail.
      slice.style.setProperty("--amp", SWIM_AMP + "px");
      slice.style.animationDuration = SWIM_PERIOD + "s";
      slice.style.animationDelay = -(i * PHASE_STEP) + "s";

      fish.appendChild(slice);
    }

    track.appendChild(fish);
    return track;
  }

  FISH.forEach((cfg) => ocean.appendChild(buildFish(cfg)));
})();
