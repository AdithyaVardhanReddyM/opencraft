"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  Layers,
  Layout,
  Zap,
  Sparkles,
  CreditCard,
  Gem,
  History,
  CheckCircle,
  Headphones,
  Wallet,
  MessageCircle,
} from "lucide-react";
import { useEffect, useRef } from "react";
import Script from "next/script";

export default function Page() {
  const spotlightRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      spotlightRefs.current.forEach((card) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const addSpotlightRef = (el: HTMLDivElement | null) => {
    if (el && !spotlightRefs.current.includes(el)) {
      spotlightRefs.current.push(el);
    }
  };

  return (
    <div className="landing-page min-h-screen overflow-x-hidden selection:bg-primary selection:text-primary-foreground relative bg-[#030303] text-white">
      {/* Animated Background - UnicornStudio */}
      <div
        className="fixed inset-0 w-full h-screen z-0 pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(transparent, black 0%, black 80%, transparent)",
          filter: "hue-rotate(190deg) saturate(1.2)",
        }}
      >
        <div
          data-us-project="FixNvEwvWwbu3QX9qC3F"
          className="absolute inset-0 w-full h-full"
          style={{ minHeight: "100vh" }}
        />
      </div>
      <Script
        id="unicorn-studio"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(){if(!window.UnicornStudio){window.UnicornStudio={isInitialized:!1};var i=document.createElement("script");i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js",i.onload=function(){window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)},(document.head || document.body).appendChild(i)}}();
          `,
        }}
      />

      {/* Background Effects */}
      <div className="fixed inset-0 landing-grid-bg pointer-events-none z-[1]" />

      {/* Navigation: Pill Shaped & Floating */}
      <nav className="fixed -translate-x-1/2 flex shadow-black/50 transition-all duration-300 hover:border-white/20 hover:shadow-primary/5 bg-gradient-to-br from-white/10 to-white/0 w-full lg:w-fit max-w-[90vw] z-50 rounded-full ring-white/10 ring-1 pt-1.5 pr-1.5 pb-1.5 pl-4 top-6 left-1/2 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] backdrop-blur-xl items-center justify-between">
        {/* Logo Area */}
        <Link href="/" className="flex items-center mr-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/unitset_fulllogo.svg"
            alt="Unit Set"
            className="h-5 w-auto"
          />
        </Link>

        {/* Links (Hidden on small screens) */}
        <div className="hidden md:flex items-center gap-6 mr-8">
          <Link
            href="#features"
            className="text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            How it Works
          </Link>
          <Link
            href="#pricing"
            className="text-xs font-medium text-white/50 hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </div>

        {/* Action Button */}
        <Button
          asChild
          size="sm"
          className="flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors group text-xs font-semibold rounded-full py-2 px-4 items-center"
        >
          <Link href="/sign-up">
            Get Started
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </nav>

      {/* Main Content */}
      <main className="container lg:px-12 flex flex-col z-10 mx-auto pt-32 px-6 relative items-center">
        {/* Hero Text - Centered */}
        <div className="flex flex-col items-center text-center w-full max-w-3xl pt-12 pb-16">
          {/* <h4 className="text-xs font-mono tracking-[0.2em] text-white/40 uppercase mb-6 flex items-center gap-2 justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            AI-Powered Design
          </h4> */}

          <h1 className="lg:text-6xl leading-[1.1] text-primary landing-text-glow text-4xl italic tracking-tight font-serif mb-5">
            Vibe design for
            <br />
            <span className="text-white opacity-90">vibe coders.</span>
          </h1>

          <p className="font-sans text-lg lg:text-xl font-light text-white/70 leading-relaxed tracking-tight max-w-xl mb-10">
            A simple yet powerful design tool for developers who want to level
            up their UI game. Intuitive canvas, AI-powered generation, sandboxes
            for live previews, and{" "}
            <span className="text-white font-medium">so much more</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
            {/* Animated Shiny CTA Button */}
            <button className="landing-shiny-cta focus:outline-hidden">
              <span>Start Designing</span>
            </button>

            {/* Secondary Button */}
            <button className="hover:bg-white/10 hover:text-white transition-all flex text-sm font-medium text-slate-300 bg-white/5 rounded-full py-5 px-10 gap-2 items-center group landing-border-gradient">
              <span className="text-sm font-medium tracking-tight">
                Watch Demo
              </span>
              <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Canvas Preview - Below Hero */}
        <div className="w-full flex relative items-center justify-center pb-32">
          {/* Background Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[60%] bg-primary/30 blur-[120px] rounded-full opacity-50" />
          </div>

          {/* Canvas Image with Primary Border */}
          <div className="relative w-full max-w-4xl group">
            {/* Outer Glow Ring */}
            <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

            {/* Image Container */}
            <div className="relative rounded-xl overflow-hidden border-2 border-primary/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_-10px_rgba(var(--primary),0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/canvas_resized.png"
                alt="Unit Set Canvas - AI-powered design interface"
                className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>

        {/* Logo Marquee Section */}
      </main>

      {/* Features Section */}
      <section className="flex flex-col overflow-hidden lg:px-12 z-10 bg-black/50 w-full border-white/5 border-t pt-32 px-6 pb-32 relative backdrop-blur-3xl items-center">
        {/* Clean Background Line */}
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mb-24 relative z-10">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium tracking-tight text-white mb-8">
            Design intelligence
            <span className="text-white/60"> made effortless.</span>
          </h2>

          <p className="text-xl text-white/60 leading-relaxed max-w-2xl font-light tracking-tight">
            Streamline your design workflow with AI-driven tools designed to
            simplify, automate, and enhance your creative process.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 z-10 w-full max-w-7xl relative">
          {/* Card 1: AI Generation */}
          <div
            ref={addSpotlightRef}
            className="landing-spotlight-card group relative flex flex-col p-10 rounded-[32px] border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-500"
          >
            <div className="landing-spotlight-bg pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="landing-spotlight-border pointer-events-none absolute inset-0 rounded-[32px] border border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-2xl font-semibold tracking-tight text-white mb-4 relative z-10">
              AI-Driven Generation
            </h3>
            <p className="text-base text-white/50 leading-relaxed mb-12 relative z-10 font-light">
              Describe your interface in plain English. Watch as unit {`{set}`}{" "}
              generates fully editable, layer-based designs in seconds.
            </p>

            {/* Visual: Chat/Terminal UI */}
            <div className="relative z-10 mt-auto w-full h-72 rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden flex flex-col shadow-2xl">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2 opacity-50">
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                </div>
                <span className="text-xs text-white/30 font-mono">
                  UNIT_SET v1.0
                </span>
              </div>
              <div className="p-6 flex flex-col gap-5 relative h-full">
                {/* User Message */}
                <div className="self-end max-w-[90%] bg-white/10 backdrop-blur-sm rounded-2xl rounded-tr-sm p-4 border border-white/5">
                  <p className="text-xs text-white/90 font-light leading-relaxed">
                    Create a{" "}
                    <span className="text-white font-medium">
                      modern dashboard
                    </span>{" "}
                    with <span className="text-primary">dark theme</span>.
                  </p>
                </div>

                {/* System Message */}
                <div className="self-start max-w-[90%] bg-white/[0.03] backdrop-blur-md rounded-2xl rounded-tl-sm p-5 border border-white/10 relative overflow-hidden group-hover:border-primary/20 transition-colors duration-500">
                  <div className="flex items-center gap-2 mb-3 text-primary font-mono text-[10px] uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" /> AI Assistant
                  </div>
                  <p className="mb-4 text-xs text-white/80 font-light">
                    Generating dashboard layout with sidebar navigation...
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-black/40 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-primary h-full w-[85%] animate-pulse" />
                  </div>
                  <div className="flex justify-between text-[10px] text-primary/60 font-mono">
                    <span>GENERATING</span>
                    <span>85%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Smart Layouts (Featured) */}
          <div
            ref={addSpotlightRef}
            className="landing-spotlight-card relative flex flex-col p-[1px] rounded-[32px] overflow-hidden lg:-mt-8 lg:mb-8 z-20 group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-[32px]" />
            <div className="absolute inset-0 bg-[#050505] rounded-[31px] m-[1px] overflow-hidden">
              <div className="landing-spotlight-bg pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
            </div>
            <div className="landing-spotlight-border pointer-events-none absolute inset-0 rounded-[32px] border border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50" />

            <div className="relative z-10 flex flex-col h-full p-10 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Zap className="h-6 w-6 text-primary relative z-10" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-white group-hover:text-white transition-colors">
                  Smart Layouts
                </h3>
              </div>
              <p className="text-base text-white/50 leading-relaxed mb-12 font-light group-hover:text-white/70 transition-colors">
                Responsive by default. Elements automatically adjust as you
                resize, just like you&apos;d expect from a modern design tool.
              </p>

              {/* Visual: Orbit Animation */}
              <div className="mt-auto relative w-full h-80 flex items-center justify-center">
                {/* Sonar Rings */}
                <div
                  className="absolute w-96 h-96 border border-primary/5 rounded-full animate-ping opacity-10"
                  style={{ animationDuration: "4s" }}
                />
                <div
                  className="absolute w-80 h-80 border border-white/5 rounded-full animate-ping opacity-20"
                  style={{ animationDuration: "3s", animationDelay: "0.7s" }}
                />

                {/* Rotating Rings */}
                <div
                  className="absolute w-64 h-64 border border-white/5 rounded-full landing-animate-spin-slow"
                  style={{ animationDuration: "40s" }}
                >
                  <div className="absolute top-1/2 -right-1 w-2 h-2 bg-white/10 rounded-full" />
                  <div className="absolute top-1/2 -left-1 w-2 h-2 bg-white/10 rounded-full" />
                </div>
                <div
                  className="absolute w-60 h-60 border border-white/10 rounded-full landing-animate-spin-slow"
                  style={{ animationDuration: "30s" }}
                />
                <div
                  className="absolute w-44 h-44 border border-white/5 rounded-full landing-animate-spin-slow-reverse border-dashed"
                  style={{ animationDuration: "20s" }}
                />
                <div
                  className="absolute w-36 h-36 border border-primary/20 rounded-full landing-animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ animationDuration: "15s" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary mt-[-3px] rounded-full shadow-[0_0_10px_rgba(var(--primary),1)]" />
                </div>

                {/* Orbiting Elements */}
                <div
                  className="absolute w-60 h-60 landing-animate-spin-slow"
                  style={{ animationDuration: "30s" }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] p-2.5 rounded-full border border-white/10 group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] transition-all duration-500">
                    <Gem className="h-4 w-4 text-white/40 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 bg-[#050505] p-2.5 rounded-full border border-white/10 group-hover:border-primary/30 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] transition-all duration-500">
                    <CreditCard className="h-4 w-4 text-white/40 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Central Hub */}
                <div className="z-10 flex group-hover:border-primary/40 transition-colors duration-500 bg-[#0F110E] w-24 h-24 border-white/10 border rounded-3xl relative items-center justify-center overflow-hidden shadow-2xl">
                  <Layers className="h-8 w-8 text-white relative z-20 group-hover:text-primary transition-colors duration-500" />
                  <div className="animate-pulse bg-gradient-to-tr from-transparent via-primary/10 to-transparent absolute inset-0 z-10" />
                  <div
                    className="absolute inset-0 opacity-20 z-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(#fff 0.5px, transparent 0.5px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                </div>

                <div className="absolute bottom-4 flex flex-col items-center">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 group-hover:border-primary/20 transition-colors">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                    </span>
                    <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase group-hover:text-white/70 transition-colors">
                      System Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Real-time Collaboration */}
          <div
            ref={addSpotlightRef}
            className="landing-spotlight-card group relative flex flex-col p-10 rounded-[32px] border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-500"
          >
            <div className="landing-spotlight-bg pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="landing-spotlight-border pointer-events-none absolute inset-0 rounded-[32px] border border-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-2xl font-semibold tracking-tight text-white mb-4 relative z-10">
              Real-time Collaboration
            </h3>
            <p className="text-base text-white/50 leading-relaxed mb-12 relative z-10 font-light">
              Work with your team in real-time. See cursors, leave comments, and
              iterate together on the infinite canvas.
            </p>

            {/* Visual: Dashboard UI */}
            <div className="relative mt-auto w-full h-72 rounded-2xl border border-white/10 bg-[#0A0A0A] p-7 flex flex-col justify-center gap-6 shadow-2xl">
              {/* Team Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-none" />
                  <span className="text-xs text-white/50 font-mono uppercase tracking-wider">
                    Project_V2
                  </span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full border border-[#0A0A0A] bg-white/10 flex items-center justify-center text-white/80 text-[10px] font-medium">
                    JD
                  </div>
                  <div className="w-7 h-7 rounded-full border border-[#0A0A0A] bg-primary/20 flex items-center justify-center text-primary text-[10px] font-medium">
                    AS
                  </div>
                  <div className="w-7 h-7 rounded-full border border-[#0A0A0A] bg-white/5 flex items-center justify-center text-[9px] text-white/40">
                    +3
                  </div>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="relative py-1">
                <div className="flex justify-between text-[10px] text-white/40 mb-2 font-mono uppercase">
                  <span>Design Progress</span>
                  <span className="text-primary">75% Complete</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full relative flex items-center">
                  <div className="absolute left-0 h-full w-[75%] bg-white/80 rounded-full" />
                  <div className="absolute left-[75%] w-4 h-4 bg-white rounded-full z-10 transform -translate-x-1/2 border-2 border-[#0A0A0A] cursor-grab" />
                  <div className="absolute left-[75%] -top-9 -translate-x-1/2 bg-[#151515] border border-white/10 text-white text-[10px] px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap animate-bounce">
                    Editing...
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#151515] border-r border-b border-white/10 transform rotate-45" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <History className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-xs text-white/60 font-medium">
                    History
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-primary font-medium">
                    Approve
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-24 relative z-10">
          <button className="group relative px-9 py-4 rounded-full bg-white text-black font-semibold text-sm transition-all duration-300 hover:bg-[#e5e5e5] flex items-center gap-3 overflow-hidden tracking-tight">
            <span className="relative z-10">Explore All Features</span>
            <ArrowRight className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0" />
          </button>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="overflow-hidden flex flex-col px-6 md:px-8 lg:px-12 z-10 bg-[#030303]/80 w-full border-white/5 border-t pt-32 pb-32 relative backdrop-blur-xl items-center">
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 landing-grid-bg opacity-50 pointer-events-none" />

        <div className="max-w-7xl w-full relative z-10">
          {/* Header Group */}
          <div className="flex flex-col gap-8 mb-24 max-w-5xl">
            <span className="text-xs font-mono text-white/40 uppercase tracking-[0.2em] font-medium pl-1 flex items-center gap-3">
              <span className="w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
              Built for Modern Designers
            </span>

            <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif font-medium tracking-tight text-white leading-[1.1]">
              The modern designer doesn&apos;t fit in a single tool —
              <span className="text-white/50">
                {" "}
                they sketch, they iterate, they ship fast.
              </span>{" "}
              This platform was made for them.
            </h2>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-end">
            {/* Visual / Portrait Block */}
            <div className="lg:col-span-4 relative group">
              <div className="relative w-full aspect-[3.5/4] rounded-[24px] overflow-hidden border border-white/10 bg-white/[0.02]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&crop=face"
                  alt="Designer Profile"
                  className="w-full h-full object-cover grayscale mix-blend-luminosity opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-80" />
                <div className="absolute top-5 left-5 right-5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="flex gap-1.5">
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                  </div>
                  <div className="px-2 py-0.5 rounded border border-white/10 bg-black/20 backdrop-blur-md">
                    <span className="text-[9px] font-mono text-primary tracking-wider">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimony & Actions Block */}
            <div className="lg:col-span-8 flex flex-col justify-end h-full relative">
              {/* Quote */}
              <blockquote className="mb-12 relative">
                <svg
                  className="absolute -top-6 -left-8 w-6 h-6 text-white/10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                </svg>
                <p className="text-xl md:text-2xl lg:text-3xl text-white/80 font-light leading-relaxed tracking-tight">
                  &quot;I used to juggle between Figma, code editors, and AI
                  tools. This platform keeps it simple — I describe what I want
                  and get production-ready designs without the cognitive
                  load.&quot;
                </p>
              </blockquote>

              {/* Author */}
              <div className="mb-12 flex items-center gap-4">
                <div className="h-px w-8 bg-primary/30" />
              </div>

              {/* Bottom Row: Stat & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-white/5 pt-8">
                {/* Metric Pill */}
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group cursor-default">
                  <span className="text-[10px] md:text-xs text-white/50 font-mono uppercase tracking-wide group-hover:text-white/70 transition-colors">
                    Design Speed Up <span className="text-primary">10x</span>{" "}
                    since launch
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-primary transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* CTA Button */}
                <button className="landing-shiny-cta group !px-7 !py-3">
                  <span className="text-sm font-medium">Start Designing</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exchange/Product Section */}
      <section className="lg:px-12 flex flex-col overflow-hidden z-10 bg-[#030303]/50 w-full border-white/5 border-t px-6 py-32 relative backdrop-blur-xl items-center">
        {/* Background Texture */}
        <div className="absolute inset-0 landing-grid-bg opacity-70 pointer-events-none" />

        <div className="max-w-7xl w-full relative z-10">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-12 mb-20">
            <div className="flex flex-col gap-6 max-w-3xl">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-white/50">
                  03
                </span>
                <span className="text-xs font-mono text-primary/90 uppercase tracking-[0.2em]">
                  Design Infrastructure
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight text-white leading-[1.1]">
                Create & Export
                <span className="text-white/40 italic">
                  {" "}
                  Production-Ready Code.
                </span>
              </h2>
            </div>

            <div className="max-w-sm pb-2">
              <p className="text-white/50 text-sm leading-relaxed font-light">
                Direct design-to-code pipeline with clean, semantic output.
                Export to React, Vue, or vanilla HTML/CSS with zero friction.
              </p>
            </div>
          </div>

          {/* Main Feature Card */}
          <div className="w-full rounded-[24px] border border-white/10 bg-[#080808] overflow-hidden flex flex-col lg:flex-row relative group">
            {/* Left Column: Content */}
            <div className="lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center items-start z-10 relative bg-[#080808]">
              <h3 className="text-3xl md:text-4xl font-serif font-medium text-white mb-6 tracking-tight">
                Design, Generate & Ship Components.
              </h3>
              <p className="text-white/60 mb-10 leading-relaxed font-light max-w-md text-base">
                Initialize your project and generate components across multiple
                frameworks. One interface for design, code, and deployment.
              </p>

              <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                <Button className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-w-[140px]">
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="px-8 py-3.5 border border-white/10 text-white font-medium text-sm rounded-full hover:bg-white/5 transition-colors flex items-center justify-center gap-2 min-w-[140px] bg-transparent"
                >
                  View Examples
                </Button>
              </div>
            </div>

            {/* Right Column: Technical Illustration */}
            <div className="lg:w-1/2 bg-[#050505] relative min-h-[400px] border-t lg:border-t-0 lg:border-l border-white/5 overflow-hidden flex items-center justify-center">
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                  backgroundSize: "48px 96px",
                }}
              />

              <div className="relative w-full h-full flex items-center justify-center p-12">
                <div className="relative w-72 h-56 transform hover:rotate-0 transition-transform duration-700 ease-out">
                  {/* Background Panel */}
                  <div className="absolute top-0 right-0 w-56 h-36 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl z-0 overflow-hidden">
                    <div className="h-8 border-b border-white/5 flex items-center px-3 gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <div className="h-12 bg-white/5 rounded border border-white/5" />
                      <div className="h-12 bg-white/5 rounded border border-white/5" />
                    </div>
                  </div>

                  {/* Foreground Panel */}
                  <div className="absolute bottom-4 left-4 w-44 h-32 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,1)] z-10 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/[0.01]">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-black"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span className="text-[10px] font-mono text-white/60">
                          Component
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-primary">
                        Ready
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/40">Export</span>
                        <span className="text-xs text-white font-mono">
                          React
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-primary" />
                      </div>
                    </div>
                  </div>

                  {/* Floating Icon */}
                  <div
                    className="absolute -top-6 -left-6 w-12 h-12 bg-[#050505] border border-white/10 rounded-full flex items-center justify-center z-20 shadow-xl animate-bounce"
                    style={{ animationDuration: "4s" }}
                  >
                    <svg
                      className="w-5 h-5 text-white/80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M12 2v20M2 12h20" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="flex lg:px-12 bg-[#030303]/80 w-full z-10 border-white/5 border-t px-6 py-32 relative backdrop-blur-xl justify-center">
        <div className="w-full max-w-7xl bg-primary rounded-[32px] relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-end justify-between p-10 lg:p-24 group">
          {/* Animated Effects */}
          <div className="absolute inset-0 opacity-20 mix-blend-soft-light bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
          <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-white/20 blur-[120px] rounded-full pointer-events-none opacity-60 mix-blend-overlay group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />

          {/* Left Content */}
          <div className="relative z-10 flex flex-col max-w-2xl mb-12 lg:mb-0">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight text-[#030303] mb-8 leading-[1.05]">
              Ready to transform your{" "}
              <span className="opacity-60 italic">design workflow?</span>
            </h2>

            {/* Interaction Card */}
            <Link
              href="/sign-up"
              className="group/card relative mt-4 w-full sm:w-80 h-36 bg-[#030303]/5 border border-[#030303]/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-[#030303]/10 hover:border-[#030303]/20 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <MessageCircle className="h-8 w-8 text-[#030303] opacity-80" />
                <ArrowUpRight className="h-6 w-6 text-[#030303] opacity-40 group-hover/card:opacity-100 group-hover/card:translate-x-1 group-hover/card:-translate-y-1 transition-all" />
              </div>
              <div>
                <span className="block text-[#030303] font-semibold text-lg tracking-tight">
                  Start Free Trial
                </span>
                <span className="text-[#030303]/60 text-xs font-medium uppercase tracking-wider">
                  No credit card required
                </span>
              </div>
            </Link>
          </div>

          {/* Right Content */}
          <div className="relative z-10 max-w-md pb-2 lg:text-right flex flex-col items-start lg:items-end gap-6">
            <p className="text-[#030303]/70 text-lg lg:text-xl font-medium leading-relaxed">
              Our AI-powered design tools are ready to help you create stunning
              interfaces in minutes, not hours.
            </p>

            {/* Abstract Decor Lines */}
            <div className="hidden lg:flex gap-1.5 opacity-30">
              <div className="w-1.5 h-1.5 rounded-full bg-[#030303]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#030303]" />
              <div className="w-12 h-1.5 rounded-full bg-[#030303]" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lg:px-12 flex flex-col z-10 overflow-hidden bg-[#030303] w-full border-white/5 border-t pt-12 px-6 pb-12 relative items-center">
        {/* Background Grid */}
        <div className="absolute inset-0 landing-grid-bg [mask-image:linear-gradient(to_bottom,transparent,black_20%)] pointer-events-none" />

        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 relative z-10">
          {/* Brand Column */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 bg-white/5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(var(--primary),0.15)]">
                <Layout className="h-5 w-5 text-primary" />
              </div>
              <span className="font-serif font-medium text-2xl tracking-tight text-white">
                unit {`{set}`}
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px] font-light">
              Engineering the future of design. AI-powered, developer-friendly,
              and infinitely scalable.
            </p>
            {/* Socials */}
            <div className="flex gap-5 mt-4">
              <a
                href="#"
                className="text-white/30 hover:text-white transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="m17.687 3.063l-4.996 5.711l-4.32-5.711H2.112l7.477 9.776l-7.086 8.099h3.034l5.469-6.25l4.78 6.25h6.102l-7.794-10.304l6.625-7.571zm-1.064 16.06L5.654 4.782h1.803l10.846 14.34z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-white/30 hover:text-white transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.001 2c-5.525 0-10 4.475-10 10a9.99 9.99 0 0 0 6.837 9.488c.5.087.688-.213.688-.476c0-.237-.013-1.024-.013-1.862c-2.512.463-3.162-.612-3.362-1.175c-.113-.288-.6-1.175-1.025-1.413c-.35-.187-.85-.65-.013-.662c.788-.013 1.35.725 1.538 1.025c.9 1.512 2.337 1.087 2.912.825c.088-.65.35-1.087.638-1.337c-2.225-.25-4.55-1.113-4.55-4.938c0-1.088.387-1.987 1.025-2.687c-.1-.25-.45-1.275.1-2.65c0 0 .837-.263 2.75 1.024a9.3 9.3 0 0 1 2.5-.337c.85 0 1.7.112 2.5.337c1.913-1.3 2.75-1.024 2.75-1.024c.55 1.375.2 2.4.1 2.65c.637.7 1.025 1.587 1.025 2.687c0 3.838-2.337 4.688-4.562 4.938c.362.312.675.912.675 1.85c0 1.337-.013 2.412-.013 2.75c0 .262.188.574.688.474A10.02 10.02 0 0 0 22 12c0-5.525-4.475-10-10-10" />
                </svg>
              </a>
              <a
                href="#"
                className="text-white/30 hover:text-white transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 flex flex-col gap-6 pt-2">
            <h4 className="text-white font-medium text-sm tracking-wide">
              Product
            </h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <a
                  href="#"
                  className="text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  Changelog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-2 text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  System Status
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6 pt-2">
            <h4 className="text-white font-medium text-sm tracking-wide">
              Company
            </h4>
            <ul className="flex flex-col gap-3.5">
              <li>
                <a
                  href="#"
                  className="text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  Press Kit
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white/40 hover:text-primary text-sm transition-colors font-light"
                >
                  Legal
                </a>
              </li>
            </ul>
          </div>

          {/* Large Action Buttons */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-row gap-4 mt-8 lg:mt-0">
            <a
              href="#"
              className="flex-1 group relative p-7 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-36 lg:h-40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start relative z-10">
                <span className="text-white font-medium text-sm tracking-wide">
                  Contact Sales
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <Wallet className="h-8 w-8 text-primary/60 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </a>

            <a
              href="#"
              className="flex-1 group relative p-7 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 flex flex-col justify-between h-36 lg:h-40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start relative z-10">
                <span className="text-white font-medium text-sm tracking-wide">
                  Help Center
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <Headphones className="h-8 w-8 text-primary/60 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="w-full max-w-7xl mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <span className="text-white/20 text-xs font-mono tracking-wide">
            © 2024 Unit Set Technologies. All rights reserved.
          </span>
          <div className="flex items-center gap-8">
            <span className="text-white/20 text-xs font-mono border-l border-white/10 pl-8">
              SOC2 Type II Compliant
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
