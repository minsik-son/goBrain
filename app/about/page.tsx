import { SiteHeader } from "@/components/site-header"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2">
            <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
              About AI Translator
            </h1>
            <p className="text-center text-muted-foreground md:text-xl">
              Breaking language barriers with cutting-edge AI technology
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-8 py-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground">
                At AI Translator, our mission is to make communication seamless across languages and cultures. We
                believe that language should never be a barrier to understanding, connection, or opportunity.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Technology</h2>
              <p className="text-muted-foreground">
                We leverage the latest advancements in artificial intelligence and natural language processing to
                provide accurate, contextually-aware translations. Our AI models are trained on diverse, multilingual
                datasets to ensure high-quality translations across a wide range of languages.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Team</h2>
              <p className="text-muted-foreground">
                Our team consists of language experts, AI researchers, and software engineers who are passionate about
                breaking down language barriers. With backgrounds spanning linguistics, machine learning, and software
                development, we bring a multidisciplinary approach to translation technology.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Our Values</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                <li>
                  <span className="font-medium">Accuracy:</span> We prioritize precision in our translations to ensure
                  clear communication.
                </li>
                <li>
                  <span className="font-medium">Accessibility:</span> We believe translation technology should be
                  available to everyone.
                </li>
                <li>
                  <span className="font-medium">Privacy:</span> We respect user data and maintain strict privacy
                  standards.
                </li>
                <li>
                  <span className="font-medium">Innovation:</span> We continuously improve our technology to provide
                  better translations.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

