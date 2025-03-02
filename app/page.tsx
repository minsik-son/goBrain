import { Translator } from "@/components/translator"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex max-w-[980px] flex-col items-center gap-2">
            <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
              AI-Powered Translation
            </h1>
            <p className="text-center text-muted-foreground md:text-xl">
              Translate text between languages in real-time with our advanced AI technology.
            </p>
          </div>
          <Translator />
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} AI Translator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

