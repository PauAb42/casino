import AwarenessDashboard from "@/components/AwarenessDashboard";
import ChipRack from "@/components/ChipRack";

export default function PermisosPage() {
  return (
    <div className="py-8">
      <div className="mx-auto flex max-w-5xl justify-center px-6">
        <ChipRack />
      </div>
      <AwarenessDashboard />
    </div>
  );
}
