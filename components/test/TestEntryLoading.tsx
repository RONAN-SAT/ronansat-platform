"use client";

import { useEffect, useRef, useState } from "react";

type Quote = {
  author: string;
  text: string;
};

const QUOTES: Quote[] = [
  { author: "Albert Einstein", text: "I have no special talent. I am only passionately curious." },
  { author: "Thomas Edison", text: "Genius is 1% inspiration and 99% perspiration." },
  { author: "Elon Musk", text: "Work like hell. I mean you just have to put in 80 to 100 hour weeks." },
  {
    author: "Bill Gates",
    text: "It's fine to celebrate success, but it is more important to heed the lessons of failure.",
  },
  { author: "Kobe Bryant", text: "Great things come from hard work and perseverance." },
  {
    author: "Michael Jordan",
    text: "I can accept failure, everyone fails at something. But I can't accept not trying.",
  },
  {
    author: "Will Smith",
    text: "The only thing that I see that is distinctly different about me is I'm not afraid to die on a treadmill.",
  },
  { author: "Dwayne Johnson (The Rock)", text: "Success isn't always about greatness. It's about consistency." },
  { author: "Jack Ma", text: "Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine." },
  { author: "Andrew Tate", text: "Discipline is the key to success." },
  {
    author: "Naval Ravikant",
    text: "Learn to sell. Learn to build. If you can do both, you will be unstoppable.",
  },
  { author: "Cal Newport", text: "Clarity about what matters provides clarity about what does not." },
  {
    author: "James Clear",
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
  },
  { author: "Tim Cook", text: "The side effect of hard work is success." },
  {
    author: "Arnold Schwarzenegger",
    text: "You can't climb the ladder of success with your hands in your pockets.",
  },
  { author: "Gary Vaynerchuk", text: "There is no substitute for hard work." },
  {
    author: "Mark Cuban",
    text: "Work like there is someone working 24 hours a day to take it all away from you.",
  },
  { author: "Confucius (Khong Tu)", text: "It does not matter how slowly you go as long as you do not stop." },
  { author: "Malcolm Gladwell", text: "It takes 10,000 hours to achieve mastery." },
  {
    author: "Steve Jobs",
    text: "I'm convinced that about half of what separates the successful entrepreneurs from the non-successful ones is pure perseverance.",
  },
];

const QUOTE_CHANGE_INTERVAL_MS = 3200;
const QUOTE_FADE_DURATION_MS = 420;

function getRandomQuoteIndex(excludeIndex?: number) {
  if (QUOTES.length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * QUOTES.length);

  while (nextIndex === excludeIndex) {
    nextIndex = Math.floor(Math.random() * QUOTES.length);
  }

  return nextIndex;
}

export default function TestEntryLoading() {
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [rippleOrigin, setRippleOrigin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const initializeQuoteTimeoutId = window.setTimeout(() => {
      setQuoteIndex(getRandomQuoteIndex());
      setIsVisible(true);
    }, 0);

    return () => {
      window.clearTimeout(initializeQuoteTimeoutId);
    };
  }, []);

  useEffect(() => {
    if (quoteIndex === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIsVisible(false);

      timeoutRef.current = window.setTimeout(() => {
        setQuoteIndex((currentIndex) => getRandomQuoteIndex(currentIndex ?? undefined));
        setIsVisible(true);
      }, QUOTE_FADE_DURATION_MS);
    }, QUOTE_CHANGE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [quoteIndex]);

  useEffect(() => {
    const updateRippleOrigin = () => {
      if (!anchorRef.current) {
        return;
      }

      const rect = anchorRef.current.getBoundingClientRect();
      setRippleOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    };

    updateRippleOrigin();

    const resizeObserver = new ResizeObserver(() => {
      updateRippleOrigin();
    });

    if (anchorRef.current) {
      resizeObserver.observe(anchorRef.current);
    }

    window.addEventListener("resize", updateRippleOrigin);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateRippleOrigin);
    };
  }, []);

  const activeQuote = quoteIndex === null ? null : QUOTES[quoteIndex];

  return (
    <div className="test-entry-loader relative flex min-h-screen items-center justify-center overflow-hidden bg-[#D0CECA] px-6 py-12">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={
          {
            "--ripple-origin-x": rippleOrigin ? `${rippleOrigin.x}px` : "50%",
            "--ripple-origin-y": rippleOrigin ? `${rippleOrigin.y}px` : "50%",
          } as React.CSSProperties
        }
      >
        {rippleOrigin ? (
          <>
            <span className="loading-ripple loading-ripple-delay-0" />
            <span className="loading-ripple loading-ripple-delay-1" />
            <span className="loading-ripple loading-ripple-delay-2" />
          </>
        ) : null}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl justify-center">
        <div ref={anchorRef} className="quote-ripple-anchor relative inline-flex w-full max-w-[44rem] justify-center">
          <div className={`relative z-10 w-full text-center ${isVisible ? "quote-fade-enter" : "quote-fade-exit"}`}>
            <blockquote className="quote-text mx-auto max-w-[40rem] text-balance text-[1.6rem] font-normal leading-[1.55] tracking-[-0.03em] text-[#222] sm:text-[2.15rem]">
              {activeQuote ? <>&ldquo;{activeQuote.text}&rdquo;</> : <span className="invisible">Loading quote</span>}
            </blockquote>
            <p className="mt-5 text-right text-[0.95rem] font-medium tracking-[0.02em] text-[#5f5b57] sm:text-[1.02rem]">
              {activeQuote ? activeQuote.author : <span className="invisible">Author</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
