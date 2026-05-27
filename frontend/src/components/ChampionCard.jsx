import {
  formatarMaestriaInput,
  formatarMaestriaVisual,
} from "../utils/numberFormat";

function ChampionCard({
  champion,
  championRiot,
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

            <input
              className="input-field"
              type="text"
              value={editNome}
              onChange={(event) => setEditNome(event.target.value)}
              placeholder="Nome do campeão"
            />

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

            {championRiot && <p className="champion-title">{championRiot.titulo}</p>}

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
              onClick={() => excluirChampion(champion.id)}
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