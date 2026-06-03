import { useEffect, useState } from "react";

import ChampionForm from "../components/ChampionForm";
import ChampionCard from "../components/ChampionCard";

import { useAuth } from "../context/AuthContext";

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

const LANES_FILTRO = ["Todos", "Top", "Jungle", "Mid", "ADC", "Support"];

const STATUS_FILTRO = [
  "Todos",
  "Dominado",
  "Treinando",
  "Quero aprender",
  "Pausado",
];

function Champions() {
  const { token } = useAuth();

  const [champions, setChampions] = useState([]);

  const [nome, setNome] = useState("");
  const [lane, setLane] = useState("Mid");
  const [prioridade, setPrioridade] = useState("Testando");
  const [status, setStatus] = useState("Quero aprender");
  const [notes, setNotes] = useState("");

  const [busca, setBusca] = useState("");
  const [laneFiltro, setLaneFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [ordem, setOrdem] = useState("recentes");

  const [tela, setTela] = useState("lista");

  const [championsRiot, setChampionsRiot] = useState([]);
  const [championSelecionado, setChampionSelecionado] = useState(null);

  const [editandoId, setEditandoId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editLane, setEditLane] = useState("Mid");
  const [editPrioridade, setEditPrioridade] = useState("Testando");
  const [editStatus, setEditStatus] = useState("Quero aprender");
  const [editNotes, setEditNotes] = useState("");

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [limite] = useState(5);

  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [erro, setErro] = useState("");

  const [popupExcluir, setPopupExcluir] = useState(false);
  const [championParaExcluir, setChampionParaExcluir] = useState(null);

  function limparFormulario() {
    setNome("");
    setLane("Mid");
    setPrioridade("Testando");
    setStatus("Quero aprender");
    setNotes("");
    setChampionSelecionado(null);
  }

  async function carregarChampions({
    nomeBusca = busca,
    laneBusca = laneFiltro,
    statusBusca = statusFiltro,
    ordemBusca = ordem,
    paginaBusca = pagina,
  } = {}) {
    if (!token) {
      return;
    }

    try {
      const resposta = await listarChampions({
        token,
        nome: nomeBusca,
        lane: laneBusca,
        status: statusBusca,
        ordem: ordemBusca,
        page: paginaBusca,
        limit: limite,
      });

      setChampions(resposta.dados || []);
      setPagina(resposta.pagina || 1);
      setTotalPaginas(resposta.totalPaginas || 1);
      setErro("");
    } catch (erro) {
      console.error("Erro ao carregar pool:", erro);
      setErro(`Não foi possível carregar seu pool. ${erro.message}`);
    } finally {
      setCarregandoInicial(false);
    }
  }

  async function cadastrarChampion(event) {
    event.preventDefault();

    if (!token) {
      alert("Usuário não autenticado.");
      return;
    }

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

    const novoChampion = {
      nome: championEscolhido.nome,
      lane,
      prioridade,
      status,
      notes,
      riotDifficulty: championEscolhido.dificuldade || 0,
    };

    try {
      await cadastrarChampionAPI(token, novoChampion);

      limparFormulario();
      setTela("lista");
      setPagina(1);

      await carregarChampions({
        nomeBusca: busca,
        laneBusca: laneFiltro,
        statusBusca: statusFiltro,
        ordemBusca: ordem,
        paginaBusca: 1,
      });
    } catch (erro) {
      console.error("Erro ao adicionar ao pool:", erro);
      alert(`Erro ao adicionar ao pool. ${erro.message}`);
    }
  }

  function iniciarEdicao(champion) {
    setEditandoId(champion.id);
    setEditNome(champion.nome);
    setEditLane(champion.lane || "Mid");
    setEditPrioridade(champion.prioridade || "Testando");
    setEditStatus(champion.status || "Quero aprender");
    setEditNotes(champion.notes || "");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditNome("");
    setEditLane("Mid");
    setEditPrioridade("Testando");
    setEditStatus("Quero aprender");
    setEditNotes("");
  }

  async function salvarEdicao(id) {
    if (!token) {
      alert("Usuário não autenticado.");
      return;
    }

    if (!editNome.trim()) {
      alert("Digite o nome do campeão.");
      return;
    }

    const championEditado = encontrarChampionPorNome(editNome, championsRiot);

    if (!championEditado) {
      alert("Selecione um campeão válido da lista de sugestões.");
      return;
    }

    const championAtualizado = {
      nome: championEditado.nome,
      lane: editLane,
      prioridade: editPrioridade,
      status: editStatus,
      notes: editNotes,
      riotDifficulty: championEditado.dificuldade || 0,
    };

    try {
      await editarChampionAPI(token, id, championAtualizado);

      cancelarEdicao();

      await carregarChampions({
        nomeBusca: busca,
        laneBusca: laneFiltro,
        statusBusca: statusFiltro,
        ordemBusca: ordem,
        paginaBusca: pagina,
      });
    } catch (erro) {
      console.error("Erro ao editar campeão do pool:", erro);
      alert(`Erro ao editar campeão do pool. ${erro.message}`);
    }
  }

  function abrirPopupExcluir(champion) {
    setChampionParaExcluir(champion);
    setPopupExcluir(true);
  }

  function fecharPopupExcluir() {
    setChampionParaExcluir(null);
    setPopupExcluir(false);
  }

  async function excluirChampion() {
    if (!token) {
      alert("Usuário não autenticado.");
      return;
    }

    if (!championParaExcluir) {
      return;
    }

    try {
      await excluirChampionAPI(token, championParaExcluir.id);

      fecharPopupExcluir();

      await carregarChampions({
        nomeBusca: busca,
        laneBusca: laneFiltro,
        statusBusca: statusFiltro,
        ordemBusca: ordem,
        paginaBusca: pagina,
      });
    } catch (erro) {
      console.error("Erro ao remover do pool:", erro);
      alert(`Erro ao remover do pool. ${erro.message}`);
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
    if (!token) {
      return;
    }

    const timer = setTimeout(() => {
      carregarChampions({
        nomeBusca: busca,
        laneBusca: laneFiltro,
        statusBusca: statusFiltro,
        ordemBusca: ordem,
        paginaBusca: pagina,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [token, busca, laneFiltro, statusFiltro, ordem, pagina]);

  const sugestoesChampions =
    nome.trim().length > 0 && !championSelecionado
      ? championsRiot
          .filter((champion) =>
            champion.nome.toLowerCase().includes(nome.toLowerCase())
          )
          .slice(0, 8)
      : [];

  if (carregandoInicial) {
    return <h1 className="loading">Carregando pool...</h1>;
  }

  if (erro) {
    return <h1 className="error">{erro}</h1>;
  }

  if (tela === "cadastro") {
    return (
      <ChampionForm
        nome={nome}
        lane={lane}
        prioridade={prioridade}
        status={status}
        notes={notes}
        setNome={setNome}
        setLane={setLane}
        setPrioridade={setPrioridade}
        setStatus={setStatus}
        setNotes={setNotes}
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
          limparFormulario();
        }}
      />
    );
  }

  return (
    <main className="app-container">
      <h1 className="app-title">Meu Pool</h1>

      <p className="app-subtitle">
        Organize os campeões que você joga, treina ou quer aprender. A
        dificuldade é preenchida automaticamente pelo Data Dragon da Riot.
      </p>

      <button
        className="primary-button"
        type="button"
        onClick={() => {
          setTela("cadastro");
          limparFormulario();
        }}
      >
        Adicionar ao Pool
      </button>

      <div className="controls-panel pool-controls">
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
          value={laneFiltro}
          onChange={(event) => {
            setLaneFiltro(event.target.value);
            setPagina(1);
          }}
        >
          {LANES_FILTRO.map((item) => (
            <option key={item} value={item}>
              {item === "Todos" ? "Todas as lanes" : item}
            </option>
          ))}
        </select>

        <select
          className="select-field"
          value={statusFiltro}
          onChange={(event) => {
            setStatusFiltro(event.target.value);
            setPagina(1);
          }}
        >
          {STATUS_FILTRO.map((item) => (
            <option key={item} value={item}>
              {item === "Todos" ? "Todos os status" : item}
            </option>
          ))}
        </select>

        <select
          className="select-field"
          value={ordem}
          onChange={(event) => {
            setOrdem(event.target.value);
            setPagina(1);
          }}
        >
          <option value="recentes">Mais recentes</option>
          <option value="prioridade">Prioridade</option>
          <option value="status">Status</option>
          <option value="lane">Lane</option>
          <option value="dificuldade">Maior dificuldade</option>
          <option value="nome_az">Nome A-Z</option>
          <option value="nome_za">Nome Z-A</option>
        </select>
      </div>

      {champions.length === 0 && (
        <p className="empty-message">Nenhum campeão no seu pool ainda.</p>
      )}

      {champions.map((champion) => (
        <ChampionCard
          key={champion.id}
          champion={champion}
          championRiot={encontrarChampionPorNome(champion.nome, championsRiot)}
          championsRiot={championsRiot}
          editandoId={editandoId}
          editNome={editNome}
          editLane={editLane}
          editPrioridade={editPrioridade}
          editStatus={editStatus}
          editNotes={editNotes}
          setEditNome={setEditNome}
          setEditLane={setEditLane}
          setEditPrioridade={setEditPrioridade}
          setEditStatus={setEditStatus}
          setEditNotes={setEditNotes}
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
            <span className="delete-modal-kicker">Confirmar remoção</span>

            <h2>Remover do pool?</h2>

            <p>
              Você está prestes a remover{" "}
              <strong>{championParaExcluir.nome}</strong> do seu pool.
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
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Champions;