export function Footer() {
  return (
    <footer className="border-t bg-background py-16">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col items-center text-center">
        {/* Brand mark: logo + name on same baseline, centered on its own line */}
        <div className="flex items-center gap-3">
          <svg
            className="size-8 text-primary fill-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span className="font-heading text-xl font-semibold tracking-tighter">
            Brand
          </span>
        </div>

        {/* Tagline paragraph directly below brand mark, moderate reading width */}
        <p className="mt-4 max-w-[60ch] text-sm text-muted-foreground">
          A clean, centered footer with brand mark, tagline, navigation links,
          and copyright line.
        </p>

        {/* Horizontal navigation row, centered as a group directly below tagline */}
        <nav className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Home
          </a>
          <a
            href="/articles"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Articles
          </a>
          <a
            href="/quiz"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Quiz
          </a>
          <a
            href="/calculator"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Calculator
          </a>
          <a
            href="/directory"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Directory
          </a>
          <a
            href="/chat"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Chat
          </a>
          <a
            href="/badges"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Badges
          </a>
          <a
            href="/gallery"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Gallery
          </a>
        </nav>

        {/* Copyright line on its own line at the bottom, comfortable vertical space above it */}
        <p className="mt-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Brand. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
