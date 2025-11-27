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
  hint: string;
  icon: string;
};

type ListBoyRenderable = Array<(container: HTMLElement) => void>;

type ListBoyGlobal = {
  RenderTo(data: unknown, targetId: string, mappers?: Record<string, unknown>): void;
};

type WindowWithListBoy = Window & { ListBoy: ListBoyGlobal };

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
  { label: "Sessions", href: "#sessions" },
  { label: "Artists", href: "#artists" },
  { label: "Journal", href: "#journal" },
  { label: "Listen", href: "#listen", external: false }
];

const contactOptions: readonly ContactOption[] = [
  {
    label: "Email",
    href: "mailto:studio@mixonmusic.com",
    hint: "studio@mixonmusic.com",
    icon: "✉"
  },
  {
    label: "Phone",
    href: "tel:+18015551212",
    hint: "+1 (801) 555-1212",
    icon: "☎"
  },
  {
    label: "Text",
    href: "sms:+18015551212",
    hint: "Reply in minutes",
    icon: "✆"
  },
  {
    label: "Instagram",
    href: "https://instagram.com/mixonmusic",
    hint: "@mixonmusic",
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

const getListBoy = (): ListBoyGlobal | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const candidate = window as Partial<WindowWithListBoy>;
  if (candidate.ListBoy) {
    return candidate.ListBoy;
  }

  return null;
};

const renderMenuFromDataset = <T>(
  targetId: string,
  dataset: readonly T[],
  builder: (entry: T) => HTMLElement
): void => {
  const listBoy = getListBoy();

  if (listBoy) {
    const payload: ListBoyRenderable = dataset.map((entry) => {
      return (container: HTMLElement): void => {
        const wrapper = document.createElement("div");
        wrapper.className = "menu-item";
        wrapper.appendChild(builder(entry));
        container.appendChild(wrapper);
      };
    });

    listBoy.RenderTo(payload, targetId);
    return;
  }

  const fallback = document.getElementById(targetId);
  if (!fallback) {
    return;
  }

  fallback.replaceChildren();
  dataset.forEach((entry) => {
    const wrapper = document.createElement("div");
    wrapper.className = "menu-item";
    wrapper.appendChild(builder(entry));
    fallback.appendChild(wrapper);
  });
};

const buildNavAnchor = (link: NavLink): HTMLElement => {
  const anchor = document.createElement("a");
  anchor.href = link.href;
  anchor.textContent = link.label;
  anchor.className = "menu-link";

  if (link.external) {
    anchor.target = "_blank";
    anchor.rel = "noreferrer noopener";
  }

  return anchor;
};

const buildContactAnchor = (option: ContactOption): HTMLElement => {
  const anchor = document.createElement("a");
  anchor.href = option.href;
  anchor.className = "menu-link";
  anchor.setAttribute("aria-label", `${option.label} – ${option.hint}`);

  if (option.href.startsWith("http")) {
    anchor.target = "_blank";
    anchor.rel = "noreferrer noopener";
  }

  const label = document.createElement("span");
  label.className = "label";

  const icon = document.createElement("span");
  icon.className = "icon-badge";
  icon.textContent = option.icon;
  label.appendChild(icon);

  const text = document.createElement("span");
  text.textContent = option.label;
  label.appendChild(text);

  const hint = document.createElement("span");
  hint.className = "contact-hint";
  hint.textContent = option.hint;

  anchor.appendChild(label);
  anchor.appendChild(hint);

  return anchor;
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

  renderMenuFromDataset("top-menu", navLinks, buildNavAnchor);
  renderMenuFromDataset("flyout-menu", contactOptions, buildContactAnchor);

  initFlyout("communications-flyout", "communications-toggle");
};

document.addEventListener("DOMContentLoaded", bootstrap);
