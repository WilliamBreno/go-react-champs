import { useState } from "react";

import { formatarDificuldadeChampion } from "../services/riotApi";
import { buscarMetaChampion, salvarMetaChampion } from "../services/metaApi";
import { useAuth } from "../context/AuthContext";

const LANES = ["Top", "Jungle", "Mid", "ADC", "Support"];

const PRIORIDADES = ["Main", "Secundário", "Pocket Pick", "Testando"];

const STATUS_POOL = ["Dominado", "Treinando", "Quero aprender", "Pausado"];

function formatarPercentual(valor) {
  const numero = Number(valor || 0);

  return `${numero.toFixed(1)}%`;
}

function ChampionCard({
  champion,
  championRiot,
  championsRiot,
  editandoId,
  editNome,
  editLane,
  editPrioridade,
  editStatus,
  editNotes,
  setEditNome,
  setEditLane,
  setEditPrioridade,
  setEditStatus,
  setEditNotes,
  iniciarEdicao,
  cancelarEdicao,
  salvarEdicao,
  excluirChampion,
}) {
  const { token } = useAuth();

  const [metaLocal, setMetaLocal] = useState(null);
  const [carregandoMeta, setCarregandoMeta] = useState(false);
  const [erroMeta, setErroMeta] = useState("");

  const estaEditando = editandoId === champion.id;

  const imagemChampion = championRiot?.imagem;
  const tituloChampion = championRiot?.titulo;
  const dificuldade = champion.riotDifficulty || championRiot?.dificuldade || 0;

  const metaStatus = metaLocal?.metaStatus || champion.metaStatus;
  const metaRankPosition =
    metaLocal?.metaRankPosition || champion.metaRankPosition;
  const metaWinRate = metaLocal?.metaWinRate || champion.metaWinRate;
  const metaPickRate = metaLocal?.metaPickRate || champion.metaPickRate;

  const sugestoesEdicao =
    editNome.trim().length > 0
      ? championsRiot
          .filter((item) =>
            item.nome.toLowerCase().includes(editNome.toLowerCase())
          )
          .slice(0, 8)
      : [];

  async function atualizarMeta() {
    if (!token) {
      return;
    }

    try {
      setCarregandoMeta(true);
      setErroMeta("");

      const meta = await buscarMetaChampion(token, champion.nome, champion.lane);

      await salvarMetaChampion(token, champion.id, meta);

      setMetaLocal(meta);
    } catch (erro) {
      console.error("Erro ao atualizar meta:", erro);
      setErroMeta(erro.message || "Erro ao atualizar meta.");
    } finally {
      setCarregandoMeta(false);
    }
  }

  if (estaEditando) {
    return (
      <article className="card champion-card">
        {imagemChampion && (
          <img
            className="champion-image"
            src={imagemChampion}
            alt={champion.nome}
          />
        )}

        <div className="champion-card-content">
          <div className="autocomplete-wrapper">
            <label className="field-label">Campeão</label>

            <input
              className="input-field champion-name-input"
              type="text"
              value={editNome}
              onChange={(event) => setEditNome(event.target.value)}
              autoComplete="off"
            />

            {sugestoesEdicao.length > 0 && (
              <div className="suggestions-list edit-suggestions-list">
                {sugestoesEdicao.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="suggestion-item"
                    onClick={() => setEditNome(item.nome)}
                  >
                    <img src={item.imagem} alt={item.nome} />

                    <span>
                      <strong>{item.nome}</strong>
                      <small>{item.titulo}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="field-label">Lane</label>
          <select
            className="select-field"
            value={editLane}
            onChange={(event) => setEditLane(event.target.value)}
          >
            {LANES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="field-label">Prioridade</label>
          <select
            className="select-field"
            value={editPrioridade}
            onChange={(event) => setEditPrioridade(event.target.value)}
          >
            {PRIORIDADES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="field-label">Status</label>
          <select
            className="select-field"
            value={editStatus}
            onChange={(event) => setEditStatus(event.target.value)}
          >
            {STATUS_POOL.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label className="field-label">Notas</label>
          <textarea
            className="input-field notes-field"
            value={editNotes}
            onChange={(event) => setEditNotes(event.target.value)}
            rows={4}
          />

          <button
            type="button"
            className="card-button"
            onClick={() => salvarEdicao(champion.id)}
          >
            Salvar
          </button>

          <button
            type="button"
            className="card-button danger"
            onClick={cancelarEdicao}
          >
            Cancelar
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="card champion-card">
      {imagemChampion && (
        <img
          className="champion-image"
          src={imagemChampion}
          alt={champion.nome}
        />
      )}

      <div className="champion-card-content">
        <h2>{champion.nome}</h2>

        {tituloChampion && <p className="champion-title">{tituloChampion}</p>}

        <div className="pool-tags">
          <span>{champion.lane}</span>
          <span>{champion.prioridade}</span>
          <span>{champion.status}</span>
          <span>{formatarDificuldadeChampion(dificuldade)}</span>
        </div>

        <div className="meta-box">
          <div>
            <strong>Meta atual</strong>

            <span
              className={
                metaStatus === "Forte"
                  ? "meta-badge strong"
                  : metaStatus === "Ok"
                  ? "meta-badge ok"
                  : metaStatus === "Fraco"
                  ? "meta-badge weak"
                  : "meta-badge"
              }
            >
              {metaStatus || "Não analisado"}
            </span>
          </div>

          <div className="meta-stats">
            <small>Rank: {metaRankPosition ? `Top ${metaRankPosition}` : "-"}</small>
            <small>Winrate: {formatarPercentual(metaWinRate)}</small>
            <small>Pickrate: {formatarPercentual(metaPickRate)}</small>
          </div>

          {erroMeta && <small className="meta-error">{erroMeta}</small>}

          <button
            type="button"
            className="card-button"
            onClick={atualizarMeta}
            disabled={carregandoMeta}
          >
            {carregandoMeta ? "Atualizando..." : "Atualizar meta"}
          </button>
        </div>

        {champion.notes && (
          <p className="pool-notes">
            <strong>Notas:</strong> {champion.notes}
          </p>
        )}

        <button
          type="button"
          className="card-button"
          onClick={() => iniciarEdicao(champion)}
        >
          Editar
        </button>

        <button
          type="button"
          className="card-button danger"
          onClick={() => excluirChampion(champion)}
        >
          Remover
        </button>
      </div>
    </article>
  );
}

export default ChampionCard;