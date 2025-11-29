import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  

  const value = {
 
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};