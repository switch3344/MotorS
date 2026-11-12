export function Brand() {
  return (
    <a
      href="#top"
      className="brand"
      aria-label="motorservice Краснодар — на главную"
    >
      <img
        src={`${import.meta.env.BASE_URL}brand/logo-transparent.png`}
        alt=""
        width="1254"
        height="1254"
      />
      <span>
        motorservice <small>Краснодар</small>
      </span>
    </a>
  );
}
