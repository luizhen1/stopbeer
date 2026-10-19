"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Beer,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ChartNoAxesColumn,
  LockKeyhole,
  Mail,
  MessageCircle,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  X,
  LogOut,
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { brl, categories, seedProducts } from "../../src/data";
import { auth, db, firebaseEnabled } from "../../src/firebase";
import { handleProductImageError } from "../../src/product-image";

const storePhone = process.env.NEXT_PUBLIC_STORE_WHATSAPP || "5511999999999";

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

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(() =>
    localRead("sb-products", seedProducts),
  );
  const [orders, setOrders] = useState(() => localRead("sb-orders", []));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [adminTab, setAdminTab] = useState("Pedidos");
  const [orderFilter, setOrderFilter] = useState("Todos");
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("sb-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("sb-orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        if (!snapshot.empty) {
          setProducts(
            snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
          );
        }
      },
      () => {},
    );
  }, []);

  useEffect(() => {
    if (!firebaseEnabled || !user) return;
    return onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setOrders(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
            createdAt:
              item.data().createdAt?.toDate?.()?.toISOString() ||
              item.data().createdAt ||
              new Date().toISOString(),
          })),
        );
      },
      () => {},
    );
  }, [user]);

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  };

  const navigate = (page) => {
    router.push(page === "admin" ? "/admin" : "/");
    window.scrollTo(0, 0);
  };

  const login = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await signInWithEmailAndPassword(
        auth,
        form.get("email"),
        form.get("password"),
      );
      setLoginOpen(false);
      notify("Bem-vindo ao painel");
    } catch {
      notify("E-mail ou senha inválidos");
    }
  };

  const changeStatus = async (order, status) => {
    try {
      if (firebaseEnabled) {
        await updateDoc(doc(db, "orders", order.id), { status });
      } else {
        setOrders((items) =>
          items.map((item) =>
            item.id === order.id ? { ...item, status } : item,
          ),
        );
      }
      notify("Status atualizado");
    } catch {
      notify("Falha ao atualizar pedido");
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = {
      name: form.get("name"),
      description: form.get("description"),
      category: form.get("category"),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      imageUrl: form.get("imageUrl") || seedProducts[0].imageUrl,
      available: true,
    };
    try {
      if (firebaseEnabled) {
        await addDoc(collection(db, "products"), product);
      } else {
        setProducts((items) => [
          { ...product, id: `p${Date.now()}` },
          ...items,
        ]);
      }
      notify("Produto adicionado");
      event.currentTarget.reset();
    } catch {
      notify("Falha ao salvar produto");
    }
  };

  const removeProduct = async (product) => {
    if (!confirm(`Remover ${product.name}?`)) return;
    try {
      if (firebaseEnabled) {
        await deleteDoc(doc(db, "products", product.id));
      } else {
        setProducts((items) => items.filter((item) => item.id !== product.id));
      }
      notify("Produto removido");
    } catch {
      notify("Falha ao remover produto");
    }
  };

  const toggleProduct = async (product) => {
    try {
      if (firebaseEnabled) {
        await updateDoc(doc(db, "products", product.id), {
          available: !product.available,
        });
      } else {
        setProducts((items) =>
          items.map((item) =>
            item.id === product.id
              ? { ...item, available: !item.available }
              : item,
          ),
        );
      }
    } catch {
      notify("Falha ao alterar disponibilidade");
    }
  };

  const isAuth = firebaseEnabled ? Boolean(user) : loginOpen;
  const loginHandler = async (event) => {
    if (firebaseEnabled) {
      await login(event);
      return;
    }
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("email") && form.get("password")) setLoginOpen(true);
  };

  const [localMonth, setLocalMonth] = useState(month);
  const [orderDetail, setOrderDetail] = useState(null);
  const isAuthenticated = isAuth;
  const monthOrders = orders.filter(
    (o) => String(o.createdAt || "").slice(0, 7) === month,
  );
  const revenue = monthOrders
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const average = monthOrders.length ? revenue / monthOrders.length : 0;
  const pending = orders.filter((o) => o.status === "pendente").length;
  const statuses = [
    "pendente",
    "confirmado",
    "em_rota",
    "entregue",
    "cancelado",
  ];
  const labels = {
    pendente: "Pendente",
    confirmado: "Confirmado",
    em_rota: "Em rota",
    entregue: "Entregue",
    cancelado: "Cancelado",
  };
  const filtered =
    orderFilter === "Todos"
      ? orders
      : orders.filter((o) => o.status === orderFilter);
  const maxDay = Math.max(
    1,
    ...Array.from(
      { length: 31 },
      (_, i) =>
        monthOrders.filter((o) => new Date(o.createdAt).getDate() === i + 1)
          .length,
    ),
  );
  const submitLogin = loginHandler;
  if (!isAuthenticated)
    return (
      <div className="admin-login-page">
        <button className="login-back" onClick={() => navigate("home")}>
          ← Voltar para loja
        </button>
        <form className="login-card" onSubmit={submitLogin}>
          <a className="brand" href="#">
            <span className="brandmark">
              <Beer />
            </span>
            <span>
              stop<span>beer</span>
              <small>PAINEL DE GESTÃO</small>
            </span>
          </a>
          <h1>
            Bom te ver <em>por aqui.</em>
          </h1>
          <p>Entre para acompanhar a operação da sua distribuidora.</p>
          {!firebaseEnabled && (
            <div className="demo-note">
              Modo demonstração ativo · qualquer e-mail e senha liberam o
              painel.
            </div>
          )}
          <label>
            <Mail size={16} />
            <input
              required
              type="email"
              name="email"
              placeholder="Seu e-mail"
            />
          </label>
          <label>
            <LockKeyhole size={16} />
            <input
              required
              type="password"
              name="password"
              placeholder="Sua senha"
            />
          </label>
          <button className="primary-btn full">
            Entrar no painel <ArrowRight size={17} />
          </button>
          <small>Acesso restrito ao proprietário</small>
        </form>
        {toast && (
          <div className="toast">
            <Check size={16} />
            {toast}
          </div>
        )}
      </div>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("home");
          }}
        >
          <span className="brandmark">
            <Beer />
          </span>
          <span>
            stop<span>beer</span>
            <small>GESTÃO</small>
          </span>
        </a>
        <div className="admin-store">
          <span className="store-avatar">SB</span>
          <span>
            <b>StopBeer</b>
            <small>Distribuidora</small>
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="side-label">MENU PRINCIPAL</div>
        {["Visão geral", "Pedidos", "Produtos"].map((x, i) => (
          <button
            className={`side-link ${adminTab === (i === 0 ? "Visão geral" : x) ? "active" : ""}`}
            onClick={() => setAdminTab(i === 0 ? "Visão geral" : x)}
            key={x}
          >
            {[<ChartNoAxesColumn />, <ShoppingBag />, <Package />][i]}
            {x}
            {x === "Pedidos" && pending > 0 && <b>{pending}</b>}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="admin-profile">
            <span className="profile-avatar">
              {user?.email?.[0]?.toUpperCase() || "S"}
            </span>
            <span>
              <b>{user?.email || "Administrador"}</b>
              <small>Proprietário</small>
            </span>
            <button
              title="Sair"
              onClick={() => {
                if (firebaseEnabled) signOut(auth);
                else setLoginOpen(false);
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
          <button className="store-link" onClick={() => navigate("home")}>
            ← Ver loja pública
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <span className="admin-crumb">
              StopBeer <ChevronRight size={13} /> {adminTab}
            </span>
            <h1>{adminTab === "Visão geral" ? "Visão geral" : adminTab}</h1>
          </div>
          <div className="admin-top-actions">
            <span className="live-indicator">
              <i /> Loja aberta
            </span>
            <button className="admin-avatar">
              {user?.email?.[0]?.toUpperCase() || "S"}
            </button>
          </div>
        </header>
        {adminTab === "Visão geral" ? (
          <>
            <div className="overview-head">
              <div>
                <h2>Resumo da operação</h2>
                <p>Acompanhe como estão as vendas da sua loja.</p>
              </div>
              <label className="month-picker">
                {localMonth && (
                  <>
                    <span>Período</span>
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => {
                        setMonth(e.target.value);
                        setLocalMonth(e.target.value);
                      }}
                    />
                  </>
                )}
              </label>
            </div>
            <div className="kpi-grid">
              <Metric
                title="Faturamento reservado"
                value={brl(revenue)}
                icon={
                  <span className="metric-icon gold">
                    <ChartNoAxesColumn />
                  </span>
                }
                delta="Neste mês"
              />
              <Metric
                title="Pedidos no mês"
                value={monthOrders.length}
                icon={
                  <span className="metric-icon blue">
                    <ShoppingBag />
                  </span>
                }
                delta="Todos os status"
              />
              <Metric
                title="Ticket médio"
                value={brl(average)}
                icon={
                  <span className="metric-icon green">
                    <ArrowUpRight />
                  </span>
                }
                delta="Por pedido"
              />
              <Metric
                title="Aguardando envio"
                value={pending}
                icon={
                  <span className="metric-icon orange">
                    <Clock />
                  </span>
                }
                delta="Pedidos pendentes"
                alert={pending > 0}
              />
            </div>
            <div className="dashboard-grid">
              <section className="panel sales-panel">
                <div className="panel-head">
                  <div>
                    <h3>Pedidos por dia</h3>
                    <p>Atividade diária no período selecionado</p>
                  </div>
                  <span className="chart-legend">
                    <i /> Pedidos
                  </span>
                </div>
                <div className="chart">
                  <div className="chart-y">
                    <span>10</span>
                    <span>7</span>
                    <span>4</span>
                    <span>1</span>
                    <span>0</span>
                  </div>
                  <div className="chart-plot">
                    <div className="grid-lines">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="bars">
                      {Array.from({ length: 31 }, (_, i) => {
                        let n = monthOrders.filter(
                          (o) => new Date(o.createdAt).getDate() === i + 1,
                        ).length;
                        return (
                          <div
                            key={i}
                            className="bar-col"
                            title={`${i + 1}: ${n} pedido(s)`}
                          >
                            <i
                              style={{
                                height: `${Math.max(n ? 4 : 1, (n / maxDay) * 100)}%`,
                              }}
                              className={n ? "has-orders" : ""}
                            />
                            <small>
                              {[0, 4, 9, 14, 19, 24, 30].includes(i)
                                ? i + 1
                                : ""}
                            </small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
              <section className="panel latest-panel">
                <div className="panel-head">
                  <div>
                    <h3>Pedidos recentes</h3>
                    <p>Últimas movimentações</p>
                  </div>
                  <button
                    className="text-btn"
                    onClick={() => setAdminTab("Pedidos")}
                  >
                    Ver todos <ArrowRight size={14} />
                  </button>
                </div>
                {orders.slice(0, 5).map((o) => (
                  <div className="latest-order" key={o.id}>
                    <span className="order-ava">
                      {o.customer?.name?.[0] || "?"}
                    </span>
                    <span>
                      <b>{o.customer?.name || "Cliente"}</b>
                      <small>
                        #{String(o.id).slice(-7)} ·{" "}
                        {new Date(o.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </span>
                    <span className="latest-right">
                      <b>{brl(o.totalAmount)}</b>
                      <Status status={o.status} />
                    </span>
                  </div>
                ))}
                {!orders.length && (
                  <div className="admin-empty">
                    <ShoppingBag />
                    <p>Nenhum pedido por enquanto.</p>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : adminTab === "Pedidos" ? (
          <>
            <div className="overview-head">
              <div>
                <h2>Pedidos recebidos</h2>
                <p>Acompanhe e atualize cada pedido em tempo real.</p>
              </div>
              <select
                className="filter-select"
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
              >
                <option>Todos</option>
                {statuses.map((s) => (
                  <option value={s} key={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </div>
            <section className="panel orders-panel">
              <div className="orders-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Itens</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <b className="order-id">#{String(o.id).slice(-7)}</b>
                        </td>
                        <td>
                          <b>{o.customer?.name}</b>
                          <small className="cell-sub">
                            {o.customer?.phone}
                          </small>
                        </td>
                        <td>
                          {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                          <small className="cell-sub">
                            {new Date(o.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </td>
                        <td>
                          {o.items?.reduce((n, i) => n + i.quantity, 0) || 0}{" "}
                          itens
                        </td>
                        <td>
                          <b>{brl(o.totalAmount)}</b>
                        </td>
                        <td>
                          <Status status={o.status} />
                        </td>
                        <td>
                          <div className="action-cell">
                            <a
                              className="wa-button"
                              href={wa(
                                o.customer?.phone,
                                `Olá ${o.customer?.name}! Sobre o pedido #${String(o.id).slice(-7)} da StopBeer.`,
                              )}
                              target="_blank"
                              title="WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </a>
                            <select
                              value={o.status}
                              onChange={(e) => changeStatus(o, e.target.value)}
                              aria-label="Alterar status"
                            >
                              {statuses.map((s) => (
                                <option value={s} key={s}>
                                  {labels[s]}
                                </option>
                              ))}
                            </select>
                            <button
                              className="details-button"
                              title="Detalhes"
                              onClick={() => setOrderDetail(o)}
                            >
                              <ChevronDown size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filtered.length && (
                  <div className="admin-empty">
                    <Package />
                    <p>Nenhum pedido neste filtro.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="overview-head">
              <div>
                <h2>Estoque e catálogo</h2>
                <p>Adicione produtos e controle a disponibilidade.</p>
              </div>
              <span className="product-count-admin">
                {products.length} produtos cadastrados
              </span>
            </div>
            <div className="products-admin-grid">
              <section className="panel add-product-panel">
                <div className="panel-head">
                  <div>
                    <h3>Novo produto</h3>
                    <p>Preencha as informações do item.</p>
                  </div>
                </div>
                <form onSubmit={saveProduct} className="add-product-form">
                  <label>
                    Nome do produto
                    <input
                      name="name"
                      required
                      placeholder="Ex: Heineken 350ml"
                    />
                  </label>
                  <label>
                    Descrição
                    <textarea
                      name="description"
                      placeholder="Detalhes do produto"
                      rows="2"
                    />
                  </label>
                  <div className="form-row">
                    <label className="grow">
                      Categoria
                      <select name="category">
                        {categories.slice(1).map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grow">
                      Preço (R$)
                      <input
                        required
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                      />
                    </label>
                  </div>
                  <div className="form-row">
                    <label className="grow">
                      Estoque
                      <input
                        required
                        name="stock"
                        type="number"
                        min="0"
                        placeholder="0"
                      />
                    </label>
                    <label className="grow">
                      URL da imagem
                      <input
                        name="imageUrl"
                        type="url"
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                  <button className="primary-btn full">
                    Adicionar produto <Plus size={16} />
                  </button>
                </form>
              </section>
              <section className="panel inventory-panel">
                <div className="panel-head">
                  <div>
                    <h3>Produtos</h3>
                    <p>Gerencie preços e disponibilidade.</p>
                  </div>
                </div>
                <div className="inventory-list">
                  {products.map((p) => (
                    <div className="inventory-row" key={p.id}>
                      <img
                        src={p.imageUrl}
                        onError={(event) => handleProductImageError(event, p)}
                      />
                      <span className="inventory-name">
                        <b>{p.name}</b>
                        <small>
                          {p.category} · {brl(p.price)} · {p.stock} un.
                        </small>
                      </span>
                      <button
                        className={`availability ${p.available ? "on" : ""}`}
                        onClick={() => toggleProduct(p)}
                        title="Alternar disponibilidade"
                      >
                        <i />
                      </button>
                      <button
                        className="remove-product"
                        onClick={() => removeProduct(p)}
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
      {orderDetail && (
        <div
          className="modal-wrap"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setOrderDetail(null)
          }
        >
          <div className="modal order-detail-modal">
            <button
              className="modal-close icon-btn"
              onClick={() => setOrderDetail(null)}
            >
              <X />
            </button>
            <span className="eyebrow">DETALHES DO PEDIDO</span>
            <h2>#{String(orderDetail.id).slice(-7)}</h2>
            <Status status={orderDetail.status} />
            <div className="order-detail-section">
              <h4>Cliente</h4>
              <b>{orderDetail.customer?.name}</b>
              <span>{orderDetail.customer?.phone}</span>
              <span>{orderDetail.customer?.address}</span>
            </div>
            <div className="order-detail-section">
              <h4>Itens do pedido</h4>
              {orderDetail.items?.map((item, i) => (
                <div className="summary-line" key={i}>
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <b>{brl(item.subtotal)}</b>
                </div>
              ))}
            </div>
            <div className="order-detail-section">
              <div className="summary-line">
                <span>Pagamento · {orderDetail.paymentMethod}</span>
                <b>
                  {orderDetail.changeFor
                    ? `Troco para ${brl(orderDetail.changeFor)}`
                    : ""}
                </b>
              </div>
              <span>Observações: {orderDetail.notes || "Nenhuma"}</span>
              <div className="summary-total">
                <b>Total</b>
                <b>{brl(orderDetail.totalAmount)}</b>
              </div>
            </div>
            <a
              className="primary-btn full"
              href={wa(
                orderDetail.customer?.phone,
                `Olá ${orderDetail.customer?.name}! Sobre o pedido #${String(orderDetail.id).slice(-7)} da StopBeer.`,
              )}
              target="_blank"
            >
              Conversar no WhatsApp <MessageCircle size={16} />
            </a>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, icon, delta, alert }) {
  return (
    <div className="metric-card">
      {icon}
      <div>
        <span>{title}</span>
        <b>{value}</b>
        <small className={alert ? "attention" : ""}>{delta}</small>
      </div>
      <ArrowUpRight className="metric-arrow" size={15} />
    </div>
  );
}
function Status({ status }) {
  return (
    <span className={`status-pill ${status || "pendente"}`}>
      <i />
      {{
        pendente: "Pendente",
        confirmado: "Confirmado",
        em_rota: "Em rota",
        entregue: "Entregue",
        cancelado: "Cancelado",
      }[status] || "Pendente"}
    </span>
  );
}
