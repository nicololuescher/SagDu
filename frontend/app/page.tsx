import ClientRedirect from '@/components/client-redirect';

export default async function Home() {
  return (
    <>
      <ClientRedirect href="/login" />
    </>
  );
}
