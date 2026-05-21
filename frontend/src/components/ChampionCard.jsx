function ChampionCard({
  champion,
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
    <section className="card">
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
            type="number"
            value={editMaestria}
            onChange={(event) => setEditMaestria(event.target.value)}
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

          <p>
            <strong>Maestria:</strong> {champion.maestria}
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
    </section>
  );
}

export default ChampionCard;