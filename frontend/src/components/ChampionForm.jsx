import {
  formatarDificuldadeChampion,
} from "../services/riotApi";

const LANES = ["Top", "Jungle", "Mid", "ADC", "Support"];

const PRIORIDADES = ["Main", "Secundário", "Pocket Pick", "Testando"];

const STATUS_POOL = ["Dominado", "Treinando", "Quero aprender", "Pausado"];

function ChampionForm({
  nome,
  lane,
  prioridade,
  status,
  notes,
  setNome,
  setLane,
  setPrioridade,
  setStatus,
  setNotes,
  onSubmit,
  sugestoes,
  onSelecionarSugestao,
  championSelecionado,
  onNomeChange,
  onVoltar,
}) {
  return (
    <main className="app-container">
      <button type="button" className="card-button back-button" onClick={onVoltar}>
        Voltar
      </button>

      <section className="form-container">
        <h2>Adicionar ao Pool</h2>

        <form onSubmit={onSubmit}>
          <label className="field-label">Campeão</label>

          <div className="autocomplete-wrapper">
            <input
              className="input-field champion-name-input"
              type="text"
              placeholder="Digite o nome do campeão..."
              value={nome}
              onChange={(event) => onNomeChange(event.target.value)}
              autoComplete="off"
            />

            {sugestoes.length > 0 && (
              <div className="suggestions-list">
                {sugestoes.map((champion) => (
                  <button
                    key={champion.id}
                    type="button"
                    className="suggestion-item"
                    onClick={() => onSelecionarSugestao(champion)}
                  >
                    <img src={champion.imagem} alt={champion.nome} />

                    <span>
                      <strong>{champion.nome}</strong>
                      <small>{champion.titulo}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {championSelecionado && (
            <div className="selected-champion-preview">
              <img
                src={championSelecionado.imagem}
                alt={championSelecionado.nome}
              />

              <div>
                <strong>{championSelecionado.nome}</strong>
                <small>{championSelecionado.titulo}</small>
                <small>
                  Dificuldade Riot:{" "}
                  {formatarDificuldadeChampion(championSelecionado.dificuldade)}
                </small>
              </div>
            </div>
          )}

          <label className="field-label">Lane</label>
          <select
            className="select-field"
            value={lane}
            onChange={(event) => setLane(event.target.value)}
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
            value={prioridade}
            onChange={(event) => setPrioridade(event.target.value)}
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
            value={status}
            onChange={(event) => setStatus(event.target.value)}
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
            placeholder="Ex: treinar matchup contra Ahri, melhorar farm, testar build..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
          />

          <button type="submit" className="primary-button">
            Adicionar ao Pool
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChampionForm;