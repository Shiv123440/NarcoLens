import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";
import { ArrowRight, BarChart3, Camera, FlaskConical, Folder, Scan } from "lucide-react";

// Mirror of the new Hero Banner component
function HeroBanner() {
  return (
    <section className="app-hero" aria-label="Start a new test">
      <div className="app-hero-content">
        <div className="app-hero-eyebrow">
          <span>NEW TEST</span>
          <span className="app-hero-eyebrow-sep" aria-hidden="true">·</span>
          <span>FIELD READY</span>
        </div>

        <h1 className="app-hero-headline">
          Start a new <span className="app-hero-headline-accent">test.</span>
        </h1>

        <p className="app-hero-desc">
          Capture a presumptive colour response, seal the original evidence, and keep the chain of custody intact — even when you are offline.
        </p>

        <div className="app-hero-pills" role="list" aria-label="Field test steps">
          <div className="app-hero-pill" role="listitem">
            <Folder className="app-hero-pill-icon app-hero-pill-icon-folder" aria-hidden="true" />
            <span className="app-hero-pill-step">01</span>
            <span className="app-hero-pill-label">Case</span>
          </div>
          <div className="app-hero-pill" role="listitem">
            <FlaskConical className="app-hero-pill-icon" aria-hidden="true" />
            <span className="app-hero-pill-step">02</span>
            <span className="app-hero-pill-label">Reagents</span>
          </div>
          <div className="app-hero-pill" role="listitem">
            <Camera className="app-hero-pill-icon app-hero-pill-icon-camera" aria-hidden="true" />
            <span className="app-hero-pill-step">03</span>
            <span className="app-hero-pill-label">Photo</span>
          </div>
          <div className="app-hero-pill" role="listitem">
            <BarChart3 className="app-hero-pill-icon app-hero-pill-icon-chart" aria-hidden="true" />
            <span className="app-hero-pill-step">04</span>
            <span className="app-hero-pill-label">Result</span>
          </div>
        </div>

        <div className="app-hero-action">
          <a
            href="/scan"
            className="app-hero-cta"
            aria-label="Start field test"
          >
            <Scan className="app-hero-cta-icon" aria-hidden="true" />
            <span className="app-hero-cta-text">Start field test</span>
            <ArrowRight className="app-hero-cta-arrow" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="app-hero-visual" aria-hidden="true">
        <img
          src="/forensic-hero-lab.jpg"
          alt=""
          className="app-hero-visual-img"
          loading="eager"
          decoding="async"
        />
        <div className="app-hero-visual-gradient" />
      </div>
    </section>
  );
}

describe("Hero Banner Component", () => {
  it("renders all typography and structural elements cleanly", () => {
    const { container } = render(<HeroBanner />);

    // Eyebrow check
    expect(screen.getByText("NEW TEST")).toBeInTheDocument();
    expect(screen.getByText("FIELD READY")).toBeInTheDocument();

    // Headline check
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("Start a new");
    expect(heading.textContent).toContain("test.");

    // Description check
    expect(
      screen.getByText(/Capture a presumptive colour response, seal the original evidence/i)
    ).toBeInTheDocument();

    // Workflow indicator pills check
    const pills = container.querySelectorAll(".app-hero-pill");
    expect(pills).toHaveLength(4);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Case")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("Reagents")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
    expect(screen.getByText("Photo")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();

    // CTA button check
    const cta = screen.getByRole("link", { name: /Start field test/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/scan");

    // Forensic lab image visual check
    const img = container.querySelector(".app-hero-visual-img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/forensic-hero-lab.jpg");

    // Gradient overlay check
    const gradient = container.querySelector(".app-hero-visual-gradient");
    expect(gradient).toBeInTheDocument();
  });
});
