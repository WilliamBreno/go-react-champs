export function formatarMaestriaInput(valor) {
  const apenasNumeros = String(valor).replace(/\D/g, "");

  if (!apenasNumeros) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR").format(Number(apenasNumeros));
}

export function converterMaestriaParaNumero(valor) {
  const apenasNumeros = String(valor).replace(/\D/g, "");

  if (!apenasNumeros) {
    return 0;
  }

  return parseInt(apenasNumeros, 10);
}

export function formatarMaestriaVisual(valor) {
  return new Intl.NumberFormat("pt-BR").format(Number(valor));
}