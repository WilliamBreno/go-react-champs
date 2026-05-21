function ChampionForm({
  nome,
  maestria,
  setNome,
  setMaestria,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="form-container">
      <h2>Cadastrar campeão</h2>

      <input
        className="input-field"
        type="text"
        placeholder="Nome do campeão"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
      />

      <input
        className="input-field"
        type="number"
        placeholder="Maestria"
        value={maestria}
        onChange={(event) => setMaestria(event.target.value)}
      />

      <button type="submit" className="primary-button">
        Cadastrar
      </button>
    </form>
  );
}

export default ChampionForm;