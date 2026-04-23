"use client";
import { useEffect, useRef } from "react"

export default function VeeLanding() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cur = cursorRef.current!
    const ring = ringRef.current!

    let rx = 0,
      ry = 0,
      cx = 0,
      cy = 0

    const move = (e: MouseEvent) => {
      cx = e.clientX
      cy = e.clientY
      cur.style.left = cx + "px"
      cur.style.top = cy + "px"
    }

    document.addEventListener("mousemove", move)

    const anim = () => {
      rx += (cx - rx) * 0.12
      ry += (cy - ry) * 0.12
      ring.style.left = rx + "px"
      ring.style.top = ry + "px"
      requestAnimationFrame(anim)
    }

    anim()

    return () => document.removeEventListener("mousemove", move)
  }, [])

  return (
    <div className="bg-white text-slate-900 overflow-x-hidden font-sans">
      {/* cursor */}
      <div
        ref={cursorRef}
        className="fixed z-[9999] pointer-events-none w-2.5 h-2.5 rounded-full bg-sky-400 -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={ringRef}
        className="fixed z-[9998] pointer-events-none w-10 h-10 rounded-full border border-sky-300 -translate-x-1/2 -translate-y-1/2"
      />

      {/* HERO */}
      <section className="min-h-screen grid lg:grid-cols-2 relative">
        <div className="absolute right-[-5rem] top-1/2 -translate-y-1/2 text-[28vw] font-serif text-sky-100 select-none pointer-events-none">
          V
        </div>

        <div className="px-6 lg:px-20 pt-32 pb-20 flex flex-col justify-end">
          <div className="inline-flex items-center gap-2 border border-sky-200 px-4 py-1 rounded-full text-xs tracking-widest uppercase text-sky-600 mb-10">
            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
            New Collection — SS '26
          </div>

          <h1 className="font-serif text-5xl lg:text-7xl leading-none">
            <strong className="block">Define Your</strong>
            <em className="italic text-sky-500">Lifestyle</em>
            <strong className="block">Aesthetic.</strong>
          </h1>

          <p className="mt-6 text-slate-500 max-w-md leading-relaxed">
            Premium kicks and apparel delivered straight to your door.
            Curated selections. M-Pesa checkout. Nairobi's finest.
          </p>

          <div className="flex gap-4 mt-8 flex-wrap">
            <button className="bg-sky-500 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-sky-600 transition">
              Shop Everything
            </button>

            <button className="border border-sky-300 px-8 py-3 rounded-full text-sm font-semibold hover:bg-sky-50">
              Women's Edit
            </button>
          </div>
        </div>

        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=1400&auto=format&fit=crop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-sky-100 py-4 overflow-hidden bg-sky-50">
        <div className="flex gap-16 whitespace-nowrap animate-[marquee_25s_linear_infinite]">
          {[
            "Free Delivery Over KES 3,000",
            "100% Authentic Gear",
            "Secure M-Pesa Checkout",
            "GPS Tracked Delivery",
            "New Collection Live",
            "Exclusive Drops Weekly",
          ].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-sky-600"
            >
              <span className="w-1 h-1 bg-sky-400 rounded-full" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 border-b border-sky-100">
        {[
          ["Instant Delivery", "GPS-tracked delivery straight to your door"],
          ["100% Authentic", "Every piece vetted and verified."],
          ["Secure M-Pesa", "Frictionless STK Push checkout"],
          ["Free Shipping", "No cost delivery above KES 3,000"],
        ].map(([title, desc]) => (
          <div
            key={title}
            className="p-10 border-r border-sky-100 last:border-none"
          >
            <div className="w-12 h-12 rounded-xl border border-sky-200 flex items-center justify-center mb-6 bg-sky-50" />

            <h3 className="font-serif text-xl mb-2">{title}</h3>

            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* CATEGORIES */}
      <section className="py-24 px-6 lg:px-20">
        <h2 className="font-serif text-4xl mb-12">
          Featured <span className="text-sky-500 italic">Categories</span>
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          <Category
            title="Kicks"
            tag="Latest Drops"
            img="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=900"
          />

          <Category
            title="Apparel"
            tag="New In"
            img="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=900"
          />

          <Category
            title="Women's Edit"
            tag="Exclusive"
            img="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=900"
          />
        </div>
      </section>

      {/* STATEMENT */}
      <section className="py-32 text-center border-y border-sky-100 bg-sky-50">
        <h2 className="font-serif text-5xl mb-6">
          Fashion That <span className="italic text-sky-500">Moves</span>
          <br />
          Like You Do.
        </h2>

        <p className="text-slate-500 max-w-xl mx-auto mb-8">
          Join thousands of Kenyans who've made VEE their go-to for premium
          streetwear and elite kicks.
        </p>

        <button className="bg-sky-500 text-white px-8 py-3 rounded-full">
          Start Shopping
        </button>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-6 lg:px-20">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <h3 className="font-serif text-3xl mb-3">
              VEE<span className="text-sky-500">.</span>
            </h3>

            <p className="text-slate-500 text-sm">
              Premium lifestyle fashion for the bold and the free.
            </p>
          </div>

          <FooterCol title="Shop" items={["Shoes", "Apparel", "Women's"]} />
          <FooterCol title="Account" items={["Orders", "Wishlist", "Sign In"]} />
          <FooterCol title="Support" items={["hello@vee.co.ke", "+254700000"]} />
        </div>
      </footer>
    </div>
  )
}

function Category({ title, tag, img }: any) {
  return (
    <div className="relative rounded-3xl overflow-hidden group">
      <img src={img} className="w-full h-[420px] object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

      <div className="absolute bottom-8 left-8">
        <div className="text-xs tracking-widest text-sky-500 mb-2">{tag}</div>

        <h3 className="font-serif text-3xl mb-2">{title}</h3>

        <button className="mt-2 bg-sky-500 text-white px-6 py-2 rounded-full text-sm">
          Shop
        </button>
      </div>
    </div>
  )
}

function FooterCol({ title, items }: any) {
  return (
    <div>
      <h4 className="text-xs tracking-widest text-sky-500 mb-4 uppercase">
        {title}
      </h4>

      <ul className="space-y-2 text-slate-500 text-sm">
        {items.map((i: string) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}