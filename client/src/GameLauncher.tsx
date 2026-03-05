import React, { useState } from 'react';

// Define the component props if needed
interface GameLauncherProps {
  userToken?: string; // Passed from your Auth context/state
  username?: string;
}

const GameLauncher: React.FC<GameLauncherProps> = ({ userToken, username = "Guest" }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const toggleGame = (): void => {
    setIsPlaying(!isPlaying);
  };

  // Construct the URL with the player's session token
  // This allows Godot to know WHO is playing without re-logging in
  const gameUrl: string = `game/index.html?token=${userToken || 'guest'}&user=${username}`;

  return (
    <div style={styles.container}>
      {!isPlaying ? (
        <section style={styles.hero}>
          <h1 style={styles.title}>Idle Kingdom</h1>
          <p>Welcome back, <strong>{username}</strong></p>
          
          <button 
            onClick={toggleGame} 
            style={styles.launchButton}
          >
            ENTER THE GAME
          </button>
        </section>
      ) : (
        <section style={styles.gameWrapper}>
          <div style={styles.topBar}>
            <span>Playing: Idle Kingdom</span>
            <button onClick={toggleGame} style={styles.exitButton}>
              Quit to Menu
            </button>
          </div>
          
          <iframe
            src={gameUrl}
            title="Godot Game Engine"
            style={styles.iframe}
            allow="autoplay; fullscreen"
          />
        </section>
      )}
    </div>
  );
};

// Typed Styles Object
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: '720px',
    width: '1280px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column'
  },
  hero: {
    margin: 'auto',
    textAlign: 'center',
    padding: '2rem',
    border: '1px solid #333',
    borderRadius: '12px',
    backgroundColor: '#252525'
  },
  title: { fontSize: '3rem', marginBottom: '1rem', color: '#4db8ff' },
  launchButton: {
    padding: '12px 24px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: '#4db8ff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    marginTop: '20px',
    transition: 'transform 0.1s'
  },
  gameWrapper: { flex: 1, display: 'flex', flexDirection: 'column' },
  topBar: {
    padding: '10px 20px',
    backgroundColor: '#333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iframe: {
    flex: 1,
    border: 'none',
    width: '100%',
    height: '100%'
  },
  exitButton: { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }
};

export default GameLauncher;