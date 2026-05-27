import { useEffect } from "react";
import { playHoverSound } from "../utils/sounds";

export function useGlobalButtonHoverSound() {
  useEffect(() => {
    let ultimoElemento = null;

    function tocarHover(event) {
      const elemento = event.target.closest("button, .nav-link");

      if (!elemento) {
        return;
      }

      if (elemento.disabled) {
        return;
      }

      if (elemento === ultimoElemento) {
        return;
      }

      ultimoElemento = elemento;
      playHoverSound();
    }

    function resetarHover(event) {
      const elemento = event.target.closest("button, .nav-link");

      if (elemento === ultimoElemento) {
        ultimoElemento = null;
      }
    }

    document.addEventListener("pointerover", tocarHover);
    document.addEventListener("pointerout", resetarHover);

    return () => {
      document.removeEventListener("pointerover", tocarHover);
      document.removeEventListener("pointerout", resetarHover);
    };
  }, []);
}