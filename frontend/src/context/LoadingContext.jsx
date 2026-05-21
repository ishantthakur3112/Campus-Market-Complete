import React, { createContext, useState, useContext } from 'react';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading && (
        <div className="global-spinner-overlay">
          <div className="spinner-container">
            <div className="loading-spinner"></div>
            <p>Waking up the server instance...</p>
            <p className="subtext">Please allow up to 50-90 seconds for the initial load.</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);