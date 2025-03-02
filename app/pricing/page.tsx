import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

const plans = [
  {
    name: "Free",
    description: "Essential translation features for casual users.",
    price: "$0",
    duration: "forever",
    features: [
      "500 characters per translation",
      "10 translations per day",
      "Basic language support (10 languages)",
      "Standard translation quality",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    description: "Advanced features for professionals and businesses.",
    price: "$9.99",
    duration: "per month",
    features: [
      "Unlimited characters per translation",
      "Unlimited translations",
      "All languages supported (100+)",
      "High-quality translations",
      "Priority support",
      "Document translation",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations.",
    price: "Custom",
    duration: "contact for pricing",
    features: [
      "Everything in Pro",
      "Custom API integration",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "Advanced security features",
      "Custom language models",
    ],
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-2">
            <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
              Pricing Plans
            </h1>
            <p className="text-center text-muted-foreground md:text-xl">Choose the plan that works best for you</p>
          </div>
          <div className="mx-auto grid max-w-screen-lg gap-5 py-10 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-lg border p-6",
                  plan.highlighted && "border-primary shadow-lg",
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-5 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-4 space-y-2">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> / {plan.duration}</span>
                </div>
                <ul className="mb-6 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn("mt-auto", plan.highlighted ? "bg-primary" : "bg-muted")}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

