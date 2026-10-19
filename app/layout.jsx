import '../src/styles.css';

export const metadata = {
  title: 'StopBeer — Gelada, rápida, do seu jeito',
  description: 'StopBeer — bebidas geladas, entrega rápida. Faça seu pedido online.',
};

export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
