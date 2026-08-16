import { Header } from "@/components/Header";

export default function ProductsLoading() {
  return (
    <main>
      <Header />
      <div className="px-14 pt-11 pb-24 max-[640px]:px-5 max-[640px]:pt-7">
        <div className="grid grid-cols-4 gap-x-8 gap-y-13 max-[900px]:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] animate-pulse rounded-[4px] bg-skeleton" />
              <div className="mt-3.5 h-2.5 w-[60%] animate-pulse bg-skeleton" />
              <div className="mt-2.5 h-2.5 w-[80%] animate-pulse bg-skeleton" />
              <div className="mt-2.5 h-2.5 w-[34%] animate-pulse bg-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
