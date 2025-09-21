import useSound from 'use-sound';

export default function Button({ children, ...props }) {
  const [playClick] = useSound('/audio/click.mp3');
  const [playButtonHover] = useSound('/audio/buttonhover.mp3');

  const handleClick = (e) => {
    playClick();
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <button 
      {...props}
      onClick={handleClick}
      onMouseEnter={() => playButtonHover()}
    >
      {children}
    </button>
  );
}
