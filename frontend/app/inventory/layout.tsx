export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="grid min-h-[calc(100dvh-0px)] place-items-center px-4 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </section>
  );
}
