import { useEffect, useState } from "react";

import ChampionForm from "../components/ChampionForm";
import ChampionCard from "../components/ChampionCard";

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

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editMaestria, setEditMaestria] = useState("");

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [limite] = useState(5);

  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [erro, setErro] = useState("");

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

    if (!maestria || Number(maestria) <= 0) {
      alert("Digite uma maestria maior que zero.");
      return;
    }

    const novoChampion = {
      nome: nome.trim(),
      maestria: Number(maestria),
    };

    try {
      await cadastrarChampionAPI(novoChampion);

      setNome("");
      setMaestria("");
      setMostrarFormulario(false);
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
    setEditMaestria(String(champion.maestria));
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

    if (!editMaestria || Number(editMaestria) <= 0) {
      alert("Digite uma maestria maior que zero.");
      return;
    }

    const championAtualizado = {
      nome: editNome.trim(),
      maestria: Number(editMaestria),
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

  async function excluirChampion(id) {
    const confirmar = confirm("Tem certeza que deseja excluir esse campeão?");

    if (!confirmar) {
      return;
    }

    try {
      await excluirChampionAPI(id);

      await carregarChampions(busca, ordem, pagina);
    } catch (erro) {
      console.error("Erro ao excluir campeão:", erro);
      alert("Erro ao excluir campeão.");
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarChampions(busca, ordem, pagina);
    }, 500);

    return () => clearTimeout(timer);
  }, [busca, ordem, pagina]);

  if (carregandoInicial) {
    return <h1 className="loading">Carregando campeões...</h1>;
  }

  if (erro) {
    return <h1 className="error">{erro}</h1>;
  }

return (
  <main className="app-container">
    <h1 className="app-title">Escolha seu Campeão</h1>

    <p className="app-subtitle">
      Gerencie seus campeões, acompanhe suas maestrias e organize sua lista
      com busca, filtros e paginação.
    </p>

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

    <button
      className="primary-button"
      type="button"
      onClick={() => setMostrarFormulario(!mostrarFormulario)}
    >
      {mostrarFormulario ? "Fechar cadastro" : "Cadastrar Champ"}
    </button>

    {mostrarFormulario && (
      <ChampionForm
        nome={nome}
        maestria={maestria}
        setNome={setNome}
        setMaestria={setMaestria}
        onSubmit={cadastrarChampion}
      />
    )}

    {champions.length === 0 && (
      <p className="empty-message">Nenhum campeão cadastrado ainda.</p>
    )}

    {champions.map((champion) => (
      <ChampionCard
        key={champion.id}
        champion={champion}
        editandoId={editandoId}
        editNome={editNome}
        editMaestria={editMaestria}
        setEditNome={setEditNome}
        setEditMaestria={setEditMaestria}
        iniciarEdicao={iniciarEdicao}
        cancelarEdicao={cancelarEdicao}
        salvarEdicao={salvarEdicao}
        excluirChampion={excluirChampion}
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
  </main>
);
}

export default Champions;