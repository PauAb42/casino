"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Star, Maximize, ChevronDown, Send, RotateCcw, XCircle, Play, Copy, Users } from "lucide-react";

// Números rojos de la ruleta para aplicar el color correcto en el tablero
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Matrices para renderizar el tablero en 3 filas (de arriba hacia abajo)
const TOP_ROW = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
const MID_ROW = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
const BOT_ROW = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

// Datos simulados para mantener todo funcional en el frontend
const CHAT_MESSAGES = [
  { id: 1, user: "JugadorVIP", text: "¡Buena suerte a todos!", isDealer: false },
  { id: 2, user: "CarlosM", text: "Vamos por esa! 🍀", isDealer: false },
  { id: 3, user: "RuletaFan", text: "Qué mesa tan increíble", isDealer: false },
  { id: 4, user: "SuerteTotal", text: "¡Se viene el número 17!", isDealer: false },
  { id: 5, user: "Ana Sofia", text: "¡Disfruten el juego!", isDealer: true },
];

const HOT_NUMBERS = [{ n: 17, mul: "32x" }, { n: 34, mul: "28x" }, { n: 6, mul: "26x" }, { n: 27, mul: "24x" }, { n: 13, mul: "22x" }];
const COLD_NUMBERS = [{ n: 0, mul: "8x" }, { n: 3, mul: "10x" }, { n: 12, mul: "9x" }, { n: 22, mul: "11x" }, { n: 31, mul: "7x" }];
const RECENT_NUMBERS = [17, 7, 34, 2, 0, 25, 19, 6, 13, 30];

const CURRENT_BETS = [
  { user: "CarlosM", bet: "$ 500", total: "$ 1,000" },
  { user: "RuletaFan", bet: "$ 250", total: "$ 750" },
  { user: "VIP_Lucky", bet: "$ 100", total: "$ 300" },
  { user: "SuerteTotal", bet: "$ 300", total: "$ 600" },
  { user: "Ana777", bet: "$ 150", total: "$ 450" },
];

const CHIPS = [
  { value: "10", color: "bg-[#D4AF37] border-[#F3D55B] text-black" },
  { value: "50", color: "bg-red-700 border-red-500" },
  { value: "100", color: "bg-gray-900 border-gray-500" },
  { value: "500", color: "bg-green-700 border-green-500" },
  { value: "1K", color: "bg-blue-700 border-blue-500" },
  { value: "5K", color: "bg-purple-700 border-purple-500" },
  { value: "10K", color: "bg-yellow-600 border-yellow-400" },
];

export default function RuletaPage() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");

  const getNumberColor = (num: number) => {
    if (num === 0) return "bg-green-700 text-white";
    return RED_NUMBERS.includes(num) ? "bg-red-700 text-white" : "bg-black text-white";
  };

  return (
    <div className="flex flex-col h-screen bg-[#05050A] text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#0B0E14]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Ruleta</h1>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest">European Roulette</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-white/10 rounded-lg px-4 py-2 text-xs font-medium hover:bg-white/5 transition-colors">
            MÁS JUEGOS <ChevronDown size={14} />
          </button>
          <button className="w-9 h-9 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <Star size={16} />
          </button>
          <button className="w-9 h-9 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
            <Maximize size={16} />
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        
        {/* COLUMNA IZQUIERDA: Dealer y Chat */}
        <div className="w-[280px] flex flex-col gap-4 shrink-0">
          {/* Tarjeta Dealer */}
          <div className="bg-[#0B0E14] border border-white/5 rounded-xl overflow-hidden shadow-lg relative">
            {/* Placeholder de imagen del Dealer */}
            <div className="h-40 bg-[#1E1133] relative flex items-end justify-center pb-2">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
              {/* Etiqueta EN VIVO */}
              <div className="absolute top-3 left-3 bg-green-600 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md z-20">
                EN VIVO
              </div>
            </div>
            <div className="p-4 flex items-center justify-between relative z-20 bg-[#0B0E14]">
              <div>
                <p className="font-bold text-sm">Ana Sofia</p>
                <p className="text-[10px] text-gray-500">ID: 2354887</p>
              </div>
              <div className="flex items-center gap-1 bg-[#1E1133] border border-[#8A2BE2]/30 px-2 py-1 rounded text-xs">
                <Star size={12} className="text-[#D4AF37]" fill="currentColor" />
                <span className="font-bold">4.9</span>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 bg-[#0B0E14] border border-white/5 rounded-xl shadow-lg flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">Chat</h3>
              <button className="text-gray-500 hover:text-white"><XCircle size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {CHAT_MESSAGES.map((msg) => (
                <div key={msg.id} className="leading-tight">
                  <span className={`font-bold mr-2 ${msg.isDealer ? 'text-[#D4AF37]' : 'text-[#8A2BE2]'}`}>
                    {msg.user}:
                  </span>
                  <span className="text-gray-300">{msg.text}</span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/5 bg-[#131722]">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-[#0B0E14] border border-white/10 rounded-lg py-2 pl-3 pr-10 text-xs text-white focus:outline-none focus:border-[#8A2BE2] transition-colors"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL: Ruleta y Tablero de Apuestas */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* Área de la Ruleta (Imagen) */}
          <div className="flex-1 bg-[#0B0E14] border border-white/5 rounded-xl shadow-lg relative flex items-center justify-center overflow-hidden min-h-[300px]">
            {/* Aquí debes colocar tu imagen real de la ruleta en public/images/ruleta-3d.jpg */}
            <div className="absolute inset-0 bg-[url('/images/ruleta-3d.jpg')] bg-cover bg-center opacity-80"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05050A]/90"></div>
          </div>

          {/* Tablero de Apuestas */}
          <div className="shrink-0 pb-4 px-4 flex flex-col items-center">
            
            {/* Contenedor del Paño (CSS Grid) */}
            <div className="flex w-full max-w-[800px]">
              
              {/* Cero */}
              <div className="w-12 border border-white/20 bg-green-700 flex items-center justify-center text-white font-bold text-lg rounded-l-lg hover:bg-green-600 cursor-pointer transition-colors shadow-inner">
                0
              </div>
              
              {/* Cuadrícula Principal 1-36 */}
              <div className="flex-1 flex flex-col">
                {/* Fila Superior */}
                <div className="flex flex-1">
                  {TOP_ROW.map((num) => (
                    <div key={num} className={`flex-1 flex items-center justify-center border border-white/20 font-bold text-lg hover:brightness-125 cursor-pointer transition-all shadow-inner ${getNumberColor(num)}`}>
                      {num}
                    </div>
                  ))}
                </div>
                {/* Fila Media */}
                <div className="flex flex-1">
                  {MID_ROW.map((num) => (
                    <div key={num} className={`flex-1 flex items-center justify-center border border-white/20 font-bold text-lg hover:brightness-125 cursor-pointer transition-all shadow-inner ${getNumberColor(num)}`}>
                      {num}
                    </div>
                  ))}
                </div>
                {/* Fila Inferior */}
                <div className="flex flex-1">
                  {BOT_ROW.map((num) => (
                    <div key={num} className={`flex-1 flex items-center justify-center border border-white/20 font-bold text-lg hover:brightness-125 cursor-pointer transition-all shadow-inner ${getNumberColor(num)}`}>
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna 2:1 */}
              <div className="w-12 flex flex-col text-sm font-bold text-gray-300">
                <div className="flex-1 flex items-center justify-center border border-white/20 rounded-tr-lg bg-transparent hover:bg-white/10 cursor-pointer transition-colors">2:1</div>
                <div className="flex-1 flex items-center justify-center border border-white/20 bg-transparent hover:bg-white/10 cursor-pointer transition-colors">2:1</div>
                <div className="flex-1 flex items-center justify-center border border-white/20 bg-transparent hover:bg-white/10 cursor-pointer transition-colors">2:1</div>
              </div>
            </div>

            {/* Apuestas Externas (Docenas) */}
            <div className="flex w-full max-w-[800px] pl-12 pr-12 h-12">
              <div className="flex-1 flex items-center justify-center border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 cursor-pointer transition-colors">1ST 12</div>
              <div className="flex-1 flex items-center justify-center border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 cursor-pointer transition-colors">2ND 12</div>
              <div className="flex-1 flex items-center justify-center border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 cursor-pointer transition-colors">3RD 12</div>
            </div>

            {/* Apuestas Externas (Mitades y Colores) */}
            <div className="flex w-full max-w-[800px] pl-12 pr-12 h-12 rounded-b-lg overflow-hidden">
              <div className="flex-1 flex items-center justify-center border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 cursor-pointer transition-colors rounded-bl-lg">1 - 18</div>
              <div className="flex-1 flex items-center justify-center border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 cursor-pointer transition-colors">EVEN</div>
              <div className="flex-1 flex items-center justify-center border border-white/20 bg-red-700 hover:bg-red-600 cursor-pointer transition-colors">
                <div className="w-4 h-4 bg-red-500 transform rotate-45"></div>
              </div>
              <div className="flex-1 flex items-center justify-center border border-white/20 bg-black hover:bg-gray-900 cursor-pointer transition-colors">
                <div className="w-4 h-4 bg-gray-600 transform rotate-45"></div>
              </div>
              <div className="flex-1 flex items-center justify-center border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 cursor-pointer transition-colors">ODD</div>
              <div className="flex-1 flex items-center justify-center border border-white/20 text-gray-300 font-bold text-sm hover:bg-white/10 cursor-pointer transition-colors">19 - 36</div>
            </div>

          </div>
        </div>

        {/* COLUMNA DERECHA: Estadísticas y Apuestas */}
        <div className="w-[320px] flex flex-col gap-4 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Stats de Números */}
          <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-5 shadow-lg space-y-6">
            
            {/* Calientes */}
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-3">Números Calientes</h3>
              <div className="flex justify-between">
                {HOT_NUMBERS.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-white/20 ${getNumberColor(item.n)}`}>
                      {item.n}
                    </div>
                    <span className="text-[9px] text-gray-500">{item.mul}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fríos */}
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-3">Números Fríos</h3>
              <div className="flex justify-between">
                {COLD_NUMBERS.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-white/20 ${getNumberColor(item.n)}`}>
                      {item.n}
                    </div>
                    <span className="text-[9px] text-gray-500">{item.mul}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Últimos */}
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase mb-3">Últimos Números</h3>
              <div className="flex flex-wrap gap-2">
                {RECENT_NUMBERS.map((num, i) => (
                  <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold border border-white/20 ${getNumberColor(num)}`}>
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de Apuestas Actuales */}
          <div className="bg-[#0B0E14] border border-white/5 rounded-xl p-5 shadow-lg flex-1">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-bold tracking-widest text-[#D4AF37] uppercase">Apuestas Actuales</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users size={12} /> 23
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                <span className="w-1/3">Jugador</span>
                <span className="w-1/3 text-right">Apuesta</span>
                <span className="w-1/3 text-right">Total</span>
              </div>
              
              {CURRENT_BETS.map((bet, i) => (
                <div key={i} className="flex justify-between text-xs items-center">
                  <span className="w-1/3 text-gray-300 truncate">{bet.user}</span>
                  <span className="w-1/3 text-right text-gray-400">{bet.bet}</span>
                  <span className="w-1/3 text-right font-bold text-[#D4AF37]">{bet.total}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between text-sm items-center">
              <span className="text-gray-400 text-xs">Total de apuestas</span>
              <span className="font-bold text-white">$ 3,100</span>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER: Controles de Apuesta */}
      <footer className="h-20 bg-[#0B0E14] border-t border-white/5 flex items-center justify-between px-6 shrink-0 relative z-20">
        
        {/* Saldos */}
        <div className="flex items-center gap-8 w-64">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Saldo</p>
            <p className="font-bold text-white">$ 12,450.75 <span className="text-[10px] text-gray-500 font-normal">MXN</span></p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Apuesta Total</p>
            <p className="font-bold text-white">$ 250.00 <span className="text-[10px] text-gray-500 font-normal">MXN</span></p>
          </div>
        </div>

        {/* Selector de Fichas */}
        <div className="flex items-center gap-2">
          <button className="text-gray-500 hover:text-white transition-colors mr-2"><ChevronLeft size={20}/></button>
          
          {CHIPS.map((chip, i) => (
            <div 
              key={i} 
              className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer hover:-translate-y-2 transition-transform ${chip.color} ${chip.value === "50" ? "-translate-y-2 shadow-[0_0_15px_rgba(212,175,55,0.4)]" : ""}`}
            >
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-black/20">
                {chip.value}
              </div>
            </div>
          ))}
          
          <button className="text-gray-500 hover:text-white transition-colors ml-2 rotate-180"><ChevronLeft size={20}/></button>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 w-80 justify-end">
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors px-2">
            <RotateCcw size={18} />
            <span className="text-[9px] uppercase tracking-wider">Deshacer</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors px-2">
            <Copy size={18} />
            <span className="text-[9px] uppercase tracking-wider">Doblar</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors px-2">
            <XCircle size={18} />
            <span className="text-[9px] uppercase tracking-wider">Borrar</span>
          </button>
          <button className="ml-2 bg-green-700 hover:bg-green-600 border border-green-500 text-white flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(21,128,61,0.4)]">
            <Play size={18} />
            GIRAR
          </button>
        </div>

      </footer>
    </div>
  );
}