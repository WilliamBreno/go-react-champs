import { useEffect, useRef, useState } from "react";

import {
  formatarMaestriaInput,
  formatarMaestriaVisual,
} from "../utils/numberFormat";

function ChampionCard({
  champion,
  championRiot,
  championsRiot = [],
  editandoId,
  editNome,
  editMaestria,
  setEditNome,
  setEditMaestria,
  iniciarEdicao,
  cancelarEdicao,
  salvarEdicao,
  excluirChampion,
}) {
  const estaEditando = editandoId === champion.id;

  const [mostrarSugestoesEdicao, setMostrarSugestoesEdicao] = useState(false);
  const autocompleteEditRef = useRef(null);

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (
        autocompleteEditRef.current &&
        !autocompleteEditRef.current.contains(event.target)
      ) {
        setMostrarSugestoesEdicao(false);
      }
    }

    document.addEventListener("mousedown", fecharAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
    };
  }, []);

  const sugestoesEdicao =
    estaEditando && editNome.trim().length > 0
      ? championsRiot
          .filter((championRiotItem) =>
            championRiotItem.nome
              .toLowerCase()
              .includes(editNome.toLowerCase())
          )
          .slice(0, 8)
      : [];

  function selecionarSugestaoEdicao(championRiotItem) {
    setEditNome(championRiotItem.nome);
    setMostrarSugestoesEdicao(false);
  }

  return (
    <section className="card champion-card">
      {championRiot && !estaEditando && (
        <img
          className="champion-image"
          src={championRiot.imagem}
          alt={champion.nome}
        />
      )}

      <div className="champion-card-content">
        {estaEditando ? (
          <>
            <h3>Editando campeão</h3>

            <label className="field-label">Nome:</label>

            <div className="autocomplete-wrapper" ref={autocompleteEditRef}>
              <input
                className="input-field champion-name-input"
                type="text"
                value={editNome}
                onFocus={() => {
                  if (editNome.trim().length > 0) {
                    setMostrarSugestoesEdicao(true);
                  }
                }}
                onChange={(event) => {
                  setEditNome(event.target.value);
                  setMostrarSugestoesEdicao(true);
                }}
                placeholder="Nome do campeão"
                autoComplete="off"
              />

              {mostrarSugestoesEdicao && sugestoesEdicao.length > 0 && (
                <div className="suggestions-list edit-suggestions-list">
                  {sugestoesEdicao.map((championRiotItem) => (
                    <button
                      key={championRiotItem.id}
                      type="button"
                      className="suggestion-item"
                      onClick={() => selecionarSugestaoEdicao(championRiotItem)}
                    >
                      <img
                        src={championRiotItem.imagem}
                        alt={championRiotItem.nome}
                      />

                      <span>
                        <strong>{championRiotItem.nome}</strong>
                        <small>{championRiotItem.titulo}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="field-label">Maestria:</label>

            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              value={editMaestria}
              onChange={(event) => {
                const valorFormatado = formatarMaestriaInput(event.target.value);
                setEditMaestria(valorFormatado);
              }}
              placeholder="Maestria"
            />

            <button
              className="card-button"
              type="button"
              onClick={() => salvarEdicao(champion.id)}
            >
              Salvar
            </button>

            <button
              className="card-button danger"
              type="button"
              onClick={cancelarEdicao}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <h2>{champion.nome}</h2>

            {championRiot && (
              <p className="champion-title">{championRiot.titulo}</p>
            )}

            <p>
              <strong>Maestria:</strong>{" "}
              {formatarMaestriaVisual(champion.maestria)}
            </p>

            <button
              className="card-button"
              type="button"
              onClick={() => iniciarEdicao(champion)}
            >
              Editar
            </button>

            <button
              className="card-button danger"
              type="button"
              onClick={() => excluirChampion(champion)}
            >
              Excluir
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default ChampionCard;