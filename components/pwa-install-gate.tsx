"use client";

/* eslint-disable @next/next/no-img-element */

export function PwaInstallGate() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-[18px] py-8">
      <div className="w-full max-w-[998px] overflow-hidden rounded-3xl border border-brand-border bg-white shadow-lg">
        <div className="flex min-h-[420px] flex-col md:flex-row">
          <div className="order-2 flex flex-1 flex-col justify-center space-y-4 px-6 py-6 md:order-1 md:px-10 md:py-10">
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold leading-tight text-brand-text md:text-3xl">
                Добавьте иконку на экран
              </h1>
              <p className="text-sm leading-relaxed text-brand-text-muted md:text-base">
                KeysBank Admin будет всегда под рукой
              </p>
            </div>
            <ol className="space-y-3 text-sm leading-relaxed text-brand-text md:text-base">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-xs font-semibold text-brand-gold md:size-7 md:text-sm">
                  1
                </span>
                <span>Нажмите Поделиться в нижней части экрана</span>
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-xs font-semibold text-brand-gold md:size-7 md:text-sm">
                  2
                </span>
                <span>Выберите На экран «Домой»</span>
              </li>
            </ol>
          </div>
          <div className="order-1 flex aspect-[4/3] w-full items-end justify-center bg-[#0b0b0f] px-4 pb-0 pt-6 md:order-2 md:aspect-auto md:min-h-[420px] md:w-1/2 md:px-6 md:pt-8">
            <img
              src="/keys-bank-pwa.png"
              alt="Как добавить KeysBank на экран «Домой»"
              width={420}
              height={520}
              className="h-auto max-h-[88%] w-auto max-w-full object-contain object-bottom"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
