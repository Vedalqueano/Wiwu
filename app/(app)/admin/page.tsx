"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Edit2, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  matricula: string | null;
  role: string;
  departmentId: string | null;
  department: { name: string } | null;
  onboarded: boolean;
};

type Department = {
  id: string;
  name: string;
};

export default function AdminPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    matricula: "",
    role: "EMPLOYEE",
    departmentId: "none",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/departments"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    setFormError("");
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        matricula: user.matricula || "",
        role: user.role,
        departmentId: user.departmentId || "none",
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        matricula: "",
        role: "EMPLOYEE",
        departmentId: "none",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const payload = {
      ...formData,
      departmentId: formData.departmentId === "none" ? null : formData.departmentId,
      id: editingUser?.id, // se for edição, evia o ID
    };

    try {
      const res = await fetch("/api/admin/users", {
        method: editingUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar usuário");

      setIsModalOpen(false);
      fetchData(); // recarrega a lista
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-[var(--color-t3)]">Carregando painel...</div>;

  const currentRole = (session?.user as any)?.role;
  if (currentRole !== "SUPER" && currentRole !== "ADMIN") {
    return (
      <div className="p-8 flex items-center justify-center h-full text-[var(--color-red)] font-semibold">
        <ShieldAlert className="w-5 h-5 mr-2" /> Acesso negado.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-page)]">
      {/* Header */}
      <header className="px-8 py-6 bg-white border-b border-[var(--color-border)] flex items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-t1)] tracking-tight">Administração do Sistema</h1>
          <p className="text-[13px] text-[var(--color-t3)] mt-1">Gerencie usuários, acessos e configurações corporativas.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-[var(--color-navy)] text-white text-[13px] font-semibold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-8 relative">
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-[var(--color-page)] border-b border-[var(--color-border)] text-[var(--color-t3)]">
                  <th className="px-6 py-3 font-semibold w-[250px]">Usuário</th>
                  <th className="px-6 py-3 font-semibold">Cargo</th>
                  <th className="px-6 py-3 font-semibold">Departamento</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--color-border)] hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--color-t1)]">{user.name}</div>
                      <div className="text-[11px] text-[var(--color-t3)]">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-t2)]">
                      {user.department?.name || <span className="text-slate-400 italic">Nenhum</span>}
                    </td>
                    <td className="px-6 py-4">
                      {user.onboarded ? (
                        <span className="inline-flex items-center text-[12px] text-green-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[12px] text-orange-500 font-medium">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Pendente (Onb.)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-1.5 text-[var(--color-t3)] hover:text-[var(--color-navy)] rounded hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-t3)]">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[var(--radius-md)] shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[var(--color-t1)]">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-t3)] hover:text-[var(--color-t1)]">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-[12px] rounded border border-red-100">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold text-[var(--color-t2)] mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser} // Apenas edita nome se não existir fluxo na API, mas vamos bloquear por segurança no admin ou deixar editável? Bloquear no frontend por simplicidade.
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] outline-none focus:border-[var(--color-navy)] disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="Ex: Carlos Silva"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[var(--color-t2)] mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] outline-none focus:border-[var(--color-navy)] disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="carlos@wiwu.com.br"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--color-t2)] mb-1">Cargo (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] outline-none focus:border-[var(--color-navy)] bg-white"
                  >
                    <option value="SUPER">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Gerente</option>
                    <option value="EMPLOYEE">Funcionário</option>
                    <option value="VIEWER">Visualizador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[var(--color-t2)] mb-1">Departamento</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] outline-none focus:border-[var(--color-navy)] bg-white"
                  >
                    <option value="none">Nenhum</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div className="mt-2 text-[11px] text-[var(--color-t3)] bg-slate-50 p-2 rounded border border-[var(--color-border)]">
                  💡 A senha padrão para novos usuários será <strong>1234</strong>. O usuário será solicitado a completar o Onboarding no primeiro login.
                </div>
              )}

              <div className="mt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-semibold text-[var(--color-t2)] hover:bg-slate-100 rounded-[var(--radius-sm)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[var(--color-navy)] rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors disabled:opacity-50"
                >
                  {formLoading ? "Salvando..." : "Salvar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
