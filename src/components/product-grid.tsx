import { ProductCard, type Product } from "@/components/product-card";
import { SlideIn } from "@/components/slide-in";
import { SectionWrapper } from "@/components/section-wrapper";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <SectionWrapper
      id="products" width="full"
      className="bg-[var(--brand-black)] px-4 py-25 font-[var(--font-display)] text-white lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <SlideIn className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-red)]">
            Best sellers
          </p>

          <h2 className="text-[#928886] mt-2 text-3xl uppercase font-bold leading-[0.7] tracking-[0.02em] sm:text-5xl">
            The favorites
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-6 text-white/60">
            Discover the products customers keep coming back for.
          </p>
        </SlideIn>

        <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <SlideIn key={product.id} delay={index * 0.15}>
              <ProductCard product={product} />
            </SlideIn>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}