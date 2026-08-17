import { useFavorites } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

export function FavoriteButton({ productId, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(productId);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggleFavorite(productId);
  };

  return (
    <button
      type="button"
      data-testid="favorite-button"
      className={`favorite-button ${favorited ? 'favorited' : ''} ${className}`}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      onClick={handleClick}
    >
      <svg
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
