"use client";

import { useEffect, useRef } from "react";

/**
 * useAnimationFrame
 * Runs a callback on requestAnimationFrame, throttled to a target FPS (default 60).
 */
export function useAnimationFrame(callback, enabled = true, fps = 60) {
	const requestRef = useRef(null);
	const lastTimeRef = useRef(0);
	const callbackRef = useRef(callback);

	// Keep latest callback without re-subscribing the RAF loop
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const targetFps = typeof fps === "number" && fps > 0 ? fps : 60;
		const frameIntervalMs = 1000 / targetFps;

		const loop = (now) => {
			if (!lastTimeRef.current) {
				lastTimeRef.current = now;
			}
			const delta = now - lastTimeRef.current;

			if (delta >= frameIntervalMs) {
				// Avoid drift by carrying over the remainder
				lastTimeRef.current = now - (delta % frameIntervalMs);
				try {
					if (callbackRef.current) {
						callbackRef.current(now, delta);
					}
				} catch (err) {
					// Surface errors but keep loop alive
					console.error("[useAnimationFrame] callback error:", err);
				}
			}

			requestRef.current = requestAnimationFrame(loop);
		};

		requestRef.current = requestAnimationFrame(loop);

		return () => {
			if (requestRef.current) {
				cancelAnimationFrame(requestRef.current);
			}
			requestRef.current = null;
			lastTimeRef.current = 0;
		};
	}, [enabled, fps]);
}


