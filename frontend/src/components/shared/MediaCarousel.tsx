import { useMemo, useState, type UIEvent } from "react";
import type { PostMedia } from "../../types";
import "./MediaCarousel.css";

type MediaCarouselProps = {
  media: PostMedia[];
};

const MediaCarousel = ({ media }: MediaCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = media.length > 1;

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMultiple) return;

    const { scrollLeft, clientWidth } = event.currentTarget;
    const nextIndex = Math.round(scrollLeft / clientWidth);
    setActiveIndex(nextIndex);
  };

  const slides = useMemo(
    () =>
      media.map((item) => (
        <div className="media-carousel__slide" key={item.id}>
          {item.mediaType === "video" ? (
            <video
              className="media-carousel__video"
              controls
              preload="metadata"
              playsInline
              src={item.url}
            />
          ) : (
            <img
              className="media-carousel__image"
              src={item.url}
              alt={item.filename}
              loading="lazy"
            />
          )}
        </div>
      )),
    [media]
  );

  return (
    <div className="media-carousel">
      <div className="media-carousel__track" onScroll={handleScroll}>
        {slides}
      </div>

      {hasMultiple && (
        <div className="media-carousel__dots" aria-hidden="true">
          {media.map((item, index) => (
            <span
              key={item.id}
              className={`media-carousel__dot ${index === activeIndex ? "is-active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
