import { useEffect, useState } from "react";
import { playTransitionSound, playDeleteSound } from "../utils/sounds";
import ChampionForm from "../components/ChampionForm";
import ChampionCard from "../components/ChampionCard";

import {
  converterMaestriaParaNumero,
  formatarMaestriaInput,
} from "../utils/numberFormat";

import {
  encontrarChampionPorNome,
  listarChampionsRiot,
} from "../services/riotApi";

import {
  listarChampions,
  cadastrarChampion as cadastrarChampionAPI,
  editarChampion as editarChampionAPI,
  excluirChampion as excluirChampionAPI,
} from "../services/api";

function Champions() {
  const [champions, setChampions] = useState([]);

  const [nome, setNome] = useState("");
  const [maestria, setMaestria] = useState("");

  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("recentes");

  const [tela, setTela] = useState("lista");

  const [championsRiot, setChampionsRiot] = useState([]);
  const [championSelecionado, setChampionSelecionado] = useState(null);

  const [editandoId, setEditandoId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editMaestria, setEditMaestria] = useState("");

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [limite] = useState(5);

  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [erro, setErro] = useState("");

  const [popupExcluir, setPopupExcluir] = useState(false);
  const [championParaExcluir, setChampionParaExcluir] = useState(null);

  async function carregarChampions(
    nomeBusca = busca,
    ordemBusca = ordem,
    paginaBusca = pagina
  ) {
    try {
      const resposta = await listarChampions(
        nomeBusca,
        ordemBusca,
        paginaBusca,
        limite
      );

      setChampions(resposta.dados);
      setPagina(resposta.pagina);
      setTotalPaginas(resposta.totalPaginas);
      setErro("");
    } catch (erro) {
      console.error("Erro ao carregar campeões:", erro);
      setErro("Não foi possível carregar os campeões.");
    } finally {
      setCarregandoInicial(false);
    }
  }

  async function cadastrarChampion(event) {
    event.preventDefault();

    if (!nome.trim()) {
      alert("Digite o nome do campeão.");
      return;
    }

    const championEscolhido =
      championSelecionado || encontrarChampionPorNome(nome, championsRiot);

    if (!championEscolhido) {
      alert("Selecione um campeão válido da lista de sugestões.");
      return;
    }

    const maestriaNumero = converterMaestriaParaNumero(maestria);

    if (!maestriaNumero || maestriaNumero <= 0) {
      alert("Digite uma maestria maior que zero.");
      return;
    }

    const novoChampion = {
      nome: championEscolhido.nome,
      maestria: maestriaNumero,
    };

    try {
      await cadastrarChampionAPI(novoChampion);

      setNome("");
      setMaestria("");
      setChampionSelecionado(null);
      setTela("lista");
      setPagina(1);

      await carregarChampions(busca, ordem, 1);
    } catch (erro) {
      console.error("Erro ao cadastrar campeão:", erro);
      alert("Erro ao cadastrar campeão.");
    }
  }

  function iniciarEdicao(champion) {
    setEditandoId(champion.id);
    setEditNome(champion.nome);
    setEditMaestria(formatarMaestriaInput(champion.maestria));
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditNome("");
    setEditMaestria("");
  }

  async function salvarEdicao(id) {
    if (!editNome.trim()) {
      alert("Digite o nome do campeão.");
      return;
    }

    const championEditado = encontrarChampionPorNome(editNome, championsRiot);

    if (!championEditado) {
      alert("Selecione um campeão válido da lista de sugestões.");
      return;
    }

    const editMaestriaNumero = converterMaestriaParaNumero(editMaestria);

    if (!editMaestriaNumero || editMaestriaNumero <= 0) {
      alert("Digite uma maestria maior que zero.");
      return;
    }

    const championAtualizado = {
      nome: championEditado.nome,
      maestria: editMaestriaNumero,
    };

    try {
      await editarChampionAPI(id, championAtualizado);

      cancelarEdicao();

      await carregarChampions(busca, ordem, pagina);
    } catch (erro) {
      console.error("Erro ao editar campeão:", erro);
      alert("Erro ao editar campeão.");
    }
  }

  function abrirPopupExcluir(champion) {
    playDeleteSound();
    setChampionParaExcluir(champion);
    setPopupExcluir(true);
  }

  function fecharPopupExcluir() {
    setChampionParaExcluir(null);
    setPopupExcluir(false);
  }

  async function excluirChampion() {
    if (!championParaExcluir) {
      return;
    }

    try {
      await excluirChampionAPI(championParaExcluir.id);

      fecharPopupExcluir();

      await carregarChampions(busca, ordem, pagina);
    } catch (erro) {
      console.error("Erro ao excluir campeão:", erro);
      alert("Erro ao excluir campeão.");
    }
  }

  function selecionarSugestao(champion) {
    setNome(champion.nome);
    setChampionSelecionado(champion);
  }

  useEffect(() => {
    async function carregarChampionsRiot() {
      try {
        const dados = await listarChampionsRiot();
        setChampionsRiot(dados);
      } catch (erro) {
        console.error("Erro ao carregar campeões da Riot:", erro);
      }
    }

    carregarChampionsRiot();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarChampions(busca, ordem, pagina);
    }, 500);

    return () => clearTimeout(timer);
  }, [busca, ordem, pagina]);

  const sugestoesChampions =
    nome.trim().length > 0 && !championSelecionado
      ? championsRiot
          .filter((champion) =>
            champion.nome.toLowerCase().includes(nome.toLowerCase())
          )
          .slice(0, 8)
      : [];

  if (carregandoInicial) {
    return <h1 className="loading">Carregando campeões...</h1>;
  }

  if (erro) {
    return <h1 className="error">{erro}</h1>;
  }

  if (tela === "cadastro") {
    return (
      <ChampionForm
        nome={nome}
        maestria={maestria}
        setNome={setNome}
        setMaestria={setMaestria}
        onSubmit={cadastrarChampion}
        sugestoes={sugestoesChampions}
        onSelecionarSugestao={selecionarSugestao}
        championSelecionado={championSelecionado}
        onNomeChange={(valor) => {
          setNome(valor);
          setChampionSelecionado(null);
        }}
        onVoltar={() => {
          setTela("lista");
          setNome("");
          setMaestria("");
          setChampionSelecionado(null);
        }}
      />
    );
  }

  return (
    <main className="app-container">
      <h1 className="app-title">Escolha seu Campeão</h1>

      <p className="app-subtitle">
        Gerencie seus campeões, acompanhe suas maestrias e organize sua lista
        com busca, filtros e paginação.
      </p>

      <button
        className="primary-button"
        type="button"
        onClick={() => {
          playTransitionSound();
          setTela("cadastro");
          setNome("");
          setMaestria("");
          setChampionSelecionado(null);
        }}
      >
        Cadastrar Champ
      </button>

      <div className="controls-panel">
        <input
          className="input-field"
          type="text"
          placeholder="Buscar campeão pelo nome..."
          value={busca}
          onChange={(event) => {
            setBusca(event.target.value);
            setPagina(1);
          }}
        />

        <select
          className="select-field"
          value={ordem}
          onChange={(event) => {
            setOrdem(event.target.value);
            setPagina(1);
          }}
        >
          <option value="recentes">Mais recentes</option>
          <option value="maior_maestria">Maior maestria</option>
          <option value="menor_maestria">Menor maestria</option>
          <option value="nome_az">Nome A-Z</option>
          <option value="nome_za">Nome Z-A</option>
        </select>
      </div>

      {champions.length === 0 && (
        <p className="empty-message">Nenhum campeão cadastrado ainda.</p>
      )}

      {champions.map((champion) => (
        <ChampionCard
          key={champion.id}
          champion={champion}
          championRiot={encontrarChampionPorNome(champion.nome, championsRiot)}
          championsRiot={championsRiot}
          editandoId={editandoId}
          editNome={editNome}
          editMaestria={editMaestria}
          setEditNome={setEditNome}
          setEditMaestria={setEditMaestria}
          iniciarEdicao={iniciarEdicao}
          cancelarEdicao={cancelarEdicao}
          salvarEdicao={salvarEdicao}
          excluirChampion={abrirPopupExcluir}
        />
      ))}

      <div className="pagination">
        <button
          type="button"
          disabled={pagina <= 1}
          onClick={() => setPagina(pagina - 1)}
          className="card-button"
        >
          Anterior
        </button>

        <span>
          Página {pagina} de {totalPaginas}
        </span>

        <button
          type="button"
          disabled={pagina >= totalPaginas}
          onClick={() => setPagina(pagina + 1)}
          className="card-button"
        >
          Próxima
        </button>
      </div>

      {popupExcluir && championParaExcluir && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <span className="delete-modal-kicker">Confirmar exclusão</span>

            <h2>Excluir campeão?</h2>

            <p>
              Você está prestes a excluir{" "}
              <strong>{championParaExcluir.nome}</strong> da sua lista.
            </p>

            <p className="delete-modal-warning">
              Essa ação não poderá ser desfeita.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="card-button"
                onClick={fecharPopupExcluir}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="card-button danger"
                onClick={excluirChampion}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Champions;