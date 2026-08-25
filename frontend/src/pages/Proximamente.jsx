export default function Proximamente({ titulo }) {
  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">Programación</p>
          <h2>{titulo}</h2>
        </div>
      </div>
      <p style={{ color: 'var(--gray-tx)', fontSize: 13.5 }}>
        Todavía en construcción.
      </p>
    </div>
  );
}
