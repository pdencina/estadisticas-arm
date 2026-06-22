import LoginForm from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base mx-auto mb-4 shadow-sm" style={{ background: "var(--arm)" }}>AR</div>
          <h1 className="text-xl font-bold text-gray-900">ARM Stats</h1>
          <p className="text-sm text-gray-400 mt-1">arm global · Plataforma de estadísticas</p>
        </div>
        <div className="card p-6">
          <p className="text-sm font-bold text-gray-800 mb-1">Iniciar sesión</p>
          <p className="text-xs text-gray-400 mb-5">Ingresa con tu cuenta ARM Global</p>
          <LoginForm />
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">¿Problemas para ingresar? Contacta al administrador.</p>
      </div>
    </div>
  );
}
