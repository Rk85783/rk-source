import { useEffect, useState } from "react";
import { getHealth } from "../lib/api";

const Home = () => {
  const [health, setHealth] = useState({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    getHealth()
      .then((res) => {
        if (active) setHealth({ loading: false, data: res.data, error: null });
      })
      .catch((err) => {
        if (active)
          setHealth({ loading: false, data: null, error: err.message });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <h1>Rk-source</h1>

      {health.loading && <p>Checking API...</p>}

      {health.error && <p role="alert">API unreachable: {health.error}</p>}

      {health.data && (
        <section>
          <p>API status: {health.data.status}</p>
          <p>Environment: {health.data.env}</p>
          <p>Database: {health.data.database.state}</p>
        </section>
      )}
    </main>
  );
};

export default Home;
