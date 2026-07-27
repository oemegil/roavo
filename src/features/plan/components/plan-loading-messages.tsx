"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Roavo senin için en uygun planı hazırlıyor…",
  "Seçimlerine göre en güzel rotaları örüyoruz…",
  "Bu geziye özel tempo ve dengeleri ayarlıyoruz…",
  "Şehirlerin ruhunu plana taşıyoruz…",
  "O tarihlerde festivaller ve etkinlikler var mı bakıyoruz…",
  "Sana özel bir rota çıkarmak üzereyiz…",
  "Neredeyse hazır — güzel planlar biraz sabır ister.",
  "Birazdan elinde net, ilham verici bir program olacak.",
];

export function PlanLoadingMessages({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      setVisible(true);
      return;
    }
    const timer = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 5200);
    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="border-border bg-muted/40 overflow-hidden rounded-2xl border px-5 py-6 text-center">
      <p
        className="text-base font-medium transition-all duration-500"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {MESSAGES[index]}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        Bu işlem bir-iki dakika sürebilir.
      </p>
    </div>
  );
}
