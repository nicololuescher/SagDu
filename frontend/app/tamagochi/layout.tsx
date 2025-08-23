export default function TamagochiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="grid h-[calc(80dvh-0px)] place-items-center px-4 ">
      <div className="w-full h-full max-w-sm">{children}</div>
    </section>
  );
}
