import { useEffect, useId, useRef, useState } from 'react';
import './ModeMenu.css';

// A compact selection menu styled to match the study-mode dropdown.
export default function SortMenu({ options, value, onChange, label = 'Sort by' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="mode-menu sort-menu" ref={rootRef}>
      <span className="mode-menu-label" id={`${menuId}-label`}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-type1 mode-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-labelledby={`${menuId}-label ${menuId}-button`}
        id={`${menuId}-button`}
        onClick={() => setOpen((current) => !current)}
      >
        {selected?.label ?? 'Sort'}
        <span className="mode-menu-chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="mode-menu-list" id={menuId} role="menu" aria-labelledby={`${menuId}-label`}>
          {options.map((option) => (
            <li key={option.value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={option.value === value}
                className={`mode-menu-item sort-menu-item${option.value === value ? ' sort-menu-item--selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
              >
                {option.label}
                {option.value === value && <span aria-hidden="true">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
