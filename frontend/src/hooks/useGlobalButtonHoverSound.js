import { useEffect } from "react";
import { playHoverSound } from "../utils/sounds";

export function useGlobalButtonHoverSound() {
  useEffect(() => {
    let ultimoBotao = null;

    function tocarHover(event) {
      const botao = event.target.closest("button");

      if (!botao) {
        return;
      }

      if (botao.disabled) {
        return;
      }

      if (botao === ultimoBotao) {
        return;
      }

      ultimoBotao = botao;
      playHoverSound();
    }

    function resetarHover(event) {
      const botao = event.target.closest("button");

      if (botao === ultimoBotao) {
        ultimoBotao = null;
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