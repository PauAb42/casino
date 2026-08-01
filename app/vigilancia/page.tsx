"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, FileText, Shield, Info, 
  Fingerprint, HardDrive, Globe, Monitor, 
  Cpu, ChevronRight, CheckCircle2, Clock, 
  AppWindow, Server, Cookie, RefreshCw
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

type Riesgo = "ALTO" | "MEDIO" | "BAJO" | "NINGUNO";

interface DatoCapturado {
  id: string;
  nombreCorto: string; // Para la lista de la derecha
  nombreLargo?: string; // Para la lista principal de riesgo
  riesgo: Riesgo;
  descripcion?: string;
  icono: React.ElementType;
}

export default function VigilanciaPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<DatoCapturado[]>([]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    /* --------------------------------------------------------------------------
     * LLAMADA REAL AL BACKEND (COMENTADA HASTA QUE EL ENDPOINT EXISTA)
     * --------------------------------------------------------------------------
    const fetchExpediente = async () => {
      try {
        const response = await fetch('/api/expediente', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        // Aquí mapearías la respuesta a la estructura de la UI
        // ...
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpediente();
    */

    // --------------------------------------------------------------------------
    // SIMULACIÓN TEMPORAL (FRONTEND ONLY)
    // --------------------------------------------------------------------------
    setTimeout(() => {
      setDatos([
        { id: "ip", nombreCorto: "IP pública", riesgo: "NINGUNO", icono: Globe },
        { id: "os", nombreCorto: "Sistema operativo", riesgo: "NINGUNO", icono: AppWindow },
        { id: "browser", nombreCorto: "Navegador", riesgo: "NINGUNO", icono: Globe },
        { id: "ram", nombreCorto: "Memoria del dispositivo", riesgo: "NINGUNO", icono: Server },
        { 
          id: "canvas", 
          nombreCorto: "Canvas", 
          nombreLargo: "Huella de canvas",
          riesgo: "ALTO", 
          descripcion: "Te identifica aunque borres cookies.",
          icono: Fingerprint 
        },
        { 
          id: "gpu", 
          nombreCorto: "GPU", 
          nombreLargo: "Tarjeta gráfica",
          riesgo: "MEDIO", 
          descripcion: "AMD Radeon... revelada sin pedir permiso.",
          icono: HardDrive 
        },
        { id: "idioma", nombreCorto: "Idioma", riesgo: "NINGUNO", icono: Globe },
        { 
          id: "timezone", 
          nombreCorto: "Zona horaria", 
          nombreLargo: "Zona horaria e idioma",
          riesgo: "MEDIO", 
          descripcion: "Ayudan a perfilar tu dispositivo y ubicación aproximada.",
          icono: Clock 
        },
        { 
          id: "resolucion", 
          nombreCorto: "Resolución", 
          nombreLargo: "Resolución de pantalla",
          riesgo: "BAJO", 
          descripcion: "Parece inofensiva, pero suma a tu huella digital.",
          icono: Monitor 
        },
        { 
          id: "cpu", 
          nombreCorto: "CPU", 
          nombreLargo: "Núcleos del CPU",
          riesgo: "BAJO", 
          descripcion: "Aporta datos técnicos sobre tu equipo.",
          icono: Cpu 
        },
        { id: "cookies", nombreCorto: "Cookies habilitadas", riesgo: "NINGUNO", icono: Cookie },
      ]);
      setLoading(false);
    }, 1000);

  }, [user, token, router]);

  if (!user) return <div className="min-h-screen bg-[#05050A]"></div>;

  const datosConRiesgo = datos.filter(d => d.riesgo !== "NINGUNO");
  const totalRiesgoAlto = datos.filter(d => d.riesgo === "ALTO").length;
  const totalRiesgoMedio = datos.filter(d => d.riesgo === "MEDIO").length;
  const totalRiesgoBajo = datos.filter(d => d.riesgo === "BAJO").length;

  return (
    <div className="min-h-screen bg-[#080B14] text-white font-sans pb-20 selection:bg-[#8A2BE2]/30">
      
      <main className="max-w-[1100px] mx-auto px-4 lg:px-8 pt-10">

        {/* Título Principal */}
        <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black leading-tight tracking-tight mb-10 text-white">
          Esto es lo que supimos de ti <br />
          <span className="text-[#D4AF37]">sin pedirte permiso</span>
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-70 bg-[#121624] rounded-2xl border border-white/5">
            <RefreshCw size={32} className="text-[#A78BFA] animate-spin mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando expediente...</p>
          </div>
        ) : (
          <div className="bg-[#121624] border border-white/5 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
            
            {/* COLUMNA IZQUIERDA (Detalles y Riesgos) */}
            <div className="flex-1 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5">
              
              {/* Stats Bar */}
              <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-start gap-6 md:gap-12 mb-8 pb-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1C1A3A] rounded-full flex items-center justify-center border border-[#8A2BE2]/20">
                    <FileText size={20} className="text-[#A78BFA]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black leading-none">{datos.length}</span>
                    <span className="text-xs text-gray-400 mt-1">datos capturados</span>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-white/5"></div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#3A2218] rounded-full flex items-center justify-center border border-orange-500/20">
                    <ShieldCheck size={20} className="text-orange-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-3xl font-black leading-none">{datosConRiesgo.length}</span>
                    <span className="text-xs text-gray-400 mt-1">con riesgo</span>
                  </div>
                </div>

                <div className="hidden md:block w-px h-12 bg-white/5"></div>

                <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-full flex items-center justify-center border border-white/10">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div className="text-sm font-medium">
                    <span className="text-red-400">{totalRiesgoAlto} alto</span>
                    <span className="text-gray-500 mx-1.5">·</span>
                    <span className="text-yellow-400">{totalRiesgoMedio} medios</span>
                    <span className="text-gray-500 mx-1.5">·</span>
                    <span className="text-green-400">{totalRiesgoBajo} bajos</span>
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
                <Info size={16} className="text-gray-500 shrink-0" />
                <p>Capturamos {datos.length} datos en esta sesión. De esos, <span className="text-orange-400">{datosConRiesgo.length}</span> presentan riesgo potencial.</p>
              </div>

              {/* Lista de Riesgos */}
              <div className="space-y-2 mb-2">
                {datosConRiesgo.map((dato) => {
                  const isAlto = dato.riesgo === "ALTO";
                  const isMedio = dato.riesgo === "MEDIO";
                  const isBajo = dato.riesgo === "BAJO";
                  const Icon = dato.icono;

                  return (
                    <div key={dato.id} className="group flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-white/5 transition-colors cursor-default">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/5 ${
                        isAlto ? "text-red-400" : isMedio ? "text-yellow-400" : "text-green-400"
                      }`}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-white mb-0.5">{dato.nombreLargo || dato.nombreCorto}</h4>
                        <p className="text-sm text-gray-400 truncate">{dato.descripcion}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-bold tracking-wide ${
                          isAlto ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          isMedio ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-green-500/10 text-green-400 border-green-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAlto ? "bg-red-400" : isMedio ? "bg-yellow-400" : "bg-green-400"}`}></span>
                          {dato.riesgo}
                        </div>
                        <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* COLUMNA DERECHA (Lista Completa Simple) */}
            <div className="w-full lg:w-[320px] bg-[#0F121C] p-6 lg:p-8 flex flex-col">
              <h3 className="text-[#A78BFA] font-bold text-lg mb-6">Datos capturados</h3>
              
              <div className="space-y-4 flex-1">
                {datos.map((dato) => {
                  const Icon = dato.icono;
                  return (
                    <div key={`summary-${dato.id}`} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors">
                        <Icon size={16} />
                        <span className="text-sm">{dato.nombreCorto}</span>
                      </div>
                      <CheckCircle2 size={16} className="text-green-500/80" />
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-gray-400">
                <span className="text-sm">Total:</span>
                <span className="text-xl font-bold text-[#A78BFA]">{datos.length}</span>
                <span className="text-sm">datos</span>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}