// This script sets up smooth scrolling, scroll-triggered animations, and interactive effects
// for a series of "card" elements using GSAP and Lenis for a dynamic scroll experience.

import { setupMarqueeAnimation } from "./marquee.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(SplitText, ScrollTrigger);

  // Initialize Lenis for smooth, eased scrolling behavior.
  // Lenis replaces the default scroll behavior with a custom one.
  // We connect Lenis's scroll updates to GSAP's ScrollTrigger to keep animations in sync.
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  // GSAP's ticker drives the animation frames; we use it to advance Lenis's smooth scroll.
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const cards = gsap.utils.toArray(".card");
  const introCard = cards[0];

  // Use GSAP's SplitText to break each card title's h1 into individual characters.
  // Each character is wrapped inside a <div> with class "char", then further wrapped in a <span>.
  // Wrapping chars in spans allows fine control over each character's animation (e.g., sliding in/out).
  const titles = gsap.utils.toArray(".card-title h1");
  titles.forEach((title) => {
    const split = new SplitText(title, {
      type: "chars",
      charsClass: "char",
      tag: "div",
    });
    split.chars.forEach((char) => {
      char.innerHTML = `<span>${char.textContent}</span>`;
    });
  });

  // Set initial scale and border radius for the intro card's image wrapper and image.
  // This prepares the image for the zoom and shape morph animations on scroll.
  const cardImgWrapper = introCard.querySelector(".card-img");
  const cardImg = introCard.querySelector(".card-img img");
  gsap.set(cardImgWrapper, { scale: 0.5, borderRadius: "400px" });
  gsap.set(cardImg, { scale: 1.5 });

  // Utility function to animate content sliding in or out.
  // It animates the horizontal position of title characters and the description's opacity and position.
  // Direction "in" slides content into view; "out" slides it out.
  function animateContent({ chars, description, direction = "in" }) {
    const x = direction === "in" ? "0%" : "100%"; // Characters slide from right when entering, slide out to right when leaving
    const descX = direction === "in" ? 0 : "40px"; // Description slides slightly horizontally and fades
    const opacity = direction === "in" ? 1 : 0;
    const duration = 0.75;

    // Animate each character's horizontal position
    gsap.to(chars, { x, duration, ease: "power4.out" });
    // Animate description's position and fade
    gsap.to(description, {
      x: descX,
      opacity,
      duration,
      delay: 0.1,
      ease: "power4.out",
    });
  }

  // Scroll-triggered animation for the intro card that controls:
  // - Zooming the card image in and out
  // - Morphing the image's border radius from circular to rounded rectangle
  // - Fading the marquee text out as the image zooms in
  // - Revealing the card's title and description content once fully zoomed in
  const marquee = introCard.querySelector(".card-marquee .marquee");
  const titleChars = introCard.querySelectorAll(".char span");
  const description = introCard.querySelector(".card-description");

  ScrollTrigger.create({
    trigger: introCard,
    start: "top top",
    end: "+=300vh", // Animation runs over 3 viewport heights while scrolling
    onUpdate: ({ progress }) => {
      // Calculate intermediate values based on scroll progress (0 to 1)
      const imgScale = 0.5 + progress * 0.5; // Scale from 0.5 to 1.0
      const borderRadius = 400 - progress * 375; // Border radius shrinks from 400px to 25px
      const innerImgScale = 1.5 - progress * 0.5; // Inner image scales down from 1.5 to 1.0

      // Apply calculated scale and border radius to image wrapper and image
      gsap.set(cardImgWrapper, {
        scale: imgScale,
        borderRadius: `${borderRadius}px`,
      });
      gsap.set(cardImg, { scale: innerImgScale });

      // Fade marquee opacity as image scales between 0.5 and 0.75
      if (imgScale >= 0.5 && imgScale <= 0.75) {
        const fadeProgress = (imgScale - 0.5) / 0.25;
        gsap.set(marquee, { opacity: 1 - fadeProgress });
      } else {
        // Keep marquee fully visible if image scale below 0.5, or hidden if above 0.75
        gsap.set(marquee, { opacity: imgScale < 0.5 ? 1 : 0 });
      }

      // Reveal title and description content when fully zoomed in (progress >= 1)
      // Hide content again when scrolling back up (progress < 1)
      if (progress >= 1 && !introCard.contentRevealed) {
        introCard.contentRevealed = true;
        animateContent({ chars: titleChars, description, direction: "in" });
      }
      if (progress < 1 && introCard.contentRevealed) {
        introCard.contentRevealed = false;
        animateContent({ chars: titleChars, description, direction: "out" });
      }
    },
  });

  // Loop through all cards to apply shared behaviors:
  // - Pinning cards during scroll to create sticky effect
  // - Fading and scaling previous card as next card enters
  // - Zooming card images on scroll
  // - Sliding card content (title and description) in and out on scroll enter/leave
  cards.forEach((card, index) => {
    const isIntro = index === 0;
    const isLast = index === cards.length - 1;
    const nextCard = cards[index + 1];

    const wrapper = card.querySelector(".card-wrapper");
    const img = card.querySelector(".card-img img");
    const imgWrap = card.querySelector(".card-img");
    const cardTitleChars = card.querySelectorAll(".char span");
    const cardDescription = card.querySelector(".card-description");

    // Pin each card in place while scrolling.
    // The last card allows spacing after pinning ends.
    ScrollTrigger.create({
      trigger: card,
      start: "top top",
      end: isLast ? "+=100vh" : "top top",
      endTrigger: isLast ? null : cards[cards.length - 1],
      pin: true,
      pinSpacing: isLast,
    });

    // As the next card scrolls into view, fade out and scale down the current card wrapper.
    if (nextCard && wrapper) {
      ScrollTrigger.create({
        trigger: nextCard,
        start: "top bottom",
        end: "top top",
        onUpdate: ({ progress }) => {
          gsap.set(wrapper, {
            scale: 1 - progress * 0.25, // Scale down up to 75%
            opacity: 1 - progress,      // Fade out to 0 opacity
          });
        },
      });
    }

    // For all cards except the intro, zoom the card image as it scrolls into view.
    if (!isIntro && img && imgWrap) {
      ScrollTrigger.create({
        trigger: card,
        start: "top bottom",
        end: "top top",
        onUpdate: ({ progress }) => {
          // Scale image from 2x down to 1x as user scrolls through the card
          gsap.set(img, { scale: 2 - progress });
          // Reduce border radius from 150px to 25px for a morphing effect
          gsap.set(imgWrap, { borderRadius: `${150 - progress * 125}px` });
        },
      });
    }

    // Animate card content sliding in when the card enters the viewport,
    // and sliding out when scrolling back up.
    if (!isIntro) {
      ScrollTrigger.create({
        trigger: card,
        start: "top top",
        onEnter: () =>
          animateContent({
            chars: cardTitleChars,
            description: cardDescription,
            direction: "in",
          }),
        onLeaveBack: () =>
          animateContent({
            chars: cardTitleChars,
            description: cardDescription,
            direction: "out",
          }),
      });
    }
  });

  // Start the marquee animation defined in the external module.
  setupMarqueeAnimation();
});
