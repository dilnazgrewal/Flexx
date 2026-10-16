import { HeroSection } from "@/components/hero-section";
import { NewFlavourSection } from "@/components/new-flavour";
import { ProductGrid } from "@/components/product-grid";
import { SiteHeader } from "@/components/site-header";
import { CategorySection } from "@/components/category-section";
import { AllProducts } from "@/components/all-products";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FaqSection } from "@/components/faq-section";
import { SiteFooter } from "@/components/site-footer";
import { ApiOfflineNotice } from "@/components/api-offline-notice";
import { getCategories, getFaqs, getProducts, getTestimonials } from "@/lib/api";

export default async function Home() {
  // Everything below is rendered on the server from the FastAPI backend.
  const [featured, all, categories, testimonials, faqs] = await Promise.all([
    getProducts({ featured: true, pageSize: 3 }).catch(() => null),
    getProducts({ pageSize: 24, sort: "featured" }).catch(() => null),
    getCategories().catch(() => null),
    getTestimonials().catch(() => null),
    getFaqs().catch(() => null),
  ]);

  if (!all) {
    return (
      <>
        <SiteHeader variant="solid" />
        <ApiOfflineNotice />
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ProductGrid products={(featured?.items ?? all.items).slice(0, 3)} />
        <NewFlavourSection />
        {categories?.length ? <CategorySection categories={categories} /> : null}
        <AllProducts products={all.items} />
        {testimonials?.length ? (
          <TestimonialsSection testimonials={testimonials} />
        ) : null}
        {faqs?.length ? <FaqSection faqs={faqs} /> : null}
      </main>
      <SiteFooter />
    </>
  );
}
