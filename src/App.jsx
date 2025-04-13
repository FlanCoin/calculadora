// App.jsx con filtros por mercados contradictorios y diseño responsive

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const mercadosAplicables = [
  { mercado: "Ambos marcan: Sí / No", clave: "both_teams_to_score" },
  { mercado: "Total goles 1T: +0.5 / 0-0", clave: "totals" },
  { mercado: "Par / Impar goles", clave: "odd_or_even" },
  { mercado: "1X / Gana visitante", clave: "double_chance" }
];

export default function App() {
  const [modo, setModo] = useState("manual");
  const [stake, setStake] = useState(100);
  const [ganancia, setGanancia] = useState(10);
  const [cuotaA, setCuotaA] = useState(1.3);
  const [cuotaB, setCuotaB] = useState(3.5);
  const [resultados, setResultados] = useState([]);
  const [cuotas, setCuotas] = useState([]);

  useEffect(() => {
    const fetchCuotas = async () => {
      const apiKey = import.meta.env.VITE_ODDS_API_KEY;
      try {
        const response = await axios.get(
          `https://api.the-odds-api.com/v4/sports/soccer/odds`,
          {
            params: {
              apiKey,
              regions: "eu",
              markets: "both_teams_to_score,totals,odd_or_even,double_chance",
              oddsFormat: "decimal",
            },
          }
        );
        setCuotas(response.data.slice(0, 20));
      } catch (error) {
        console.error("Error cargando cuotas reales:", error);
        setCuotas([]);
      }
    };
    fetchCuotas();
  }, []);

  const calcularManual = () => {
    for (let a = 1; a < stake; a++) {
      const b = stake - a;
      const ganadoA = a * cuotaA;
      const ganadoB = b * cuotaB;
      if (Math.abs(ganadoA - stake) <= 1 && ganadoB - stake >= ganancia) {
        setResultados([
          {
            A: a.toFixed(2),
            B: b.toFixed(2),
            cuotaA,
            cuotaB,
            ganaB: (ganadoB - stake).toFixed(2),
          },
        ]);
        return;
      }
    }
    setResultados(["imposible"]);
  };

  const calcularAutomatico = () => {
    const combinaciones = [];
    for (let ca = 1.2; ca <= 3.5; ca += 0.05) {
      for (let a = 1; a < stake; a++) {
        const b = stake - a;
        const cb = (stake + ganancia) / b;
        const ganadoA = a * ca;
        const ganadoB = b * cb;
        if (Math.abs(ganadoA - stake) <= 1 && ganadoB - stake >= ganancia) {
          combinaciones.push({
            A: a.toFixed(2),
            B: b.toFixed(2),
            cuotaA: ca.toFixed(2),
            cuotaB: cb.toFixed(2),
            ganaB: (ganadoB - stake).toFixed(2),
          });
        }
      }
    }
    if (combinaciones.length > 0) setResultados(combinaciones.slice(0, 50));
    else setResultados(["imposible"]);
  };

  const usarCuotas = (cuota1, cuota2) => {
    setCuotaA(cuota1);
    setCuotaB(cuota2);
    setModo("manual");
  };

  return (
    <div className="app">
      <h1>Calculadora de Apuestas Contradictorias</h1>

      <div className="input-group">
        <label>Modo:</label>
        <select onChange={(e) => setModo(e.target.value)} value={modo}>
          <option value="manual">Manual (cuotas reales)</option>
          <option value="automatico">Automático (cuotas calculadas)</option>
        </select>
      </div>

      <div className="input-group">
        <label>Inversión total (€):</label>
        <input type="number" value={stake} onChange={(e) => setStake(+e.target.value)} />
      </div>
      <div className="input-group">
        <label>Ganancia deseada si gana B (€):</label>
        <input type="number" value={ganancia} onChange={(e) => setGanancia(+e.target.value)} />
      </div>

      {modo === "manual" && (
        <>
          <div className="input-group">
            <label>Cuota A:</label>
            <input type="number" step="0.01" value={cuotaA} onChange={(e) => setCuotaA(+e.target.value)} />
          </div>
          <div className="input-group">
            <label>Cuota B:</label>
            <input type="number" step="0.01" value={cuotaB} onChange={(e) => setCuotaB(+e.target.value)} />
          </div>
        </>
      )}

      <button onClick={modo === "manual" ? calcularManual : calcularAutomatico}>Calcular</button>

      <div className="resultados">
        {resultados[0] === "imposible" ? (
          <p className="error">No es posible con estas cuotas. Cambiá de camello.</p>
        ) : (
          resultados.map((r, i) => (
            <div
              className={`resultado ${r.cuotaB < 5 ? "probable" : "improbable"}`}
              key={i}
            >
              <div className="fila fila-cuotas">
                <div><strong>Cuota A:</strong> {r.cuotaA}</div>
                <div><strong>Cuota B:</strong> {r.cuotaB}</div>
              </div>
              <div className="fila fila-importes">
                <div><strong>A:</strong> {r.A} €</div>
                <div><strong>B:</strong> {r.B} €</div>
                <div><strong>Ganancia:</strong> {r.ganaB} €</div>
              </div>
            </div>
          ))
        )}
      </div>

      <h2>Cuotas Reales (en vivo / pre)</h2>
      {cuotas.length === 0 && <p>Cargando cuotas...</p>}
      <div className="cuotas">
        {cuotas.map((partido, i) => (
          <div className="partido" key={i}>
            <h3>{partido.home_team} vs {partido.away_team}</h3>
            {partido.bookmakers.map((book, j) => (
              <div key={j}>
                <strong>{book.title}</strong>
                {book.markets.filter(m => ["both_teams_to_score", "totals", "odd_or_even", "double_chance"].includes(m.key)).map((market, k) => (
                  <div key={k} style={{ marginTop: "0.5rem" }}>
                    <em>{market.key}</em>
                    <div className="cuota-bloque">
                      {market.outcomes.map((outcome, z) => (
                        <button
                          key={z}
                          className="cuota-btn"
                          onClick={() => usarCuotas(...market.outcomes.map(o => o.price))}
                        >
                          {outcome.name} @ {outcome.price}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <h2>Mercados Contradictorios Aplicables</h2>
      <table className="tabla-mercados">
        <thead>
          <tr>
            <th>Mercado</th>
            <th>Clave API</th>
          </tr>
        </thead>
        <tbody>
          {mercadosAplicables.map((m, i) => (
            <tr key={i}>
              <td>{m.mercado}</td>
              <td>{m.clave}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}