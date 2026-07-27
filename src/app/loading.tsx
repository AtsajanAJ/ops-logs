import { LoaderCircle } from "lucide-react";

export default function Loading(): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <LoaderCircle
          aria-hidden="true"
          className="mx-auto size-6 animate-spin text-slate-400"
        />
        <p className="mt-3 text-sm font-medium text-slate-600">
          Loading operations workspace…
        </p>
      </div>
    </main>
  );
}
