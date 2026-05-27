import { formatarMaestriaInput } from "../utils/numberFormat";

function ChampionForm({
  nome,
  maestria,
  setNome,
  setMaestria,
  onSubmit,
  sugestoes = [],
  onSelecionarSugestao,
  onVoltar,
}) {
  return (
    <main className="app-container">
      <h1 className="app-title">Cadastrar Campeão</h1>

      <p className="app-subtitle">
        Selecione um campeão oficial da Riot e informe sua maestria.
      </p>

      <button type="button" className="card-button" onClick={onVoltar}>
        Voltar
      </button>

      <form onSubmit={onSubmit} className="form-container">
        <h2>Novo campeão</h2>

        <div className="autocomplete-wrapper">
          <input
            className="input-field"
            type="text"
            placeholder="Nome do campeão"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
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

        <input
          className="input-field"
          type="text"
          inputMode="numeric"
          placeholder="Maestria"
          value={maestria}
          onChange={(event) => {
            const valorFormatado = formatarMaestriaInput(event.target.value);
            setMaestria(valorFormatado);
          }}
        />

        <button type="submit" className="primary-button">
          Cadastrar
        </button>
      </form>
    </main>
  );
}

export default ChampionForm;