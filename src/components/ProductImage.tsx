import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { cn, normalizeImageUrl } from '@/lib/utils';
import { createProductPlaceholderDataUrl, getCategoryFallback } from '@/lib/productImages';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  category?: string | null;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
};

export default function ProductImage({
  src,
  alt,
  category,
  className,
  imageClassName,
  iconClassName,
}: ProductImageProps) {
  const normalizedSrc = normalizeImageUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string | null>(normalizedSrc);
  const [showIconFallback, setShowIconFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(normalizedSrc);
    setShowIconFallback(false);
  }, [normalizedSrc]);

  const showImage = !!currentSrc && !showIconFallback;

  const handleError = () => {
    const categoryFallback = normalizeImageUrl(getCategoryFallback(category));
    if (currentSrc !== categoryFallback && categoryFallback) {
      setCurrentSrc(categoryFallback);
      return;
    }

    const placeholder = createProductPlaceholderDataUrl(alt);
    if (currentSrc !== placeholder) {
      setCurrentSrc(placeholder);
      return;
    }

    setShowIconFallback(true);
  };

  return (
    <div className={cn('bg-muted rounded flex items-center justify-center overflow-hidden', className)}>
      {showImage ? (
        <img
          src={currentSrc || undefined}
          alt={alt}
          className={cn('w-full h-full object-cover', imageClassName)}
          onError={handleError}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      ) : (
        <Package className={cn('text-muted-foreground', iconClassName)} />
      )}
    </div>
  );
}
