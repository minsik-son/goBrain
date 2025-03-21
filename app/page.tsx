import { Translator } from "@/components/translate/translator"
import { SiteHeader } from "@/components/site-header"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex max-w-[980px] flex-col items-center gap-2">
            
          </div>
          <Translator />
        </section>
      </main>
      <Footer />
    </div>
  )
}

