const DDRAGON_BASE_URL = "https://ddragon.leagueoflegends.com";

let cacheChampions = null;

export async function buscarVersaoAtualDDragon() {
  const resposta = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`);

  if (!resposta.ok) {
    throw new Error("Erro ao buscar versão do Data Dragon");
  }

  const versoes = await resposta.json();

  return versoes[0];
}

export async function listarChampionsRiot() {
  if (cacheChampions) {
    return cacheChampions;
  }

  const versao = await buscarVersaoAtualDDragon();

  const resposta = await fetch(
    `${DDRAGON_BASE_URL}/cdn/${versao}/data/pt_BR/champion.json`
  );

  if (!resposta.ok) {
    throw new Error("Erro ao buscar campeões da Riot");
  }

  const json = await resposta.json();

  const champions = Object.values(json.data).map((champion) => ({
    id: champion.id,
    key: champion.key,
    nome: champion.name,
    titulo: champion.title,
    imagem: `${DDRAGON_BASE_URL}/cdn/${versao}/img/champion/${champion.image.full}`,
  }));

  cacheChampions = champions;

  return champions;
}

export function encontrarChampionPorNome(nome, championsRiot) {
  return championsRiot.find(
    (champion) => champion.nome.toLowerCase() === nome.toLowerCase()
  );
}