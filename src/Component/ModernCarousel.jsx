import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useSwipeable } from "react-swipeable";
import need from "../spc.jpg";

const C = {
  crimson: "#c0392b",
  crimsonD: "#96281b",
  cream: "#faf3e4",
  parchment: "#f5e9c9",
  border: "#e8dcc8",
};

const ModernCarousel = ({ media, onImageClick, isCard = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(null);

  const mediaItems = useMemo(() => {
    const items = media && typeof media === "string"
      ? JSON.parse(media)
      : Array.isArray(media) ? media : [];
    return items.sort((a, b) => {
      const rank = (s) => {
        s = (s || "").toLowerCase();
        if (s.includes('/video/') || s.endsWith('.mp4') || s.endsWith('.webm')) return 2;
        if (s.endsWith('.gif')) return 1;
        return 0;
      };
      return rank(a) - rank(b);
    });
  }, [media]);

  const isVideo = (item) =>
    typeof item === "string" && (
      item.includes('/video/') || item.toLowerCase().endsWith('.mp4') ||
      item.toLowerCase().endsWith('.webm') || item.toLowerCase().endsWith('.ogg') ||
      item.startsWith("data:video/")
    );

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex(p => p === mediaItems.length - 1 ? 0 : p + 1),
    onSwipedRight: () => setCurrentIndex(p => p === 0 ? mediaItems.length - 1 : p - 1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    trackTouch: true,
  });

  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = e => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.touches[0].clientX;
    if (Math.abs(diff) > 50) {
      setCurrentIndex(p => diff > 0
        ? (p === mediaItems.length - 1 ? 0 : p + 1)
        : (p === 0 ? mediaItems.length - 1 : p - 1));
      touchStartX.current = null;
    }
  };
  const handleTouchEnd = () => { touchStartX.current = null; };

  if (!mediaItems.length) {
    return (
      <div style={{
        width: "100%", height: 192,
        background: C.cream, border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        <img src={need} alt="Placeholder" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  return (
    <div
      {...handlers}
      style={{
        position: "relative", width: "100%", height: 192,
        overflow: "hidden", cursor: "pointer",
        background: C.cream,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => onImageClick && onImageClick(media)}
      className="group"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35 }}
          style={{ position: "absolute", inset: 0 }}
        >
          {isVideo(mediaItems[currentIndex]) ? (
            <video
              src={mediaItems[currentIndex]}
              {...(isCard ? { autoPlay: true, muted: true, loop: true } : { controls: true })}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={mediaItems[currentIndex] || need}
              alt="Product"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => e.target.src = need}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {mediaItems.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setCurrentIndex(p => p === 0 ? mediaItems.length - 1 : p - 1); }}
            style={{
              position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
              width: 30, height: 30, background: "#fff", border: `1.5px solid ${C.border}`,
              borderRadius: "4px", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: `2px 2px 0 ${C.crimsonD}22`,
            }}
          >
            <FaArrowLeft style={{ color: C.crimson, fontSize: 11 }} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setCurrentIndex(p => p === mediaItems.length - 1 ? 0 : p + 1); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 30, height: 30, background: "#fff", border: `1.5px solid ${C.border}`,
              borderRadius: "4px", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              boxShadow: `2px 2px 0 ${C.crimsonD}22`,
            }}
          >
            <FaArrowRight style={{ color: C.crimson, fontSize: 11 }} />
          </button>
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5,
          }}>
            {mediaItems.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setCurrentIndex(i); }}
                style={{
                  width: i === currentIndex ? 16 : 6, height: 6,
                  borderRadius: "3px", border: "none", cursor: "pointer",
                  background: i === currentIndex ? C.crimson : "rgba(255,255,255,0.6)",
                  transition: "all 0.3s",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModernCarousel;