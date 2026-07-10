(() => {
  "use strict";

  /*
   * Live settings — these are what the settings panel fiddles with.
   * Amp / period / phase apply instantly; slice count rebuilds the fish.
   * Defaults reflect the tweaked values committed in the previous commit.
   */
  const settings = {
    sliceCount: 20,
    sliceOverlap: 1,   // px each slice bleeds into the next, so neighbours cover any seam
    swimAmp: 2,        // px of vertical bob per slice ("slight")
    swimPeriod: 1.2,   // s for one full up-down bob
    phaseStep: 0.09,   // s of delay between adjacent slices → travelling sine head→tail
  };

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

  // Measure the source image so slices keep its true aspect ratio (works for
  // square or non-square PNGs alike). `size` in each fish config is treated as
  // the display HEIGHT; width is derived as height × (imgW / imgH).
  function loadImage() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = "fish.png";
    });
  }

  let ASPECT = 1;        // width / height of the source image (updated on load)
  let imageReady = false; // false until the source image has been measured

  function buildFish(cfg) {
    const h = cfg.size;
    const w = h * ASPECT;

    const track = document.createElement("div");
    track.className = "fish-track" + (cfg.ltr ? " ltr" : "");
    track.style.setProperty("--top", cfg.top);
    track.style.animationDuration = cfg.duration + "s";
    track.style.animationDelay = cfg.delay + "s";

    const fish = document.createElement("div");
    fish.className = "fish" + (cfg.ltr ? " flip" : "");
    fish.style.setProperty("--w", w + "px");
    fish.style.setProperty("--h", h + "px");
    fish.style.setProperty("--hue", cfg.hue + "deg");

    const sliceW = w / settings.sliceCount;

    for (let i = 0; i < settings.sliceCount; i++) {
      const slice = document.createElement("div");
      slice.className = "slice";

      // Each slice shows one column (+ overlap into the next). Slices lay out
      // left→right, so slice 0 = the head and the last slice = the tail.
      slice.style.width = sliceW + settings.sliceOverlap + "px";
      slice.style.left = i * sliceW + "px";
      slice.style.height = h + "px";
      slice.style.backgroundPositionX = -(i * sliceW) + "px";

      // Head on top, tail at the bottom layer (count → 1).
      slice.style.zIndex = settings.sliceCount - i;

      // Negative per-slice delay turns the single "swim" keyframe into a sine
      // wave that travels head→tail.
      slice.style.setProperty("--amp", settings.swimAmp + "px");
      slice.style.animationDuration = settings.swimPeriod + "s";
      slice.style.animationDelay = -(i * settings.phaseStep) + "s";

      fish.appendChild(slice);
    }

    track.appendChild(fish);
    return track;
  }

  // ---- Rebuild the whole school (needed when slice count/overlap change) ----
  function rebuild() {
    if (!imageReady) return; // image dimensions unknown yet; load will trigger a rebuild
    ocean.innerHTML = "";
    FISH.forEach((cfg) => ocean.appendChild(buildFish(cfg)));
  }

  // ---- Apply swim tuning instantly to existing slices (no rebuild) ---------
  function applyLive() {
    ocean.querySelectorAll(".slice").forEach((slice) => {
      slice.style.setProperty("--amp", settings.swimAmp + "px");
      slice.style.animationDuration = settings.swimPeriod + "s";
      // Recompute per-slice delay from the slice's z-index (z = count - index
      // → index = count - z), so this stays correct without tracking i.
      const i = settings.sliceCount - parseInt(slice.style.zIndex, 10);
      slice.style.animationDelay = -(i * settings.phaseStep) + "s";
    });
  }

  // Spawn the school once the source image's dimensions are known, so slices
  // can be sized to the image's true aspect ratio.
  loadImage().then((img) => {
    ASPECT = img.naturalWidth / img.naturalHeight;
    imageReady = true;
    rebuild();
  });

  // ---------------------------------------------------------------------------
  // Settings panel wiring
  // ---------------------------------------------------------------------------
  const gear = document.getElementById("gear");
  const panel = document.getElementById("settings-panel");

  gear.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });

  // Each slider maps to a setting. `rebuild: true` means the change can alter
  // slice geometry, so we rebuild; otherwise we apply live for smoothness.
  const controls = [
    { id: "slices",  key: "sliceCount",   rebuild: true,  format: (v) => v + " slices" },
    { id: "overlap", key: "sliceOverlap", rebuild: true,  format: (v) => v + " px" },
    { id: "amp",     key: "swimAmp",      rebuild: false, format: (v) => v + " px" },
    { id: "period",  key: "swimPeriod",   rebuild: false, format: (v) => v + " s" },
    { id: "phase",   key: "phaseStep",    rebuild: false, format: (v) => v + " s" },
  ];

  controls.forEach((c) => {
    const slider = document.getElementById(c.id);
    const valueLabel = document.getElementById(c.id + "-value");

    // Initialise the readout to match the slider's current value.
    valueLabel.textContent = c.format(parseFloat(slider.value));

    slider.addEventListener("input", () => {
      const v = parseFloat(slider.value);
      settings[c.key] = v;
      valueLabel.textContent = c.format(v);
      if (c.rebuild) rebuild();
      else applyLive();
    });
  });
})();
