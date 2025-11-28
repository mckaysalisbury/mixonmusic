type ImageSource = {
  file: string;
  alt: string;
  focalPoint?: string;
};

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

type ContactOption = {
  label: string;
  href: string;
  icon: string;
};

declare const ListBoy: {
  RenderTo(data: unknown, targetId: string): void;
};

const heroImages: readonly ImageSource[] = [
  {
    file: "images/2015Mar-6205.webp",
    alt: "Close-up of the Mixon Music production suite"
  },
  {
    file: "images/workshop-135.webp",
    alt: "Warm tungsten-lit rehearsal at Mixon Music"
  }
];

const navLinks: readonly NavLink[] = [
  { label: "Home", href: "index.html" },
  { label: "🎼 Music Lessons", href: "#music-lessons" },
  { label: "Schedule a FREE lesson", href: "#free-lesson" },
//   { label: "Listen", href: "#listen", external: false }
];

const contactOptions: readonly ContactOption[] = [
  {
    label: "Email Us",
    href: "mailto:studio@mixonmusic.com",
    icon: "✉"
  },
  {
    label: "Call Us",
    href: "tel:+18015551212",
    icon: "📞"
  },
  {
    label: "Text Us",
    href: "sms:+18015551212",
    icon: "💬"
  },
//   {
//     label: "Request info",
//     href: "google forms?",
//     icon: "❓"
//   },
  {
    label: "Instagram",
    href: "https://instagram.com/mixonmusicla",
    icon: "★"
  }
];

class Slideshow {
  private activeLayer: HTMLDivElement;
  private bufferLayer: HTMLDivElement;
  private timerId: number | null = null;
  private index = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly sources: readonly ImageSource[],
    private readonly intervalMs = 7000,
    private readonly dissolveMs = 1300
  ) {
    if (sources.length === 0) {
      throw new Error("Add at least one hero image");
    }

    this.container.innerHTML = "";
    this.activeLayer = this.createLayer("active");
    this.bufferLayer = this.createLayer();
    this.paintLayer(this.activeLayer, sources[0]);

    if (sources.length > 1) {
      this.paintLayer(this.bufferLayer, sources[1]);
    }
  }

  start(): void {
    if (this.sources.length < 2) {
      return;
    }

    this.stop();
    this.timerId = window.setInterval(() => this.advance(), this.intervalMs);
  }

  stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private advance(): void {
    this.index = (this.index + 1) % this.sources.length;
    const nextSource = this.sources[this.index];
    this.swapLayers(nextSource);
  }

  private swapLayers(nextSource: ImageSource): void {
    this.paintLayer(this.bufferLayer, nextSource);
    this.bufferLayer.classList.add("active");
    this.activeLayer.classList.remove("active");

    const outgoing = this.activeLayer;
    this.activeLayer = this.bufferLayer;
    this.bufferLayer = outgoing;

    window.setTimeout(() => {
      this.bufferLayer.classList.remove("active");
    }, this.dissolveMs);
  }

  private createLayer(initialClass?: string): HTMLDivElement {
    const layer = document.createElement("div");
    layer.className = ["slide-layer", initialClass].filter(Boolean).join(" ").trim();
    this.container.appendChild(layer);
    return layer;
  }

  private paintLayer(layer: HTMLDivElement, source: ImageSource): void {
    layer.style.backgroundImage = `url(${source.file})`;
    layer.style.backgroundPosition = source.focalPoint ?? "center";
    layer.setAttribute("aria-label", source.alt);
  }
}

const navMenuMarkup = (link: NavLink): string => {
  const externalAttrs = link.external ? ' target="_blank" rel="noreferrer noopener"' : "";
  return `<a class="menu-link" href="${link.href}"${externalAttrs}>${link.label}</a>`;
};

const contactMenuMarkup = (option: ContactOption): string => {
  const externalAttrs = option.href.startsWith("http") ? ' target="_blank" rel="noreferrer noopener"' : "";
  return `<a class="menu-link" href="${option.href}"${externalAttrs}>${option.label}&nbsp;${option.icon}</a>`;
};

const initFlyout = (flyoutId: string, toggleId: string): void => {
  const flyout = document.getElementById(flyoutId);
  const toggle = document.getElementById(toggleId) as HTMLButtonElement | null;

  if (!flyout || !toggle) {
    return;
  }

  const closeFlyout = (): void => {
    flyout.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = flyout.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!flyout.contains(event.target as Node)) {
      closeFlyout();
    }
  });
};

const bootstrap = (): void => {
  const slideshowElement = document.getElementById("slideshow");
  if (!slideshowElement) {
    throw new Error("Missing slideshow container");
  }

  const slideshow = new Slideshow(slideshowElement, heroImages);
  slideshow.start();

  const navMenuData = navLinks.map(navMenuMarkup);
  const contactMenuData = contactOptions.map(contactMenuMarkup);

  ListBoy.RenderTo(navMenuData, "top-menu");
  ListBoy.RenderTo(contactMenuData, "flyout-menu");

  initFlyout("communications-flyout", "communications-toggle");
};

document.addEventListener("DOMContentLoaded", bootstrap);
