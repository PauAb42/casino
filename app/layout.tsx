import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Royal Casino | Juega y Gana",
  description: "El mejor casino en línea. Juegos en vivo, tragamonedas, póker y más.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#0B0E14] text-white flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 bg-[#0B0E14]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}