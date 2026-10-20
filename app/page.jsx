"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Beer,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { categories, brl, seedProducts } from "../src/data";
import { db, firebaseEnabled } from "../src/firebase";
import { handleProductImageError } from "../src/product-image";
import { showToast } from "../src/alerts";
import Swal from "sweetalert2";

const storePhone = process.env.NEXT_PUBLIC_STORE_WHATSAPP || "5511999999999";

const heroSlides = [
  {
    eyebrow: "A gelada chega antes da vontade passar",
    title: ["Seu rolê.", "Sua gelada.", "Nosso corre."],
    description:
      "As bebidas mais geladas da cidade, entregues rapidinho aí na sua porta.",
    label: "DESDE 2018",
    labelTitle: ["Resenha boa", "começa gelada."],
    labelDescription: "Não deixa pra depois.",
    badge: "MAIS PEDIDO",
    badgeDescription: "da semana",
    sticker: "-18°",
    stickerDescription: "NO PONTO",
    image:
      "https://s2-oglobo.glbimg.com/EQOIatMEIZ57V18RuY_GoNQXphs=/1200x/smart/filters:cover():strip_icc()/i.s3.glbimg.com/v1/AUTH_da025474c0c44edd99332dddb09cabe8/internal_photos/bs/2026/S/h/bkLJ9sTcAuUXZbOHfBFw/115741784-el-exclusivo-rio-de-janeiro-rj-23-07-2026-degustacao-de-cervejas-sem-gluten-encontro-no.jpg",
    imageAlt: "Seleção de cervejas para compartilhar",
  },
  {
    eyebrow: "Um brinde deixa tudo mais especial",
    title: ["Celebre.", "Brinde do", "seu jeito."],
    description:
      "Vinhos e espumantes para acompanhar bons encontros e momentos especiais.",
    label: "UM BOM BRINDE",
    labelTitle: ["A ocasião pede", "uma taça."],
    labelDescription: "Encontre seu favorito.",
    badge: "PRA BRINDAR",
    badgeDescription: "em boa companhia",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Taças de vinho em um brinde",
  },
  {
    eyebrow: "A resenha fica melhor com tudo por perto",
    title: ["Sua noite.", "Seu combo.", "Nosso corre."],
    description:
      "Escolha bebidas, gelo e acompanhamentos. A gente entrega tudo geladinho.",
    label: "RESENHA COMPLETA",
    labelTitle: ["Tudo pra sua", "noite."],
    labelDescription: "Só escolher e aproveitar.",
    badge: "COMBOS",
    badgeDescription: "pra compartilhar",
    image:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Ambiente aconchegante para uma noite entre amigos",
  },
];

function localRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function wa(phone, message) {
  const number = String(phone || storePhone).replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState(() =>
    firebaseEnabled ? [] : localRead("sb-products", seedProducts),
  );
  const [orders, setOrders] = useState(() => localRead("sb-orders", []));
  const [cart, setCart] = useState(() => localRead("sb-cart", []));
  const [category, setCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [success, setSuccess] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [activeHero, setActiveHero] = useState(0);

  useEffect(() => {
    if (search.trim()) return;
    const interval = setInterval(() => {
      setActiveHero((current) => (current + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [activeHero, search]);

  const changeHero = (index) => {
    setActiveHero((index + heroSlides.length) % heroSlides.length);
  };
  const activeSlide = heroSlides[activeHero];

  useEffect(() => {
    const timeout = setTimeout(() => setQueryText(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (firebaseEnabled) return;
    localStorage.setItem("sb-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (firebaseEnabled) return;
    localStorage.setItem("sb-orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("sb-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!firebaseEnabled) return;

    return onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
      },
      (error) => {
        console.error("Não foi possível carregar os produtos:", error);
      },
    );
  }, []);

  const notify = (message) => showToast(message);

  const isOrderTimeOpen = () => {
    const timeParts = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const hour = Number(timeParts.find((part) => part.type === "hour").value);
    const minute = Number(
      timeParts.find((part) => part.type === "minute").value,
    );
    const minutes = hour * 60 + minute;
    return minutes >= 8 * 60 && minutes <= 19 * 60 + 30;
  };

  const showStoreClosedAlert = () =>
    Swal.fire({
      icon: "info",
      title: "Estamos fora do horário de pedidos",
      text: "Estamos aceitando pedidos das 08:00 às 19:30. Tente novamente dentro desse horário.",
      confirmButtonText: "Entendi",
      confirmButtonColor: "#c92f32",
    });

  const openCheckout = () => {
    if (!isOrderTimeOpen()) {
      showStoreClosedAlert();
      return;
    }
    setCheckout(true);
  };

  const visible = useMemo(
    () =>
      products.filter(
        (product) =>
          product.available !== false &&
          (category === "Todas" || product.category === category) &&
          (!queryText ||
            product.name.toLowerCase().includes(queryText.toLowerCase())),
      ),
    [products, category, queryText],
  );
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const add = (product) => {
    setCart((items) => {
      const found = items.find((item) => item.id === product.id);
      if (!found) return [...items, { ...product, quantity: 1 }];
      return items.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, product.stock || 99),
            }
          : item,
      );
    });
    notify(`${product.name} adicionado ao carrinho`);
  };

  const buyNow = (product) => {
    if (!isOrderTimeOpen()) {
      showStoreClosedAlert();
      return;
    }
    setCart((items) => {
      const found = items.find((item) => item.id === product.id);
      if (!found) return [...items, { ...product, quantity: 1 }];
      return items.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, product.stock || 99),
            }
          : item,
      );
    });
    setDrawer(false);
    setDetail(null);
    setCheckout(true);
  };

  const changeQty = (id, difference) =>
    setCart((items) =>
      items
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + difference }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );

  const navigate = (page) => {
    router.push(page === "admin" ? "/admin" : "/");
    window.scrollTo(0, 0);
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!isOrderTimeOpen()) {
      showStoreClosedAlert();
      setCheckout(false);
      return;
    }
    const form = new FormData(event.currentTarget);
    const customer = {
      name: form.get("name"),
      phone: form.get("phone"),
      address: `${form.get("street")}, ${form.get("number")}${form.get("complement") ? `, ${form.get("complement")}` : ""} — ${form.get("district")}, ${form.get("city")}`,
    };
    const paymentMethod = form.get("paymentMethod");
    const order = {
      customer,
      items: cart.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      totalAmount: total,
      paymentMethod,
      changeFor:
        paymentMethod === "Dinheiro" ? Number(form.get("changeFor") || 0) : 0,
      notes: form.get("notes") || "",
      status: "pendente",
      createdAt: new Date().toISOString(),
    };

    setBusy(true);
    try {
      if (firebaseEnabled) {
        const reference = await addDoc(collection(db, "orders"), {
          ...order,
          createdAt: serverTimestamp(),
        });
        order.id = reference.id;
      } else {
        order.id = `SB-${Date.now().toString().slice(-7)}`;
        setOrders((items) => [order, ...items]);
      }
      setSuccess(order);
      setCart([]);
      setCheckout(false);
      setDrawer(false);
    } catch (error) {
      notify("Não foi possível salvar o pedido. Tente novamente.");
      console.error(error);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="storefront-shell">
      <div className="topline">
        <span>
          <Truck size={13} /> Entrega grátis acima de R$ 150
        </span>
        <span>Pedidos até 19h30 · Entregamos geladinho</span>
        <a
          href={wa(storePhone, "Oi! Vim pelo site da StopBeer.")}
          target="_blank"
        >
          Fale com a gente <ArrowUpRight size={13} />
        </a>
      </div>
      <header className="header">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
        >
          <span className="brandmark">
            <Beer size={22} />
          </span>
          <span>
            stop<span>beer</span>
            <small>DISTRIBUIDORA</small>
          </span>
        </a>
        <div className="searchbox">
          <Search size={19} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="O que vai gelar seu rolê hoje?"
          />
          <kbd>⌘ K</kbd>
        </div>
        <div className="header-actions">
          <details className="delivery-region">
            <summary className="delivery">
              <MapPin size={17} />
              <span>
                <small>ENTREGAMOS EM</small>
                <b>
                  Sertaneja - PR <ChevronDown size={13} />
                </b>
              </span>
            </summary>
            <div className="delivery-region-menu">
              <span>Área de entrega</span>
              <button
                type="button"
                onClick={(event) =>
                  event.currentTarget
                    .closest("details")
                    ?.removeAttribute("open")
                }
              >
                <MapPin size={15} />
                Sertaneja - PR
                <Check size={15} />
              </button>
            </div>
          </details>
          <button className="cart-button" onClick={() => setDrawer(true)}>
            <ShoppingBag size={18} />
            <span>Meu carrinho</span>
            <b>{count}</b>
          </button>
        </div>
      </header>
      <main className={search.trim() ? "search-mode" : undefined}>
        <section
          className="hero hero-carousel"
          aria-roledescription="carrossel"
        >
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse-dot" /> {activeSlide.eyebrow}
            </div>
            <h1 key={`hero-title-${activeHero}`}>
              {activeSlide.title.map((line, index) => (
                <span
                  className={index === 1 ? "hero-title-accent" : undefined}
                  key={line}
                >
                  {line}
                  {index < activeSlide.title.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p key={`hero-description-${activeHero}`}>
              {activeSlide.description}
            </p>
            <a href="#catalogo" className="primary-btn">
              Escolher minhas bebidas <ArrowRight size={17} />
            </a>
            <div className="hero-proof">
              <div className="avatars">
                <i>R</i>
                <i>M</i>
                <i>C</i>
                <i>+</i>
              </div>
              <span>
                <b>4,9/5</b> · quem pede, recomenda
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-label">
              <span>{activeSlide.label}</span>
              <b>
                {activeSlide.labelTitle[0]}
                <br />
                {activeSlide.labelTitle[1]}
              </b>
              <small>{activeSlide.labelDescription}</small>
            </div>
            <img
              key={`hero-image-${activeHero}`}
              src={activeSlide.image}
              alt={activeSlide.imageAlt}
            />
            <div className="hero-tag">
              <Flame size={14} fill="currentColor" /> {activeSlide.badge}{" "}
              <b>{activeSlide.badgeDescription}</b>
            </div>
            {activeHero === 0 && (
              <div className="hero-sticker">
                {activeSlide.sticker}
                <small>{activeSlide.stickerDescription}</small>
              </div>
            )}
          </div>
          <div
            className="hero-index hero-carousel-controls"
            aria-label="Navegação dos banners"
          >
            <button
              type="button"
              aria-label="Banner anterior"
              onClick={() => changeHero(activeHero - 1)}
            >
              <ChevronLeft size={15} />
            </button>
            {heroSlides.map((slide, index) => (
              <button
                type="button"
                className={`hero-carousel-dot${index === activeHero ? " active" : ""}`}
                aria-label={`Ir para o banner ${index + 1}`}
                aria-current={index === activeHero ? "true" : undefined}
                key={slide.eyebrow}
                onClick={() => changeHero(index)}
              />
            ))}
            <button
              type="button"
              aria-label="Próximo banner"
              onClick={() => changeHero(activeHero + 1)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </section>
        <section className="benefits">
          <div>
            <span className="benefit-icon">
              <Truck />
            </span>
            <p>
              <b>Chega rapidinho</b>
              <small>Em até 45 min na sua porta</small>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <SnowflakeIcon />
            </span>
            <p>
              <b>Do jeito certo</b>
              <small>Tudo gelado, sempre</small>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <ShieldCheck />
            </span>
            <p>
              <b>Compra segura</b>
              <small>Pague só na entrega</small>
            </p>
          </div>
          <div>
            <span className="benefit-icon">
              <Star fill="currentColor" />
            </span>
            <p>
              <b>Todo mundo pede</b>
              <small>Nota 4,9 de quem conhece</small>
            </p>
          </div>
        </section>
        <section className="catalog" id="catalogo">
          <div className="section-head">
            <div>
              <div className="eyebrow">
                SELEÇÃO STOPBEER <span className="tiny-line" />
              </div>
              <h2>
                A resenha começa <em>por aqui.</em>
              </h2>
              <p>Escolhe a sua e deixa o resto com a gente.</p>
            </div>
            <div className="catalog-count">
              <b>{visible.length.toString().padStart(2, "0")}</b>
              <span>
                produtos
                <br />
                disponíveis
              </span>
            </div>
          </div>
          <div className="filters">
            <div className="pills">
              {categories.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={category === c ? "active" : ""}
                >
                  {i === 0 && <Package size={15} />} {c}
                </button>
              ))}
            </div>
            <button
              className="filter-sort"
              onClick={() => setCategory("Todas")}
            >
              <SlidersHorizontal size={15} /> Filtros
            </button>
          </div>
          {visible.length ? (
            <div className="product-grid">
              {visible.map((p, i) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  add={add}
                  buyNow={buyNow}
                  onDetail={() => setDetail(p)}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search />
              <h3>Não achamos essa gelada.</h3>
              <p>Tente outra busca ou escolha uma categoria.</p>
              <button
                className="text-btn"
                onClick={() => {
                  setSearch("");
                  setCategory("Todas");
                }}
              >
                Ver todos os produtos
              </button>
            </div>
          )}
        </section>
        <section className="banner">
          <div className="banner-copy">
            <span className="eyebrow">BEBIDAS GELADAS, MOMENTOS MELHORES</span>
            <h2>
              Seu encontro
              <br />
              <em>merece uma gelada.</em>
            </h2>
            <p>
              Cervejas, destilados e tudo para servir bem. Escolha suas bebidas
              e receba em casa.
            </p>
            <button
              className="banner-btn"
              onClick={() => {
                setCategory("Cervejas");
                document
                  .getElementById("catalogo")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver bebidas <ArrowRight size={16} />
            </button>
          </div>
          <div className="banner-figure">
            <img src="https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=1200&q=90" />
            <div className="banner-sticker">
              <span>
                GELADA
                <br />
                NO PONTO
              </span>
              ✦
            </div>
          </div>
        </section>
        <section className="closing">
          <div>
            <span className="eyebrow">PRA SUA NOITE NÃO ESFRIAR</span>
            <h2>
              Deixa a gelada
              <br />
              <em>com a gente.</em>
            </h2>
          </div>
          <button
            className="primary-btn"
            onClick={() =>
              document
                .getElementById("catalogo")
                .scrollIntoView({ behavior: "smooth" })
            }
          >
            Fazer meu pedido <ArrowRight size={17} />
          </button>
          <span className="closing-mark">
            SB<span>.</span>
          </span>
        </section>
      </main>
      <footer>
        <a className="brand footer-brand" href="#">
          <span className="brandmark">
            <Beer size={22} />
          </span>
          <span>
            stop<span>beer</span>
            <small>DISTRIBUIDORA</small>
          </span>
        </a>
        <p>
          Boas resenhas começam com a gente.
          <br className="footer-copy-break" />
          Feito com responsabilidade. Beba com moderação.
        </p>
        <div className="footer-right">
          <span>© 2025 StopBeer Distribuidora</span>
          <div>
            <a href="#entrega">Entregas</a>
            <a href="#catalogo">Produtos</a>
            <a href={wa(storePhone, "Oi!")} target="_blank">
              Contato <ArrowUpRight size={12} />
            </a>
            <button onClick={() => navigate("admin")}>Área admin</button>
          </div>
        </div>
      </footer>
      {drawer && (
        <>
          <div className="overlay" onClick={() => setDrawer(false)} />
          <aside className="drawer">
            <div className="drawer-head">
              <div>
                <span className="eyebrow">SEU PEDIDO</span>
                <h3>
                  Carrinho <span>({count})</span>
                </h3>
              </div>
              <button className="icon-btn" onClick={() => setDrawer(false)}>
                <X />
              </button>
            </div>
            {cart.length ? (
              <>
                <div className="cart-lines">
                  {cart.map((i) => (
                    <div className="cart-line" key={i.id}>
                      <img
                        src={i.imageUrl}
                        onError={(event) => handleProductImageError(event, i)}
                      />
                      <div className="cart-item-info">
                        <b>{i.name}</b>
                        <small>{brl(i.price)} cada</small>
                        <div className="qty">
                          <button onClick={() => changeQty(i.id, -1)}>
                            <Minus size={14} />
                          </button>
                          <span>{i.quantity}</span>
                          <button onClick={() => changeQty(i.id, 1)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <strong>{brl(i.price * i.quantity)}</strong>
                    </div>
                  ))}
                </div>
                <div className="drawer-bottom">
                  <div className="free-delivery">
                    <Truck size={17} />
                    <span>
                      Você está a <b>{brl(Math.max(0, 150 - total))}</b> da
                      entrega grátis
                    </span>
                  </div>
                  <div className="subtotal">
                    <span>Subtotal</span>
                    <b>{brl(total)}</b>
                  </div>
                  <small className="delivery-note">
                    Taxa de entrega calculada na confirmação
                  </small>
                  <button className="primary-btn full" onClick={openCheckout}>
                    Continuar pedido <ArrowRight size={17} />
                  </button>
                  <button
                    className="continue-link"
                    onClick={() => setDrawer(false)}
                  >
                    Continuar comprando
                  </button>
                </div>
              </>
            ) : (
              <div className="cart-empty">
                <span className="empty-bag">
                  <ShoppingBag />
                </span>
                <h3>Seu carrinho tá gelado.</h3>
                <p>Escolha suas bebidas favoritas e a gente leva até você.</p>
                <button
                  className="primary-btn"
                  onClick={() => setDrawer(false)}
                >
                  Explorar bebidas <ArrowRight size={16} />
                </button>
              </div>
            )}
          </aside>
        </>
      )}
      {checkout && (
        <Modal close={() => setCheckout(false)} wide>
          <div className="checkout-head">
            <span className="eyebrow">QUASE LÁ</span>
            <h2>
              Fechar pedido<span>.</span>
            </h2>
            <p>Seus dados são usados só pra levar sua gelada até você.</p>
          </div>
          <form className="checkout-form" onSubmit={submitOrder}>
            <div className="form-column">
              <h4>
                <span>01</span> Seus dados
              </h4>
              <label>
                Nome completo
                <input
                  required
                  name="name"
                  placeholder="Como podemos te chamar?"
                />
              </label>
              <label>
                WhatsApp
                <input
                  required
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  onChange={(e) => (e.target.value = maskPhone(e.target.value))}
                />
              </label>
              <h4>
                <span>02</span> Onde entregamos?
              </h4>
              <div className="form-row">
                <label className="grow">
                  Rua
                  <input required name="street" placeholder="Nome da rua" />
                </label>
                <label className="number">
                  Nº
                  <input required name="number" placeholder="123" />
                </label>
              </div>
              <div className="form-row">
                <label className="grow">
                  Bairro
                  <input required name="district" placeholder="Seu bairro" />
                </label>
                <label className="grow">
                  Cidade
                  <input required name="city" placeholder="Sua cidade" />
                </label>
              </div>
              <label>
                Complemento <small>(opcional)</small>
                <input
                  name="complement"
                  placeholder="Apto, bloco, referência..."
                />
              </label>
              <h4>
                <span>03</span> Como prefere pagar?
              </h4>
              <div className="pay-options">
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Pix"
                    defaultChecked
                  />
                  <span>Pix</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cartão na Entrega"
                  />
                  <span>Cartão</span>
                </label>
                <label>
                  <input type="radio" name="paymentMethod" value="Dinheiro" />
                  <span>Dinheiro</span>
                </label>
              </div>
              <label>
                Observações <small>(opcional)</small>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Referência, horário ou recado"
                ></textarea>
              </label>
              <label>
                Precisa de troco? <small>(preencha se pagar em dinheiro)</small>
                <input
                  name="changeFor"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Troco para R$"
                />
              </label>
            </div>
            <div className="order-summary">
              <h4>Resumo do pedido</h4>
              {cart.map((i) => (
                <div className="summary-line" key={i.id}>
                  <span>
                    {i.quantity} × {i.name}
                  </span>
                  <b>{brl(i.price * i.quantity)}</b>
                </div>
              ))}
              <div className="summary-total">
                <span>Total dos produtos</span>
                <b>{brl(total)}</b>
              </div>
              <p>
                <Truck size={14} /> Entrega calculada na confirmação
              </p>
              <button className="primary-btn full" disabled={busy}>
                {busy ? <LoaderCircle className="spin" /> : "Confirmar pedido"}{" "}
                {!busy && <ArrowRight size={17} />}
              </button>
              <button
                className="continue-link"
                type="button"
                onClick={() => setCheckout(false)}
              >
                Voltar ao carrinho
              </button>
            </div>
          </form>
        </Modal>
      )}
      {success && (
        <Modal close={() => setSuccess(null)}>
          <div className="success-panel">
            <span className="success-check">
              <Check />
            </span>
            <span className="eyebrow">PEDIDO ENVIADO</span>
            <h2>
              Tá tudo certo,
              <br />
              <em>{success.customer.name.split(" ")[0]}.</em>
            </h2>
            <p>
              Seu pedido <b>#{String(success.id).slice(-7)}</b> já chegou pra
              gente. Agora é só preparar a gelada.
            </p>
            <div className="success-receipt">
              <div>
                <span>Seu pedido</span>
                <b>#{String(success.id).slice(-7)}</b>
              </div>
              <div>
                <span>Pagamento</span>
                <b>{success.paymentMethod}</b>
              </div>
              <div>
                <span>Total</span>
                <b>{brl(success.totalAmount)}</b>
              </div>
              <div>
                <span>Entrega em</span>
                <b>{success.customer.address.split("—")[0]}</b>
              </div>
            </div>
            <a
              className="primary-btn full"
              href={wa(
                storePhone,
                `Olá! Acabei de fazer o pedido #${String(success.id).slice(-7)} no valor de ${brl(success.totalAmount)}. Nome: ${success.customer.name}.`,
              )}
              target="_blank"
            >
              Enviar confirmação via WhatsApp <MessageCircle size={17} />
            </a>
            <button className="continue-link" onClick={() => setSuccess(null)}>
              Voltar para a loja
            </button>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal close={() => setDetail(null)}>
          <div className="detail-modal">
            <img
              src={detail.imageUrl}
              onError={(event) => handleProductImageError(event, detail)}
            />
            <span className="product-category">{detail.category}</span>
            <h2>{detail.name}</h2>
            <p>{detail.description}</p>
            <div className="detail-price">
              <b>{brl(detail.price)}</b>
              <small>
                {detail.stock > 0
                  ? `${detail.stock} disponíveis`
                  : "Indisponível"}
              </small>
            </div>
            <div className="detail-actions">
              <button
                className="secondary-buy-btn"
                onClick={() => {
                  add(detail);
                  setDetail(null);
                }}
                disabled={!detail.stock}
              >
                <Plus size={16} /> Adicionar ao carrinho
              </button>
              <button
                className="primary-btn"
                onClick={() => buyNow(detail)}
                disabled={!detail.stock}
              >
                Comprar agora <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProductCard({ p, add, buyNow, onDetail, index }) {
  return (
    <article className="product-card" style={{ "--i": index }}>
      <button className="product-image" onClick={onDetail}>
        <img
          src={p.imageUrl}
          alt={p.name}
          loading="lazy"
          onError={(event) => handleProductImageError(event, p)}
        />
        <span className="product-category">{p.category}</span>
        {p.badge && (
          <span className="product-badge">
            <Flame size={11} fill="currentColor" />
            {p.badge}
          </span>
        )}
        <span className="quick-view">
          Ver detalhes <ArrowUpRight size={13} />
        </span>
      </button>
      <div className="product-info">
        <button className="product-name" onClick={onDetail}>
          {p.name}
        </button>
        <p>
          {p.stock > 0 ? (
            <>
              <i className="stock-dot" /> Em estoque
            </>
          ) : (
            <>
              <i className="stock-dot out" /> Indisponível
            </>
          )}
        </p>
        <div className="product-bottom">
          <div>
            <b>{brl(p.price)}</b>
            <small>
              {p.category === "Cervejas" ? "unidade" : "por unidade"}
            </small>
          </div>
          <div className="product-actions">
            <button
              className="add-btn"
              onClick={() => add(p)}
              disabled={!p.stock}
            >
              <Plus size={15} />
              <span>Adicionar</span>
            </button>
            <button
              className="buy-btn"
              onClick={() => buyNow(p)}
              disabled={!p.stock}
            >
              Comprar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
function Modal({ children, close, wide }) {
  return (
    <div
      className="modal-wrap"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className={`modal ${wide ? "wide" : ""}`}>
        <button className="modal-close icon-btn" onClick={close}>
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}

function maskPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 3) return d ? `(${d}` : "";
  if (d.length < 8) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function SnowflakeIcon() {
  return <span className="snowflake">✳</span>;
}
