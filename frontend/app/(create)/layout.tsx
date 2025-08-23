export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="grid max-h-full place-items-center px-4 py-10">
      <div className="w-full max-w-sm max-h-full">{children}</div>
    </section>
  );
}
