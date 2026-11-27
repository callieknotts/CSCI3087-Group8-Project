import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './ModeMenu.css';

/**
 * The "Mode" dropdown (label above, menu below). Each mode is a link, so picking one takes the
 * user to that page. A mode with `disabled: true` is a placeholder that can't be picked yet.
 * The list of modes lives in utils/studyModes.js.
 *
 * modes: [{ label: 'Classic', to: '/decks/1/flashcards' }, { label: 'Repetition', disabled: true }]
 */
export default function ModeMenu({ modes, label = 'Mode' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();

  // close when the user clicks somewhere else or presses Escape
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

  // up/down arrows move between the items while the menu is open
  function onMenuKeyDown(event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(rootRef.current.querySelectorAll('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
    items[(next + items.length) % items.length]?.focus();
  }

  return (
    <div className="mode-menu" ref={rootRef}>
      <span className="mode-menu-label" id={`${menuId}-label`}>
        {label}
      </span>
      <button
        type="button"
        ref={buttonRef}
        className="btn btn-type1 mode-menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-labelledby={`${menuId}-label ${menuId}-button`}
        id={`${menuId}-button`}
        onClick={() => setOpen((value) => !value)}
      >
        Choose mode
        <span className="mode-menu-chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul
          className="mode-menu-list"
          id={menuId}
          role="menu"
          aria-labelledby={`${menuId}-label`}
          onKeyDown={onMenuKeyDown}
        >
          {modes.map((mode) =>
            mode.disabled ? (
              <li key={mode.label} role="none">
                <span role="menuitem" aria-disabled="true" className="mode-menu-item mode-menu-item--disabled">
                  {mode.label}
                  {mode.note && <small className="mode-menu-note">{mode.note}</small>}
                </span>
              </li>
            ) : (
            <li key={mode.to} role="none">
              <Link
                role="menuitem"
                className="mode-menu-item"
                to={mode.to}
                onClick={() => setOpen(false)}
              >
                {mode.label}
              </Link>
            </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
