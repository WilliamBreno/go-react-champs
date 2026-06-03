import { formatarDificuldadeChampion } from "../services/riotApi";

const LANES = ["Top", "Jungle", "Mid", "ADC", "Support"];

const PRIORIDADES = ["Main", "Secundário", "Pocket Pick", "Testando"];

const STATUS_POOL = ["Dominado", "Treinando", "Quero aprender", "Pausado"];

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
  const estaEditando = editandoId === champion.id;

  const imagemChampion = championRiot?.imagem;
  const tituloChampion = championRiot?.titulo;
  const dificuldade =
    champion.riotDifficulty || championRiot?.dificuldade || 0;

  const sugestoesEdicao =
    editNome.trim().length > 0
      ? championsRiot
          .filter((item) =>
            item.nome.toLowerCase().includes(editNome.toLowerCase())
          )
          .slice(0, 8)
      : [];

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

          <button type="button" className="card-button danger" onClick={cancelarEdicao}>
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