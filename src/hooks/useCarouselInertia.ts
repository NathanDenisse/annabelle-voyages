"use client";

import { useEffect } from "react";
import type { EmblaCarouselType } from "embla-carousel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutoScrollPlugin = any;

const DECAY = 0.97; // velocity multiplier per frame (~2s deceleration at 60fps)

/**
 * Inertia physics for the auto-scroll carousel on mobile.
 *
 * After a forward swipe, captures the scroll body velocity and decelerates it
 * exponentially until it reaches base speed, then hands off to the auto-scroll plugin.
 * After a slow or backward swipe, waits for Embla to settle naturally then resumes.
 * The carousel never fully stops.
 *
 * Requires AutoScroll({ stopOnInteraction: true }) so the plugin doesn't compete
 * on pointerUp.
 */
export function useCarouselInertia(
  emblaApi: EmblaCarouselType | undefined,
  autoScrollPlugin: AutoScrollPlugin,
  baseSpeed: number
) {
  useEffect(() => {
    if (!emblaApi) return;

    const onPointerUp = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const engine = emblaApi.internalEngine() as any;
      const vel0: number = engine.scrollBody.velocity();

      if (vel0 < -baseSpeed) {
        // Fast forward swipe — run inertia then hand to auto-scroll
        runInertia(emblaApi, engine, autoScrollPlugin, baseSpeed, vel0);
      } else {
        // Slow, opposite-direction, or no-op swipe — settle naturally then resume
        const onSettle = () => {
          emblaApi.off("settle", onSettle);
          autoScrollPlugin.play(0);
        };
        emblaApi.on("settle", onSettle);
      }
    };

    emblaApi.on("pointerUp", onPointerUp);
    return () => {
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, autoScrollPlugin, baseSpeed]);
}

function runInertia(
  emblaApi: EmblaCarouselType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: any,
  autoScrollPlugin: AutoScrollPlugin,
  baseSpeed: number,
  initialVel: number
) {
  let vel = initialVel; // negative = forward scroll
  let active = true;

  const inertiaBehaviour = {
    direction: () => -1 as -1 | 0 | 1,
    duration: () => -1,
    velocity: () => vel,
    settled: () => false, // keep animation loop alive

    seek() {
      if (!active) return this;

      vel *= DECAY;

      if (vel > -baseSpeed) {
        // Velocity has decayed to base speed — hand off
        active = false;
        autoScrollPlugin.play(0);
        return this;
      }

      // Mirror what the auto-scroll seek() does when moving the carousel
      engine.previousLocation.set(engine.location);
      engine.location.add(vel);
      engine.target.set(engine.location);

      // Keep slide index in sync so 'select' events fire correctly
      const nextIndex = engine.scrollTarget.byDistance(0, false).index;
      if (engine.index.get() !== nextIndex) {
        engine.indexPrevious.set(engine.index.get());
        engine.index.set(nextIndex);
        emblaApi.emit("select");
      }

      return this;
    },

    useBaseFriction() { return this; },
    useBaseDuration() { return this; },
    useFriction() { return this; },
    useDuration() { return this; },
  };

  engine.scrollBody = inertiaBehaviour;
  engine.animation.start();
}
