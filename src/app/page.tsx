import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  MessageCircle,
  MessageSquareHeart,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  UserRoundCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

const navItems = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const trustPoints = [
  "Dipakai bisnis lokal yang butuh respons cepat",
  "Sistem follow-up manual yang aman untuk WhatsApp",
  "AI insight tanpa auto-spam",
];

const problems = [
  "Chat customer tersebar dan sulit dipantau tim",
  "Follow-up prospek sering terlewat",
  "Admin lambat menyusun balasan yang relevan",
  "Leads panas tidak cepat terdeteksi",
];

const solutions = [
  {
    title: "AI Chat Summary",
    description: "Ringkas percakapan otomatis agar admin paham konteks dengan cepat.",
    icon: Sparkles,
  },
  {
    title: "Lead Scoring",
    description: "Tandai prospek cold, warm, hot, sampai deal agar fokus closing lebih tepat.",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    title: "Suggested Reply Draft",
    description: "Buat draft balasan siap-edit agar respon tetap cepat dan konsisten.",
    icon: MessageSquareHeart,
  },
  {
    title: "Follow-up Reminder",
    description: "Jadwalkan tindak lanjut supaya peluang penjualan tidak hilang.",
    icon: Clock3,
  },
];

const steps = [
  {
    title: "1. Customer Chat Masuk",
    description: "Semua pesan WhatsApp masuk ke shared inbox tim.",
    icon: MessageCircle,
  },
  {
    title: "2. AI Analisis Percakapan",
    description: "Sistem menganalisis intent, merangkum, dan memberi lead score.",
    icon: Bot,
  },
  {
    title: "3. Admin Follow-up Cepat",
    description: "Admin review draft, kirim balasan, lalu lanjutkan ke order atau reminder.",
    icon: UserRoundCheck,
  },
];

const featureCards = [
  { title: "Shared WhatsApp Inbox", desc: "Satu inbox untuk banyak admin dengan histori terpusat.", icon: MessageCircle },
  { title: "AI Chat Summary", desc: "Ringkasan instan untuk setiap conversation customer.", icon: Sparkles },
  { title: "Lead Scoring", desc: "Prioritaskan prospek dengan status lead yang jelas.", icon: Star },
  { title: "Suggested Reply Draft", desc: "Balasan cepat tetap dengan kontrol penuh dari admin.", icon: MessageSquareHeart },
  { title: "Draft Order Extraction", desc: "Buat order draft langsung dari konteks percakapan.", icon: ClipboardList },
  { title: "Follow-up Reminder", desc: "Atur jadwal follow-up tanpa kehilangan momentum.", icon: Clock3 },
  { title: "Lightweight Customer CRM", desc: "Simpan profil, tag, dan riwayat customer secara rapi.", icon: Briefcase },
  { title: "Product Catalog Support", desc: "AI memahami produk, stok, dan konteks harga yang aktif.", icon: Store },
];

const useCases = [
  "Spa & Wellness",
  "Beauty Clinic",
  "Furniture Store",
  "Fashion Brand",
  "Hampers Business",
  "Property Leads",
  "Travel Booking",
  "Education / Course",
];

const faqs = [
  {
    q: "Apakah ini chatbot auto-reply penuh?",
    a: "Bukan. WAI fokus memberi AI insight dan draft yang tetap direview admin sebelum kirim.",
  },
  {
    q: "Apakah bisa balas otomatis tanpa admin?",
    a: "Tidak untuk MVP ini. Pengiriman manual dipertahankan agar aman dan mengurangi risiko spam.",
  },
  {
    q: "Apakah aman untuk WhatsApp bisnis?",
    a: "WAI menerapkan pendekatan inbound-first, cooldown, dan limit harian untuk mitigasi risiko.",
  },
  {
    q: "Apakah bisa dipakai banyak admin?",
    a: "Bisa. Shared inbox dirancang untuk kolaborasi tim sales dan admin operasional.",
  },
  {
    q: "Apakah wajib punya website?",
    a: "Tidak wajib. Sistem ini bisa langsung dipakai untuk alur penjualan berbasis WhatsApp.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Rp299k",
    period: "/bulan",
    points: ["1 bisnis", "Shared inbox", "AI summary + lead score", "Email support"],
  },
  {
    name: "Growth",
    price: "Rp699k",
    period: "/bulan",
    points: ["3 admin", "Draft reply + follow-up board", "Customer CRM", "Priority support"],
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    points: ["Multi-brand setup", "Advanced policy control", "Onboarding assistance", "Dedicated support"],
  },
];

export default async function HomePage() {
  const session = await getSession();

  if (session?.businessId) {
    redirect("/dashboard/inbox");
  }

  return (
    <div className="relative overflow-x-clip">
      <div className="hero-orb -left-24 top-16 h-64 w-64 bg-emerald-200/45" />
      <div className="hero-orb -right-20 top-0 h-72 w-72 bg-green-100/55" />

      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
              WAI
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-900">WAI Sales Assistant</p>
              <p className="text-xs text-zinc-500">WhatsApp AI Sales System</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex">
            {navItems.map((item) => (
              <a key={item.href} className="transition-colors hover:text-zinc-900" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-18 pt-14 md:grid-cols-[1.05fr_1fr] md:px-6 md:pb-24 md:pt-20">
          <div className="reveal-up space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Sales Workflow for WhatsApp
            </span>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 md:text-5xl">
              Ubah WhatsApp Bisnis Menjadi Sistem Penjualan yang Rapi dan Pintar
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-zinc-600 md:text-lg">
              Atur chat customer, deteksi prospek, susun balasan lebih cepat, dan follow-up tanpa ribet lewat satu
              dashboard modern.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#pricing">Book Demo</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
              {trustPoints.map((item) => (
                <p key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="reveal-up relative">
            <div className="soft-panel grid-backdrop relative rounded-[30px] border border-zinc-200 p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Sales Inbox</p>
                  <p className="text-xs text-zinc-500">12 conversation aktif</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Team Online
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.15fr_.85fr]">
                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-sm font-medium text-zinc-900">Ayu - Beauty Clinic</p>
                    <p className="text-xs text-zinc-600">“Untuk treatment acne minggu ini masih ada slot?”</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-sm font-medium text-zinc-900">Dita - Furniture</p>
                    <p className="text-xs text-zinc-600">“Sofa 3 seat warna cream ready?”</p>
                  </div>
                  <div className="rounded-xl bg-emerald-600 p-3 text-white">
                    <p className="text-sm font-medium">Draft Reply</p>
                    <p className="mt-1 text-xs text-emerald-50">“Ready kak, saya kirim detail pilihan dan pricelist ya.”</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">AI Summary</p>
                    <p className="mt-1 text-xs text-zinc-700">Prospek meminta jadwal treatment + estimasi harga.</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">Lead Score</p>
                    <p className="text-sm font-semibold text-zinc-900">Hot 88/100</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">Next Action</p>
                    <p className="text-sm font-semibold text-zinc-900">Follow-up 2 jam</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="soft-panel float-slow absolute -right-3 -top-4 max-w-56 rounded-2xl p-3 md:-right-8">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Lead Alert</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">3 prospek hot butuh respon</p>
            </div>

            <div className="soft-panel float-slow float-delay absolute -bottom-5 left-2 max-w-56 rounded-2xl p-3 md:-left-7">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Follow-up Board</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">8 reminder hari ini</p>
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white/80">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-7 text-sm text-zinc-600 md:grid-cols-3 md:px-6">
            {trustPoints.map((point) => (
              <div key={point} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
                {point}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--surface-soft)]">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:px-6 md:py-20">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Problem</p>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">Tim sales kewalahan saat chat mulai ramai</h2>
              <div className="space-y-3">
                {problems.map((item) => (
                  <div key={item} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Solution</p>
              <h3 className="text-3xl font-semibold tracking-tight text-zinc-900">WAI menyusun alur kerja chat jadi terukur</h3>
              <div className="grid gap-3">
                {solutions.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <Icon className="mb-2 h-5 w-5 text-emerald-600" />
                      <p className="text-base font-semibold text-zinc-900">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">How It Works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Dari chat masuk hingga closing, semua jelas langkahnya</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                    <Icon className="mb-3 h-6 w-6 text-emerald-600" />
                    <p className="text-base font-semibold text-zinc-900">{item.title}</p>
                    <p className="mt-2 text-sm text-zinc-600">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="bg-[var(--surface-soft)]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Feature Showcase</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Semua tools penting untuk operasi sales WhatsApp</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-5">
                    <Icon className="mb-3 h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                    <p className="mt-2 text-sm text-zinc-600">{item.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Dashboard Preview</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Inbox, customer detail, dan follow-up dalam satu flow</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-zinc-900">Inbox Command Center</p>
                <p className="mt-2 text-sm text-zinc-600">Daftar chat, panel percakapan, dan AI insights tampil bersamaan.</p>
              </article>
              <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-zinc-900">Customer & CRM View</p>
                <p className="mt-2 text-sm text-zinc-600">Profil customer, lead status, histori chat, dan orders terhubung.</p>
              </article>
              <article className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-3 inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <p className="text-base font-semibold text-zinc-900">Follow-up & Safety Layer</p>
                <p className="mt-2 text-sm text-zinc-600">Reminder, cooldown, dan limit harian untuk menjaga akun tetap aman.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[var(--surface-soft)]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Use Cases</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Template industri yang paling sering pakai WAI</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {useCases.map((item) => (
                <article key={item} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700">
                  {item}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Pricing</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Pilih paket sesuai ritme tim penjualan Anda</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-2xl border p-5 ${
                    plan.featured
                      ? "border-emerald-300 bg-emerald-50/55 shadow-lg shadow-emerald-100"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-zinc-900">{plan.name}</p>
                    <p className="mt-2 text-3xl font-semibold text-zinc-900">
                      {plan.price}
                      <span className="ml-1 text-sm font-medium text-zinc-500">{plan.period}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    {plan.points.map((point) => (
                      <p key={point} className="flex items-center gap-2 text-sm text-zinc-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        {point}
                      </p>
                    ))}
                  </div>
                  <Button asChild className="mt-5 w-full" variant={plan.featured ? "default" : "outline"}>
                    <Link href="/login">{plan.featured ? "Pilih Growth" : "Mulai Sekarang"}</Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-[var(--surface-soft)]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">FAQ</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Pertanyaan yang sering ditanyakan</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {faqs.map((item) => (
                <article key={item.q} className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <p className="text-base font-semibold text-zinc-900">{item.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6 md:pb-20">
            <div className="rounded-[28px] border border-zinc-200 bg-zinc-900 px-6 py-10 text-white md:px-10 md:py-12">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <ShieldCheck className="h-3.5 w-3.5" />
                Final CTA
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Siap rapikan proses closing dari WhatsApp Anda?
              </h2>
              <p className="mt-3 max-w-2xl text-zinc-300">
                Mulai dari inbox yang lebih terstruktur, insight AI yang actionable, dan follow-up yang tidak lagi
                terlewat.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/login">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                  <Link href="#pricing">Book Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div>
            <p className="text-sm font-semibold text-zinc-900">WAI Sales Assistant</p>
            <p className="mt-2 text-sm text-zinc-600">Turn your business WhatsApp into a smart sales workflow.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Product</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              <li>Inbox</li>
              <li>Lead Scoring</li>
              <li>Follow Up Board</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Support</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              <li>Help Center</li>
              <li>Contact Sales</li>
              <li>Status</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Legal</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              <li>Privacy</li>
              <li>Terms</li>
              <li>Compliance</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} WAI Sales Assistant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
