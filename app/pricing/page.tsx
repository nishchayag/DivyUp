import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    subtitle: "For individuals and small groups",
    features: [
      "Up to 3 groups",
      "Up to 8 members per workspace",
      "Up to 200 expenses per month",
      "CSV export",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    subtitle: "per workspace / month",
    features: [
      "Up to 100 groups",
      "Up to 250 members per workspace",
      "Up to 10,000 expenses per month",
      "Audit log + admin analytics",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-[80vh] py-8 md:py-16">
      <section className="text-center mb-14">
        <p className="text-sm uppercase tracking-[0.25em] text-sky-600 dark:text-sky-400 mb-4">
          DivyUp Pricing
        </p>
        <h1 className="font-display text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Scale From Roommates
          <br />
          to Revenue Teams
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto">
          Start free, then unlock bigger limits and operational tools when your workspace grows.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={plan.name}
            className={`rounded-3xl p-8 shadow-sm transition-transform hover:-translate-y-1 ${
              idx === 1
                ? "bg-gradient-to-b from-sky-600 to-blue-700 text-white border border-sky-400/60 shadow-2xl shadow-sky-600/30"
                : "surface-card"
            }`}
          >
            {idx === 1 && (
              <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-white/20 text-white mb-3">
                Most Popular
              </span>
            )}
            <h2 className={`font-display text-2xl font-bold ${idx === 1 ? "text-white" : "text-slate-900 dark:text-white"}`}>
              {plan.name}
            </h2>
            <div className="mt-3 flex items-end gap-2">
              <span className={`text-5xl font-black ${idx === 1 ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {plan.price}
              </span>
              <span className={`text-sm mb-2 ${idx === 1 ? "text-sky-100" : "text-slate-500 dark:text-slate-400"}`}>
                {plan.subtitle}
              </span>
            </div>
            <ul className={`mt-6 space-y-3 text-sm ${idx === 1 ? "text-sky-50" : "text-slate-700 dark:text-slate-300"}`}>
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Link
              href={plan.name === "Free" ? "/auth/signup" : "/settings"}
              className={`inline-flex mt-8 w-full justify-center px-5 py-3 rounded-xl font-semibold transition-colors ${
                idx === 1
                  ? "bg-white text-blue-700 hover:bg-sky-50"
                  : "brand-button"
              }`}
            >
              {plan.name === "Free" ? "Create free workspace" : "Upgrade in settings"}
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
