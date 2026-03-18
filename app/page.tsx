import { redirect } from "next/navigation";

// O middleware intercepta a request:
// - Não autenticado → /login
// - Autenticado → /dashboard (via lógica de rotas de app)
export default function Home() {
  redirect("/dashboard");
}
