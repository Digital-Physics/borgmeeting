import { createContext, useContext, useState, useEffect } from 'react';
import { SKINS, getSkin, DEFAULT_SKIN_ID } from './skins.js';

const SkinContext = createContext(null);

export function SkinProvider({ children }) {
  const [skinId, setSkinId] = useState(
    () => localStorage.getItem('borgmeeting_skin') || DEFAULT_SKIN_ID
  );

  const skin = getSkin(skinId);

  useEffect(() => {
    // Apply CSS variables to :root
    const root = document.documentElement;
    Object.entries(skin.vars).forEach(([prop, val]) => {
      root.style.setProperty(prop, val);
    });
    // Apply font family via body
    document.body.style.fontFamily = skin.vars['--font'];
    // Mark current skin on <html> for any skin-specific CSS selectors
    root.setAttribute('data-skin', skin.id);
  }, [skin]);

  function changeSkin(id) {
    setSkinId(id);
    localStorage.setItem('borgmeeting_skin', id);
  }

  return (
    <SkinContext.Provider value={{ skin, skinId, changeSkin, skins: SKINS }}>
      {children}
    </SkinContext.Provider>
  );
}

export function useSkin() {
  return useContext(SkinContext);
}
