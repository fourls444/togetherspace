"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { searchPlaces, type GeocodeResult } from "@/lib/geocoding";
import styles from "./place-search.module.css";

import { Search, Loader2 } from "lucide-react";

type PlaceSearchProps = {
  onSelectResult: (result: GeocodeResult) => void;
};

export function PlaceSearch({ onSelectResult }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const data = await searchPlaces(query);
      setResults(data);
      setIsOpen(true);
    });
  }

  function handleSelect(result: GeocodeResult) {
    setQuery(result.displayName);
    setIsOpen(false);
    onSelectResult(result);
  }

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสถานที่..."
          className={styles.searchInput}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        <button
          type="submit"
          className={styles.searchButton}
          disabled={isPending}
          aria-label="ค้นหา"
        >
          {isPending ? <Loader2 size={18} className={styles.spin} /> : <Search size={18} />}
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((result, i) => (
            <li key={i} className={styles.resultItem}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className={styles.resultButton}
              >
                {result.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isPending && query && results.length === 0 && (
        <div className={styles.noResults}>ไม่พบสถานที่ที่ค้นหา</div>
      )}
    </div>
  );
}
