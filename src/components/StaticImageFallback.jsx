import React from 'react';
import { getStaticImage } from '../utils/imageOpt.js';

export function StaticImageFallback({ src, alt, className, style }) {
  const staticSrc = getStaticImage(src);
  return <img src={staticSrc} alt={alt} className={className} style={style} loading="lazy" />;
}
