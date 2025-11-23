import { ClientOnly } from '~/components/ClientOnly';
import { Welcome } from '~/routes/home/components/welcome';

export default function Home() {
  return (
    <ClientOnly>
      <Welcome />
    </ClientOnly>
  );
}
