'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Banner = {
  id: string
  image_url: string
  link_url: string | null
  order_index: number
}

export function HeroBanner({ banners }: { banners: Banner[] }) {
  const count = banners.length
  const [current, setCurrent] = useState(0)

  const prev = useCallback(() => setCurrent(c => (c - 1 + count) % count), [count])
  const next = useCallback(() => setCurrent(c => (c + 1) % count), [count])

  return (
    <section
      className="relative overflow-hidden border-b border-gray-100 min-h-[340px] sm:min-h-[520px]"
    >

      {/* ══ 슬라이드 배경 트랙 ══════════════════════════════ */}
      {count > 0 && (
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-in-out"
          style={{
            width: `${count * 100}%`,
            transform: `translateX(-${(current * 100) / count}%)`,
          }}
        >
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className="relative h-full flex-shrink-0"
              style={{ width: `${100 / count}%` }}
            >
              {/* 이미지 */}
              <Image
                src={banner.image_url}
                alt={`배너 ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
              />

              {/* 링크 URL이 있는 배너는 클릭 가능 */}
              {banner.link_url && (
                <a
                  href={banner.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-10"
                  aria-label="배너 링크"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 배너가 하나도 없을 때 기본 배경 */}
      {count === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEF4E4] to-[#D4EAC0]" />
      )}

      {/* ══ 텍스트 오버레이 (항상 고정) ════════════════════ */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-10 lg:px-16">
        <div
          className="flex flex-col justify-center py-12 sm:py-20 min-h-[340px] sm:min-h-[520px]"
          style={{ maxWidth: '540px' }}
        >
          {/* 메인 타이틀 */}
          <h1
            className="font-black leading-[0.88] tracking-tight text-charcoal uppercase"
            style={{ fontSize: 'clamp(36px, 10vw, 92px)' }}
          >
            PLANTS<br />
            MAKE<br />
            <span className="relative inline-block">
              LIFE FUN!
              <svg
                className="absolute left-0 w-full overflow-visible pointer-events-none"
                style={{ bottom: '-5px' }}
                height="16" viewBox="0 0 300 16"
                preserveAspectRatio="none" aria-hidden="true"
              >
                <path
                  d="M2 12 C 60 4, 120 16, 180 9 C 228 3, 272 15, 298 8"
                  fill="none" stroke="#D4F034" strokeWidth="10"
                  strokeLinecap="round" opacity="0.88"
                />
                <path
                  d="M295 8 C 302 5, 308 11, 306 14"
                  fill="none" stroke="#D4F034" strokeWidth="5"
                  strokeLinecap="round" opacity="0.5"
                />
              </svg>
            </span>
          </h1>

          {/* 부제 */}
          <div className="mt-9 space-y-2">
            <p className="font-serif text-[15px] text-charcoal">
              식물을 콘텐츠처럼, 취향을 큐레이션하다.
            </p>
            <p className="text-[11px] tracking-[0.22em] text-gray-400 uppercase">
              Plant curation, like your favorite OTT.
            </p>
          </div>

          {/* 버튼 */}
          <div className="mt-10 flex items-center gap-3 flex-wrap">
            <Link
              href="/plants"
              className="inline-flex items-center gap-2.5 bg-charcoal text-white
                         text-sm font-semibold tracking-wide px-7 py-3.5
                         hover:bg-charcoal-soft transition-colors"
            >
              식물 둘러보기
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7h10M8 3l4 4-4 4"/>
              </svg>
            </Link>
            <Link
              href="/plants"
              className="inline-flex items-center gap-2 border border-charcoal/25
                         text-sm text-charcoal px-5 py-3.5
                         hover:border-charcoal transition-colors bg-white/50 backdrop-blur-sm"
            >
              가이드 보기
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="5.5"/>
                <path d="M6.5 5.5v4M6.5 4h.01"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>


      {/* ══ 슬라이드 컨트롤 (배너 2개 이상일 때만 표시) ══ */}
      {count > 1 && (
        <div className="absolute bottom-6 right-6 sm:right-8 z-30 flex items-center gap-4">

          {/* 점(●○○) 표시 */}
          <div className="flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`슬라이드 ${i + 1}`}
                className="flex items-center justify-center"
              >
                <div
                  className={`rounded-full transition-all duration-300 bg-white ${
                    i === current ? 'w-5 h-2 opacity-100' : 'w-2 h-2 opacity-40'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* ← → 화살표 버튼 */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={prev}
              className="w-9 h-9 border border-white/30 bg-black/20 backdrop-blur-sm
                         flex items-center justify-center text-white
                         hover:bg-black/40 transition-colors"
              aria-label="이전 슬라이드"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2L4 6.5 8 11"/>
              </svg>
            </button>
            <button
              onClick={next}
              className="w-9 h-9 border border-white/30 bg-black/20 backdrop-blur-sm
                         flex items-center justify-center text-white
                         hover:bg-black/40 transition-colors"
              aria-label="다음 슬라이드"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2l4 4.5-4 4.5"/>
              </svg>
            </button>
          </div>
        </div>
      )}

    </section>
  )
}
