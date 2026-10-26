import './Button.css';
 
export default function Button({
  children,
  variant = 'type1', // 'type1' | 'type2'
  type = 'button',
  disabled = false,
  onClick,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
 