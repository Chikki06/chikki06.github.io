import { useCallback, useEffect, useRef, useState } from "react";

const PRE_IGNITION_SPARK_DURATION_MS = 700;

/**
 * Shared Easter Egg trigger logic for the fireplace / fire easter egg.
 *
 * Behaviour:
 * - Toggle isArmed to enable a full-screen overlay that captures document clicks.
 * - Clicks 1 & 2: record (x,y) and show temporary pre-ignition sparks that fade out.
 * - Click 3: record final (x,y), stop click tracking, and expose ignitionPoint for the main effect.
 */
export function useEasterEggTrigger() {
  const [isArmed, setArmed] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [ignitionPoint, setIgnitionPoint] = useState(null);
  const [hasIgnited, setHasIgnited] = useState(false);
  const [preIgnitionSparks, setPreIgnitionSparks] = useState([]);

  const sparkIdRef = useRef(0);
  const removeSparkTimeoutsRef = useRef([]);

  const reset = useCallback(() => {
    setClickCount(0);
    setIgnitionPoint(null);
    setHasIgnited(false);
    setPreIgnitionSparks([]);
    removeSparkTimeoutsRef.current.forEach(clearTimeout);
    removeSparkTimeoutsRef.current = [];
  }, []);

  const toggleArmed = useCallback(() => {
    setArmed((prev) => {
      const next = !prev;
      // Any time we toggle, reset state so a fresh sequence can start.
      reset();
      return next;
    });
  }, [reset]);

  const handleCaptureClick = useCallback(
    (eventOrPoint) => {
      if (!isArmed || hasIgnited) return;

      const clientX =
        typeof eventOrPoint === "object" && "clientX" in eventOrPoint
          ? eventOrPoint.clientX
          : eventOrPoint.x;
      const clientY =
        typeof eventOrPoint === "object" && "clientY" in eventOrPoint
          ? eventOrPoint.clientY
          : eventOrPoint.y;

      setClickCount((prev) => {
        // First two clicks: show pre-ignition sparks.
        if (prev < 2) {
          const id = ++sparkIdRef.current;
          setPreIgnitionSparks((s) => [...s, { x: clientX, y: clientY, id }]);
          const t = setTimeout(() => {
            setPreIgnitionSparks((s) => s.filter((spark) => spark.id !== id));
            removeSparkTimeoutsRef.current =
              removeSparkTimeoutsRef.current.filter((x) => x !== t);
          }, PRE_IGNITION_SPARK_DURATION_MS);
          removeSparkTimeoutsRef.current.push(t);
          return prev + 1;
        }

        // Third click: lock in ignition point and mark ignited.
        if (prev === 2) {
          setIgnitionPoint({ x: clientX, y: clientY });
          setHasIgnited(true);
          return 3;
        }

        return prev;
      });
    },
    [isArmed, hasIgnited],
  );

  // Clean up any pending spark timeouts on unmount.
  useEffect(() => {
    return () => {
      removeSparkTimeoutsRef.current.forEach(clearTimeout);
      removeSparkTimeoutsRef.current = [];
    };
  }, []);

  const isCapturing = isArmed && !hasIgnited;

  return {
    isArmed,
    setArmed,
    toggleArmed,
    clickCount,
    ignitionPoint,
    hasIgnited,
    preIgnitionSparks,
    isCapturing,
    handleCaptureClick,
  };
}

