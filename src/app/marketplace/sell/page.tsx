"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useWallet } from "@/context/wallet-context";

export default function SellArtworkPage() {
  const { wallet, openPicker } = useWallet();
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [published, setPublished] = useState(false);

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 1_500_000) {
      setError("Artwork must be smaller than 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result ?? ""));
    reader.onerror = () => setError("Unable to read that image.");
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!wallet) {
      openPicker();
      return;
    }
    if (!imageDataUrl) {
      setError("Upload your artwork before publishing.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/marketplace/artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.get("title"), artistName: form.get("artistName"),
          description: form.get("description"), priceAsset: form.get("priceAsset"),
          priceAmount: form.get("priceAmount"), imageDataUrl,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to publish artwork.");
      setPublished(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to publish artwork.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#171717] px-4 pb-28 pt-28 text-white lg:pt-36">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6ea8ff]">Artist Marketplace</p>
          <h1 className="mt-3 text-4xl font-bold lg:text-6xl">Sell Your Artwork</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/55">Publish a one-of-one collector artwork and list it directly in the marketplace.</p>
        </div>
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-[#1A56DB] to-transparent" />

        {published ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-[#1A56DB]/50 bg-gradient-to-b from-[#0e1e4a] to-[#090f28] p-10 text-center">
            <h2 className="text-2xl font-bold">Artwork published</h2>
            <p className="mt-3 text-white/60">Your one-of-one artwork is now available in the marketplace.</p>
            <Link href="/marketplace" className="mt-6 inline-block rounded-xl bg-[#1A56DB] px-6 py-3 font-bold">View Marketplace</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-6 rounded-2xl border border-[#1F2540] bg-gradient-to-b from-[#151932] to-[#090f28] p-5 shadow-2xl lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
            <label className="relative flex min-h-80 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#3B82F6]/50 bg-[#0F1329]">
              {imageDataUrl ? <Image src={imageDataUrl} alt="Artwork preview" fill unoptimized className="object-contain p-3" /> : <span className="px-8 text-center text-sm text-white/45">Upload PNG, JPEG, or WebP<br /><span className="text-xs">Maximum 1.5 MB</span></span>}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectImage} className="sr-only" />
            </label>
            <div className="space-y-4">
              <Field label="Artwork title"><input name="title" required maxLength={80} placeholder="Name your artwork" className="input" /></Field>
              <Field label="Artist name"><input name="artistName" required maxLength={60} placeholder="Your creator name" className="input" /></Field>
              <Field label="Description"><textarea name="description" maxLength={500} rows={4} placeholder="Tell collectors about this piece" className="input resize-none" /></Field>
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <Field label="Asset"><select name="priceAsset" className="input"><option>XLM</option><option>USDC</option></select></Field>
                <Field label="Price"><input name="priceAmount" required inputMode="decimal" placeholder="0.00" className="input" /></Field>
              </div>
              <p className="text-xs text-white/40">Artwork listings are collector-only and issued as a single unique copy.</p>
              {error ? <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
              <button disabled={isSubmitting} className="w-full rounded-xl bg-[#1A56DB] py-3 font-bold transition hover:bg-[#2a67ee] disabled:opacity-60">{!wallet ? "Connect Freighter to Publish" : isSubmitting ? "Publishing..." : "Publish Artwork"}</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-white/60">{label}</span>{children}</label>;
}
