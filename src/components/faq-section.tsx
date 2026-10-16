import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SlideIn } from "@/components/slide-in";
import { SectionWrapper } from "./section-wrapper";
import type { Faq } from "@/lib/types";

type FaqSectionProps = {
  faqs: Faq[];
};

export function FaqSection({ faqs }: FaqSectionProps) {
  return (
    <SectionWrapper
      id="faqs" width="full"
      className="bg-[var(--brand-black)] px-4 py-20 text-white sm:px-6 lg:px-10"
    >
      <div className="mx-auto grid max-w-9xl gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        {/* Left: FAQ accordion */}
        <SlideIn direction="left">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${index}`}
                className="border-white/15"
              >
                <AccordionTrigger className="py-6 text-left text-base font-bold uppercase hover:no-underline sm:text-lg">
                  {faq.question}
                </AccordionTrigger>

                <AccordionContent className="max-w-2xl pb-6 text-sm leading-6 text-white/60">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SlideIn>

        {/* Right: heading and text */}
        <SlideIn>
          <div className="lg:sticky lg:top-10">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
              Need to know
            </p>

            <h2 className="text-[#928886] text-5xl uppercase font-extrabold leading-none sm:text-5xl">
              Questions?
              <span className="block text-[var(--brand-red)]">
                We’ve got answers.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-6 text-white/60">
              Find quick answers about Flexx products, usage, shipping, and
              your daily performance routine.
            </p>
          </div>
        </SlideIn>
      </div>
    </SectionWrapper>
  );
}