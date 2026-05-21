import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="hero">
      <section className="hero-content">
        <p className="hero-kicker">Projeto Go + React</p>

        <h1 className="hero-title">Gerencie seus Campeões</h1>

        <p className="hero-text">
          Um sistema inspirado no universo de League of Legends para cadastrar,
          buscar, editar, ordenar e acompanhar a maestria dos seus campeões.
        </p>

        <div className="hero-actions">
          <Link to="/champions">
            <button className="primary-button" type="button">
              Ver Champions
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Home;