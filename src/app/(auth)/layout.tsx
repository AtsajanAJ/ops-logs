export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      {children}
    </div>
  );
}
