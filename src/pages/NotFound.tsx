import { usePageMeta } from '../lib/usePageMeta';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';

export default function NotFound() {
  usePageMeta({ title: 'Página no encontrada' });

  return (
    <main className="flex min-h-screen items-center bg-paper pt-24 pb-20">
      <Container className="text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-brand-500">
          Error 404
        </p>
        <h1 className="text-4xl font-light uppercase tracking-wide text-ink md:text-5xl">
          Página no encontrada
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-ink-soft">
          La página que busca no existe o fue movida. Puede volver al inicio o explorar
          nuestros proyectos.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button to="/">Volver al inicio</Button>
          <Button variant="outline" to="/proyectos">
            Ver proyectos
          </Button>
        </div>
      </Container>
    </main>
  );
}
