import { BrowserRouter, Link, Route, Routes } from "react-router";
import PaginaDetalhePet from "./pages/PaginaDetalhePet.jsx";
import PaginaNaoEncontrada from "./pages/PaginaNaoEncontrada.jsx";
import PaginaPets from "./pages/PaginaPets.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <header className="bg-white shadow-sm">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <Link to="/" className="text-2xl font-bold text-teal-700">
              PetCare
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl p-6">
          <Routes>
            <Route path="/" element={<PaginaPets />} />
            <Route path="/pets/:id" element={<PaginaDetalhePet />} />
            <Route path="*" element={<PaginaNaoEncontrada />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
