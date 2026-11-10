export function Brand() {
  return (
    <a
      href="#top"
      className="brand"
      aria-label="motorservice Краснодар — на главную"
    >
      <img
        src={`${import.meta.env.BASE_URL}brand/logo.png`}
        alt=""
        width="866"
        height="866"
      />
      <span>
        motorservice <small>Краснодар</small>
      </span>
    </a>
  );
}
