import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  DEFAULT_CHARACTER_ID,
  SHOWCASE_ROSTER,
  findCharacter,
  type ShowcaseCharacter,
} from './showcase-roster';

interface ActiveCharacterContextValue {
  id: string;
  name: string;
  character: ShowcaseCharacter;
  setCharacterId: (id: string) => void;
}

const fallbackCharacter: ShowcaseCharacter =
  findCharacter(DEFAULT_CHARACTER_ID) ?? SHOWCASE_ROSTER[0];

const ActiveCharacterContext = createContext<ActiveCharacterContextValue>({
  id: fallbackCharacter.id,
  name: fallbackCharacter.name,
  character: fallbackCharacter,
  setCharacterId: () => {},
});

export function ActiveCharacterProvider({
  characterId,
  setCharacterId,
  children,
}: {
  characterId: string;
  setCharacterId?: (id: string) => void;
  children: ReactNode;
}) {
  const character = findCharacter(characterId) ?? fallbackCharacter;
  const value = useMemo<ActiveCharacterContextValue>(
    () => ({
      id: character.id,
      name: character.name,
      character,
      setCharacterId: setCharacterId ?? (() => {}),
    }),
    [character, setCharacterId],
  );
  return (
    <ActiveCharacterContext.Provider value={value}>
      {children}
    </ActiveCharacterContext.Provider>
  );
}

export function useActiveCharacter(): ActiveCharacterContextValue {
  return useContext(ActiveCharacterContext);
}
