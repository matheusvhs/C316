import PaginaPets from "./pages/PaginaPets.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-2xl font-bold text-teal-700">PetCare</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <PaginaPets />
      </main>
    </div>
  );
}
