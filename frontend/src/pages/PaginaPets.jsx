import { useCallback, useEffect, useState } from "react";
import Aviso from "../components/Aviso.jsx";
import FiltrosPets from "../components/FiltrosPets.jsx";
import FormularioPet from "../components/FormularioPet.jsx";
import Modal from "../components/Modal.jsx";
import PetCard from "../components/PetCard.jsx";
import { atualizarPet, criarPet, listarPets } from "../services/pets.js";

const ESPERA_DA_BUSCA_MS = 300;

export default function PaginaPets() {
  const [filtros, setFiltros] = useState({ busca: "", especie: "" });
  const [pets, setPets] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [sucesso, setSucesso] = useState(null);

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

  const recarregar = () => setFiltros((atuais) => ({ ...atuais }));

  const abrirFormulario = (pet = null) => {
    setSucesso(null);
    setFormulario({ pet });
  };
  const fecharFormulario = useCallback(() => setFormulario(null), []);

  const salvar = async (dados) => {
    const pet = formulario.pet;
    if (pet) await atualizarPet(pet.id, dados);
    else await criarPet(dados);
    setFormulario(null);
    setSucesso(
      pet ? `${dados.nome} foi atualizado.` : `${dados.nome} foi cadastrado.`,
    );
    recarregar();
  };

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
          onClick={recarregar}
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
            <PetCard pet={pet} onEditar={abrirFormulario} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Pets</h2>
        <button
          type="button"
          onClick={() => abrirFormulario()}
          className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
        >
          Novo pet
        </button>
      </div>
      {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}
      <FiltrosPets filtros={filtros} onChange={setFiltros} />
      {conteudo}
      {formulario && (
        <Modal
          titulo={formulario.pet ? `Editar ${formulario.pet.nome}` : "Novo pet"}
          onFechar={fecharFormulario}
        >
          <FormularioPet
            pet={formulario.pet}
            onSalvar={salvar}
            onCancelar={fecharFormulario}
          />
        </Modal>
      )}
    </section>
  );
}
