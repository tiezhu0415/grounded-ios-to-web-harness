import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'ecommerce-favorites-v1';

type Listener = () => void;

function readFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    // ignore corrupted storage
  }
  return [];
}

function writeFavoriteIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

function createFavoritesStore() {
  let ids = readFavoriteIds();
  const listeners = new Set<Listener>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => ids,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    toggle: (productId: string) => {
      if (ids.includes(productId)) {
        ids = ids.filter((id) => id !== productId);
      } else {
        ids = [...ids, productId];
      }
      writeFavoriteIds(ids);
      notify();
    },
    isFavorite: (productId: string) => ids.includes(productId),
  };
}

const favoritesStore = createFavoritesStore();

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => favoritesStore.getSnapshot());

  useEffect(() => {
    return favoritesStore.subscribe(() => {
      setFavoriteIds(favoritesStore.getSnapshot());
    });
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback((productId: string) => {
    favoritesStore.toggle(productId);
  }, []);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
  };
}
