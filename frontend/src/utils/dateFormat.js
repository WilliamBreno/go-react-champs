const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function normalizarData(dataString) {
  if (!dataString) return null;

  // Seu backend retorna algo como: "2026-05-28 16:10:00"
  const dataISO = dataString.replace(" ", "T");
  const data = new Date(dataISO);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function mesmoDia(dataA, dataB) {
  return (
    dataA.getFullYear() === dataB.getFullYear() &&
    dataA.getMonth() === dataB.getMonth() &&
    dataA.getDate() === dataB.getDate()
  );
}

function formatarHora(data) {
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDataMensagem(dataString) {
  const data = normalizarData(dataString);

  if (!data) {
    return "";
  }

  const agora = new Date();

  const ontem = new Date();
  ontem.setDate(agora.getDate() - 1);

  if (mesmoDia(data, agora)) {
    return formatarHora(data);
  }

  if (mesmoDia(data, ontem)) {
    return `Ontem ${formatarHora(data)}`;
  }

  const diaSemana = diasSemana[data.getDay()];

  return `${diaSemana} ${formatarHora(data)}`;
}

export function formatarDataResumo(dataString) {
  const data = normalizarData(dataString);

  if (!data) {
    return "indisponível";
  }

  const agora = new Date();

  const ontem = new Date();
  ontem.setDate(agora.getDate() - 1);

  if (mesmoDia(data, agora)) {
    return formatarHora(data);
  }

  if (mesmoDia(data, ontem)) {
    return "Ontem";
  }

  return diasSemana[data.getDay()];
}