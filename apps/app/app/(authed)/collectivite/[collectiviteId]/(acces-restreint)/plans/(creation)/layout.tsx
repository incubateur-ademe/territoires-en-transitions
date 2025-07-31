export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto flex flex-col grow py-12 min-h-[60vh]">
      {children}
    </div>
  );
}
