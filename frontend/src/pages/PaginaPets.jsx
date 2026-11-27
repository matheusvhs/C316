import { useEffect, useState } from "react";
import Aviso from "../components/Aviso.jsx";
import FiltrosPets from "../components/FiltrosPets.jsx";
import PetCard from "../components/PetCard.jsx";
import { listarPets } from "../services/pets.js";

const ESPERA_DA_BUSCA_MS = 300;

export default function PaginaPets() {
  const [filtros, setFiltros] = useState({ busca: "", especie: "" });
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    const espera = setTimeout(async () => {
      try {
        const resultado = await listarPets(filtros);
        if (ativo) setPets(resultado);
      } catch (e) {
        if (ativo) setErro(e.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }, ESPERA_DA_BUSCA_MS);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [filtros]);

  const filtrando = filtros.busca.trim() !== "" || filtros.especie !== "";

  let conteudo;
  if (carregando) {
    conteudo = <Aviso>Carregando pets...</Aviso>;
  } else if (erro) {
    conteudo = (
      <Aviso tipo="erro">
        <p>{erro}</p>
        <button
          type="button"
          onClick={() => setFiltros((atuais) => ({ ...atuais }))}
          className="mt-2 font-medium underline"
        >
          Tentar novamente
        </button>
      </Aviso>
    );
  } else if (pets.length === 0) {
    conteudo = (
      <Aviso>
        {filtrando
          ? "Nenhum pet encontrado com esses filtros."
          : "Nenhum pet cadastrado ainda."}
      </Aviso>
    );
  } else {
    conteudo = (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <li key={pet.id}>
            <PetCard pet={pet} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-slate-800">Pets</h2>
      <FiltrosPets filtros={filtros} onChange={setFiltros} />
      {conteudo}
    </section>
  );
}
