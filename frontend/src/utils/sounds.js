const hoverAudio = new Audio("/sounds/hover.mp3");
const transitionAudio = new Audio("/sounds/transition.mp3");
const deleteAudio = new Audio("/sounds/delete.mp3");

hoverAudio.volume = 0.25;
transitionAudio.volume = 0.55;
deleteAudio.volume = 0.35;

function tocarAudio(audio) {
  audio.currentTime = 0;

  audio.play().catch((erro) => {
    console.warn(
      "O navegador bloqueou o áudio até uma interação do usuário:",
      erro
    );
  });
}

export function playHoverSound() {
  tocarAudio(hoverAudio);
}

export function playTransitionSound() {
  tocarAudio(transitionAudio);
}

export function playDeleteSound() {
  tocarAudio(deleteAudio);
}