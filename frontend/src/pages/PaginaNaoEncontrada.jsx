import { Link } from "react-router";
import Aviso from "../components/Aviso.jsx";

export default function PaginaNaoEncontrada() {
  return (
    <section className="flex flex-col gap-4">
      <Aviso tipo="erro">Página não encontrada.</Aviso>
      <Link to="/" className="font-medium text-teal-700 hover:underline">
        ← Voltar para os pets
      </Link>
    </section>
  );
}
