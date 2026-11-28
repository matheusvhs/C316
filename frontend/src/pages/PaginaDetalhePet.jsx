import { useCallback, useEffect, useId, useState } from "react";
import { Link, useParams } from "react-router";
import Aviso from "../components/Aviso.jsx";
import ConfirmarExclusao from "../components/ConfirmarExclusao.jsx";
import FormularioCuidado from "../components/FormularioCuidado.jsx";
import Modal from "../components/Modal.jsx";
import PainelAlertas from "../components/PainelAlertas.jsx";
import ResumoPet from "../components/ResumoPet.jsx";
import TabelaCuidados from "../components/TabelaCuidados.jsx";
import {
  atualizarCuidado,
  criarCuidado,
  excluirCuidado,
  listarCuidados,
  obterAlertas,
} from "../services/cuidados.js";
import { obterPet, obterResumo } from "../services/pets.js";
import {
  formatarData,
  formatarIdade,
  formatarPeso,
  rotuloEspecie,
  rotuloTipo,
} from "../utils/formatacao.js";

export default function PaginaDetalhePet() {
  const { id } = useParams();
  const idTituloRegistro = useId();
  const [detalhes, setDetalhes] = useState(null);
  const [erroDetalhes, setErroDetalhes] = useState(null);
  const [tipo, setTipo] = useState("");
  const [cuidados, setCuidados] = useState([]);
  const [carregandoCuidados, setCarregandoCuidados] = useState(true);
  const [erroCuidados, setErroCuidados] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [chaveFormulario, setChaveFormulario] = useState(0);
  const [cuidadoEmEdicao, setCuidadoEmEdicao] = useState(null);
  const [cuidadoParaExcluir, setCuidadoParaExcluir] = useState(null);

  const carregarDetalhes = useCallback(async () => {
    setErroDetalhes(null);
    try {
      const [pet, resumo, alertas] = await Promise.all([
        obterPet(id),
        obterResumo(id),
        obterAlertas(id),
      ]);
      setDetalhes({ pet, resumo, alertas });
    } catch (e) {
      setErroDetalhes(e);
    }
  }, [id]);

  const carregarCuidados = useCallback(async () => {
    setCarregandoCuidados(true);
    setErroCuidados(null);
    try {
      setCuidados(await listarCuidados(id, { tipo }));
    } catch (e) {
      setErroCuidados(e.message);
    } finally {
      setCarregandoCuidados(false);
    }
  }, [id, tipo]);

  useEffect(() => {
    carregarDetalhes();
  }, [carregarDetalhes]);

  useEffect(() => {
    carregarCuidados();
  }, [carregarCuidados]);

  const aposAlterarCuidados = (mensagem) => {
    setSucesso(mensagem);
    carregarDetalhes();
    carregarCuidados();
  };

  const registrar = async (dados) => {
    await criarCuidado(id, dados);
    setChaveFormulario((chave) => chave + 1);
    aposAlterarCuidados(`${rotuloTipo(dados.tipo)} registrado.`);
  };

  const editar = async (dados) => {
    await atualizarCuidado(cuidadoEmEdicao.id, dados);
    setCuidadoEmEdicao(null);
    aposAlterarCuidados(`${rotuloTipo(dados.tipo)} atualizado.`);
  };

  const excluir = async () => {
    await excluirCuidado(cuidadoParaExcluir.id);
    setCuidadoParaExcluir(null);
    aposAlterarCuidados(`${rotuloTipo(cuidadoParaExcluir.tipo)} excluído.`);
  };

  const fecharEdicao = useCallback(() => setCuidadoEmEdicao(null), []);
  const fecharExclusao = useCallback(() => setCuidadoParaExcluir(null), []);

  const voltar = (
    <Link to="/" className="font-medium text-teal-700 hover:underline">
      ← Voltar para os pets
    </Link>
  );

  if (erroDetalhes) {
    return (
      <section className="flex flex-col gap-4">
        {voltar}
        <Aviso tipo="erro">
          <p>{erroDetalhes.message}</p>
          {erroDetalhes.status !== 404 && (
            <button
              type="button"
              onClick={carregarDetalhes}
              className="mt-2 font-medium underline"
            >
              Tentar novamente
            </button>
          )}
        </Aviso>
      </section>
    );
  }

  if (!detalhes) {
    return (
      <section className="flex flex-col gap-4">
        {voltar}
        <Aviso>Carregando pet...</Aviso>
      </section>
    );
  }

  const { pet, resumo, alertas } = detalhes;

  return (
    <section className="flex flex-col gap-6">
      {voltar}
      <header>
        <h2 className="text-3xl font-semibold text-slate-800">{pet.nome}</h2>
        <p className="mt-1 text-slate-600">
          {rotuloEspecie(pet.especie)} · {formatarIdade(resumo.idade)} ·{" "}
          {formatarPeso(pet.peso_kg)}
        </p>
        <p className="text-sm text-slate-500">
          Nascimento: {formatarData(pet.data_nascimento)}
        </p>
      </header>
      {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}
      <ResumoPet resumo={resumo} />
      <PainelAlertas alertas={alertas} />
      <TabelaCuidados
        cuidados={cuidados}
        carregando={carregandoCuidados}
        erro={erroCuidados}
        tipo={tipo}
        onTipoChange={setTipo}
        onEditar={(cuidado) => {
          setSucesso(null);
          setCuidadoEmEdicao(cuidado);
        }}
        onExcluir={(cuidado) => {
          setSucesso(null);
          setCuidadoParaExcluir(cuidado);
        }}
        onTentarNovamente={carregarCuidados}
      />
      <section
        aria-labelledby={idTituloRegistro}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3
          id={idTituloRegistro}
          className="text-lg font-semibold text-slate-800"
        >
          Registrar cuidado
        </h3>
        <FormularioCuidado
          key={chaveFormulario}
          nascimento={pet.data_nascimento}
          onSalvar={registrar}
        />
      </section>
      {cuidadoEmEdicao && (
        <Modal titulo="Editar cuidado" onFechar={fecharEdicao}>
          <FormularioCuidado
            cuidado={cuidadoEmEdicao}
            nascimento={pet.data_nascimento}
            onSalvar={editar}
            onCancelar={fecharEdicao}
          />
        </Modal>
      )}
      {cuidadoParaExcluir && (
        <Modal titulo="Excluir cuidado" onFechar={fecharExclusao}>
          <ConfirmarExclusao
            mensagem={`Tem certeza de que deseja excluir o cuidado "${rotuloTipo(cuidadoParaExcluir.tipo)}" de ${formatarData(cuidadoParaExcluir.data)}?`}
            onConfirmar={excluir}
            onCancelar={fecharExclusao}
          />
        </Modal>
      )}
    </section>
  );
}
