/**
 * This file sets up a continuous horizontal scrolling marquee animation
 * for a list of elements using the GSAP animation library. It defines
 * a function to initialize the marquee animation by selecting the target
 * elements and applying a looping horizontal scroll effect. The core
 * animation logic is handled in the `horizontalLoop` function, which
 * calculates the widths and positions of elements to create a seamless
 * infinite scrolling effect.
 */

import gsap from "gsap";

export function setupMarqueeAnimation(config = {}) {
  // Convert the selected elements matching the configurable selector into an array using GSAP utility
  const marqueeItems = gsap.utils.toArray(config.selector || ".marquee h1");

  // Only proceed if there are marquee items to animate
  if (marqueeItems.length > 0) {
    // Call horizontalLoop to create an infinite horizontal scroll animation
    // Pass the marquee items and configuration object with repeat, paddingRight, and speed options
    const tl = horizontalLoop(marqueeItems, {
      repeat: config.repeat ?? -1,
      paddingRight: config.paddingRight ?? 30,
      speed: config.speed ?? 1,
    });
    return tl;
  }
}

function horizontalLoop(items, config) {
  items = gsap.utils.toArray(items);
  config = config || {};

  // Initialize a GSAP timeline with infinite repeat and no easing for smooth linear motion
  let tl = gsap.timeline({
    repeat: config.repeat,
    defaults: { ease: "none" },
  });

  let length = items.length;
  let startX = items[0].offsetLeft;
  let widths = [];
  let xPercents = [];
  let pixelsPerSecond = (config.speed || 1) * 100;
  let totalWidth, curX, distanceToStart, distanceToLoop, item, i;

  // Measure widths of each item and calculate their current xPercent positions
  gsap.set(items, {
    xPercent: (i, el) => {
      let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
      xPercents[i] =
        (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
        gsap.getProperty(el, "xPercent");
      return xPercents[i];
    },
  });

  // Reset x translation to zero for all items before calculating total scroll distance
  gsap.set(items, { x: 0 });

  // Calculate the total width the items need to scroll through before looping
  totalWidth =
    items[length - 1].offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    items[length - 1].offsetWidth *
      gsap.getProperty(items[length - 1], "scaleX") +
    (parseFloat(config.paddingRight) || 0);

  // Create animations for each item to move left by their width plus padding,
  // then jump back to the starting position creating a seamless loop
  for (i = 0; i < length; i++) {
    item = items[i];
    curX = (xPercents[i] / 100) * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop =
      distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");

    tl.to(
      item,
      {
        xPercent: ((curX - distanceToLoop) / widths[i]) * 100,
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    ).fromTo(
      item,
      { xPercent: ((curX - distanceToLoop + totalWidth) / widths[i]) * 100 },
      {
        xPercent: xPercents[i],
        duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
        immediateRender: false,
      },
      distanceToLoop / pixelsPerSecond
    );
  }

  // Progress the timeline to the end and back to the start to ensure proper rendering
  tl.progress(1, true).progress(0, true);
  return tl;
}
