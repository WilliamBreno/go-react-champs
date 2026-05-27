import { useEffect, useRef, useState } from "react";
import { formatarMaestriaInput } from "../utils/numberFormat";

function ChampionForm({
  nome,
  maestria,
  setMaestria,
  onSubmit,
  sugestoes = [],
  onSelecionarSugestao,
  onVoltar,
  championSelecionado,
  onNomeChange,
}) {
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target)
      ) {
        setMostrarSugestoes(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
    };
  }, []);

  function selecionarChampion(champion) {
    onSelecionarSugestao(champion);
    setMostrarSugestoes(false);
  }

  return (
    <main className="app-container">
      <h1 className="app-title">Cadastrar Campeão</h1>

      <p className="app-subtitle">
        Selecione um campeão oficial da Riot e informe sua maestria.
      </p>

      <button type="button" className="card-button back-button" onClick={onVoltar}>
        Voltar
      </button>

      <form onSubmit={onSubmit} className="form-container">
        <h2>Novo campeão</h2>

        <label className="field-label">Nome:</label>

        <div className="autocomplete-wrapper" ref={autocompleteRef}>
          <input
            className="input-field champion-name-input"
            type="text"
            placeholder="Digite o nome do campeão"
            value={nome}
            onFocus={() => {
              if (nome.trim().length > 0) {
                setMostrarSugestoes(true);
              }
            }}
            onChange={(event) => {
              onNomeChange(event.target.value);
              setMostrarSugestoes(true);
            }}
            autoComplete="off"
          />

          {mostrarSugestoes && sugestoes.length > 0 && (
            <div className="suggestions-list">
              {sugestoes.map((champion) => (
                <button
                  key={champion.id}
                  type="button"
                  className="suggestion-item"
                  onClick={() => selecionarChampion(champion)}
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

          {championSelecionado && (
            <div className="selected-champion-preview">
              <img
                src={championSelecionado.imagem}
                alt={championSelecionado.nome}
              />

              <div>
                <strong>{championSelecionado.nome}</strong>
                <small>{championSelecionado.titulo}</small>
              </div>
            </div>
          )}
        </div>

        <label className="field-label">Maestria:</label>

        <input
          className="input-field"
          type="text"
          inputMode="numeric"
          placeholder="Ex: 2.000.000"
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