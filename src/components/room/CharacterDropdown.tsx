import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  SHOWCASE_ROSTER,
  type ShowcaseCharacter,
  type ShowcaseTier,
} from '@/data/showcase-roster';
import { usePetFrame } from '@/lib/pet-ticker';

const STATE_ATLAS_VERSION = 'loopling-state-atlas-2026-05-02';

interface CharacterDropdownProps {
  value: string;
  onChange: (id: string) => void;
  variant?: 'overlay' | 'screen';
}

const TIER_LABEL: Record<ShowcaseTier, string> = {
  founder: 'FOUNDER',
  approved: 'STABLE',
  rough: 'ROUGH',
};

function CharacterDropdownPet({ id, size = 22 }: { id: string; size?: number }) {
  const frame = usePetFrame();
  const style = {
    '--atlas': `url('/pets/${id}/state-atlas.png?v=${STATE_ATLAS_VERSION}')`,
    '--frame': frame,
    width: size,
    height: Math.round((size * 208) / 192),
  } as CSSProperties;
  return <span className="character-dropdown-pet" style={style} aria-hidden />;
}

export function CharacterDropdown({ value, onChange, variant = 'overlay' }: CharacterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(0, SHOWCASE_ROSTER.findIndex((c) => c.id === value)),
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listboxId = useId();

  const active: ShowcaseCharacter =
    SHOWCASE_ROSTER.find((c) => c.id === value) ?? SHOWCASE_ROSTER[0];

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const commit = useCallback(
    (index: number) => {
      const next = SHOWCASE_ROSTER[index];
      if (!next) return;
      onChange(next.id);
      setActiveIndex(index);
      close();
    },
    [onChange, close],
  );

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (triggerRef.current?.contains(target ?? null)) return;
      if (listRef.current?.contains(target ?? null)) return;
      setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('mousedown', handlePointer);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelector<HTMLLIElement>(
      `[data-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const handleTriggerKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const handleListKey = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((idx) => (idx + 1) % SHOWCASE_ROSTER.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((idx) => (idx - 1 + SHOWCASE_ROSTER.length) % SHOWCASE_ROSTER.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(SHOWCASE_ROSTER.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commit(activeIndex);
    }
  };

  return (
    <div className={`character-dropdown character-dropdown--${variant}`}>
      <button
        ref={triggerRef}
        type="button"
        className="character-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKey}
      >
        <CharacterDropdownPet id={active.id} size={variant === 'screen' ? 26 : 22} />
        <span className="character-dropdown-trigger-name">{active.name.toUpperCase()}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.4}
          aria-hidden
          className={`character-dropdown-caret${open ? ' is-open' : ''}`}
        />
      </button>
      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listboxId}-${activeIndex}`}
          className="character-dropdown-menu"
          onKeyDown={handleListKey}
        >
          {SHOWCASE_ROSTER.map((character, index) => {
            const selected = character.id === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={character.id}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={selected}
                data-index={index}
                className={`character-dropdown-option${isActive ? ' is-active' : ''}${selected ? ' is-selected' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
              >
                <CharacterDropdownPet id={character.id} size={28} />
                <span className="character-dropdown-option-name">{character.name}</span>
                <span className="character-dropdown-option-lineage">{character.lineage}</span>
                <span className="character-dropdown-option-tier">{TIER_LABEL[character.tier]}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
