interface HeaderProps {
  onHome: () => void;
}

export function Header({ onHome }: HeaderProps) {
  return (
    <header className="header">
      <button className="brand" type="button" onClick={onHome}>
        <span className="brand-mark" aria-hidden="true">
          ▶
        </span>
        Code Arcade
      </button>
    </header>
  );
}
