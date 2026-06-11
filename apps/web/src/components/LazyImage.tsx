"use client";

import { useState, useRef, useEffect } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export default function LazyImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) return;
    setLoaded(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src as string;
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {!loaded && (
        <div className="absolute inset-0 skeleton-enhanced" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt || ""}
        className={`${className} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
}
