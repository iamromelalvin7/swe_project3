import { Header } from "@/components/Header";

/** Mirrors the real catalog (hero, count, filters, grid) so nothing jumps when it loads. */
export default function ProductsLoading() {
  return (
    <>
      <Header />
      <main aria-busy="true" aria-label="Loading the archive">
        <section className="page-container grid grid-cols-[0.94fr_1.06fr] items-center gap-12 py-8 max-[900px]:grid-cols-1 max-[900px]:gap-7 max-[640px]:py-6">
          <div>
            <div className="skeleton h-3 w-56" />
            <div className="skeleton mt-5 h-16 w-[85%]" />
            <div className="skeleton mt-6 h-3 w-[70%]" />
            <div className="skeleton mt-2.5 h-3 w-[55%]" />
            <div className="skeleton mt-8 h-12 w-52" />
          </div>
          <div className="skeleton aspect-[1935/813] max-[640px]:aspect-[1.6/1]" />
        </section>
        <section className="page-container">
          <div className="flex h-[46px] items-center border-t border-rule">
            <div className="skeleton h-2.5 w-40" />
          </div>
          <div className="flex justify-between gap-2.5 min-[640px]:hidden">
            <div className="skeleton h-9 w-28 rounded-full" />
            <div className="skeleton h-9 w-44 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2.5 max-[639px]:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-x-8 gap-y-12 pb-20 pt-5 max-[1100px]:gap-x-6 max-[900px]:grid-cols-2 max-[900px]:gap-x-5 max-[900px]:gap-y-9 max-[430px]:gap-x-4 max-[430px]:gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[3/4]" />
                <div className="skeleton mt-3 h-2.5 w-[60%]" />
                <div className="skeleton mt-2.5 h-3.5 w-[80%]" />
                <div className="skeleton mt-2.5 h-2.5 w-[34%]" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
