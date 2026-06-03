import { useEffect } from "react";

function isDesktopDevice() {
  const hasTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  const isSmallScreen = window.matchMedia("(max-width: 760px)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  return !hasTouch && !isSmallScreen && !isCoarsePointer;
}

export function useGlobalButtonHoverSound() {
  useEffect(() => {
    if (!isDesktopDevice()) {
      return;
    }

    const hoverAudio = new Audio("/sounds/hover.wav");
    const clickAudio = new Audio("/sounds/click.wav");

    hoverAudio.volume = 0.25;
    clickAudio.volume = 0.35;

    function playHover(event) {
      const target = event.target.closest("button, a");

      if (!target) {
        return;
      }

      if (target.closest(".navbar")) {
        return;
      }

      hoverAudio.currentTime = 0;
      hoverAudio.play().catch(() => {});
    }

    function playClick(event) {
      const target = event.target.closest("button, a");

      if (!target) {
        return;
      }

      if (target.closest(".navbar")) {
        return;
      }

      clickAudio.currentTime = 0;
      clickAudio.play().catch(() => {});
    }

    document.addEventListener("mouseover", playHover);
    document.addEventListener("click", playClick);

    return () => {
      document.removeEventListener("mouseover", playHover);
      document.removeEventListener("click", playClick);
    };
  }, []);
}