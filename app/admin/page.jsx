"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Beer,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  ChartNoAxesColumn,
  LockKeyhole,
  Mail,
  MessageCircle,
  Package,
  Pencil,
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
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { brl, categories, seedProducts } from "../../src/data";
import { auth, db, firebaseEnabled } from "../../src/firebase";
import { handleProductImageError } from "../../src/product-image";
import { showToast } from "../../src/alerts";
import Swal from "sweetalert2";

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

function formatMonthLabel(value) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profileName, setProfileName] = useState(() =>
    localRead("sb-owner-name", ""),
  );
  const [profilePhoto, setProfilePhoto] = useState(() =>
    localRead("sb-owner-photo", ""),
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const storeSelectorRef = useRef(null);
  const [products, setProducts] = useState(() =>
    firebaseEnabled ? [] : localRead("sb-products", seedProducts),
  );
  const [orders, setOrders] = useState(() => localRead("sb-orders", []));
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [adminTab, setAdminTab] = useState("Visão geral");
  const [orderFilter, setOrderFilter] = useState("Todos");
  const [loginOpen, setLoginOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productsLoading, setProductsLoading] = useState(firebaseEnabled);
  const [importingCatalog, setImportingCatalog] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    if (firebaseEnabled) return;
    localStorage.setItem("sb-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (firebaseEnabled) return;
    localStorage.setItem("sb-orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser) return;
      setProfileName(nextUser.displayName || "");
      setProfilePhoto(nextUser.photoURL || "");
    });
  }, []);

  useEffect(() => {
    if (!storeMenuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (!storeSelectorRef.current?.contains(event.target)) {
        setStoreMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setStoreMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [storeMenuOpen]);

  useEffect(() => {
    if (!firebaseEnabled) return;
    return onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
        setProductsLoading(false);
      },
      (error) => {
        setProductsLoading(false);
        notify(
          error.code === "permission-denied"
            ? "O Firebase bloqueou o acesso aos produtos. Confira as regras do Firestore."
            : "Não foi possível carregar os produtos do Firebase.",
        );
      },
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

  const notify = (message) => showToast(message);

  const saveProfile = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("displayName") || "").trim();
    const photoURL = String(form.get("photoURL") || "").trim();

    setProfileSaving(true);
    try {
      if (firebaseEnabled && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name || null,
          photoURL: photoURL || null,
        });
        setUser(auth.currentUser);
      }
      localStorage.setItem("sb-owner-name", JSON.stringify(name));
      localStorage.setItem("sb-owner-photo", JSON.stringify(photoURL));
      setProfileName(name);
      setProfilePhoto(photoURL);
      setProfileOpen(false);
      await Swal.fire({
        icon: "success",
        title: "Perfil atualizado",
        text: "Seu nome e sua imagem foram salvos.",
        confirmButtonText: "Fechar",
        confirmButtonColor: "#c92f32",
      });
    } catch (error) {
      console.error("Não foi possível atualizar o perfil:", error);
      notify(
        "Não foi possível atualizar o perfil. Confira a URL da imagem e tente novamente.",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const ownerDisplayName = profileName || user?.displayName || "Proprietário";
  const ownerInitial = ownerDisplayName.charAt(0).toUpperCase() || "S";

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
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const product = {
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim(),
      category: String(form.get("category") || categories[1]),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      imageUrl:
        String(form.get("imageUrl") || "").trim() ||
        editingProduct?.imageUrl ||
        "",
      available: editingProduct?.available ?? true,
    };
    try {
      if (firebaseEnabled) {
        if (editingProduct) {
          await updateDoc(doc(db, "products", editingProduct.id), product);
        } else {
          await addDoc(collection(db, "products"), product);
        }
      } else {
        if (editingProduct) {
          setProducts((items) =>
            items.map((item) =>
              item.id === editingProduct.id ? { ...item, ...product } : item,
            ),
          );
        } else {
          setProducts((items) => [
            { ...product, id: `p${Date.now()}` },
            ...items,
          ]);
        }
      }
      if (editingProduct) {
        setEditingProduct(null);
        await Swal.fire({
          icon: "success",
          title: "Produto atualizado",
          text: "As alterações foram salvas com sucesso.",
          confirmButtonText: "Fechar",
          confirmButtonColor: "#c92f32",
        });
      } else {
        setAddingProduct(false);
        notify("Produto adicionado");
      }
      formElement.reset();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      notify(
        error.code === "permission-denied"
          ? "Sem permissão para salvar. Confira se o UID das regras é o do usuário conectado."
          : "Falha ao salvar produto. Confira os dados e tente novamente.",
      );
    }
  };

  const importInitialCatalog = async () => {
    if (!firebaseEnabled || !user || importingCatalog) {
      return;
    }

    setImportingCatalog(true);
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const existingIds = new Set(snapshot.docs.map((item) => item.id));
      const existingNames = new Set(
        snapshot.docs.map((item) =>
          String(item.data().name || "")
            .trim()
            .toLocaleLowerCase("pt-BR"),
        ),
      );
      const missingProducts = seedProducts.filter(
        (product) =>
          !existingIds.has(product.id) &&
          !existingNames.has(product.name.trim().toLocaleLowerCase("pt-BR")),
      );

      if (!missingProducts.length) {
        notify("O catálogo inicial já está cadastrado");
        return;
      }

      const batch = writeBatch(db);
      missingProducts.forEach(({ id, ...product }) => {
        batch.set(doc(db, "products", id), product);
      });
      await batch.commit();
      notify(`${missingProducts.length} produtos importados para o Firestore`);
    } catch (error) {
      console.error("Erro ao importar catálogo inicial:", error);
      notify(
        error.code === "permission-denied"
          ? "Sem permissão para cadastrar. Confira as regras do Firestore."
          : "Falha ao importar o catálogo inicial.",
      );
    } finally {
      setImportingCatalog(false);
    }
  };

  const removeProduct = async (product) => {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Remover produto?",
      text: `Tem certeza que deseja remover ${product.name}?`,
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#c92f32",
      cancelButtonColor: "#77716a",
      reverseButtons: true,
    });
    if (!confirmation.isConfirmed) return;
    try {
      if (firebaseEnabled) {
        await deleteDoc(doc(db, "products", product.id));
      } else {
        setProducts((items) => items.filter((item) => item.id !== product.id));
      }
      if (editingProduct?.id === product.id) setEditingProduct(null);
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

  const [orderDetail, setOrderDetail] = useState(null);
  const isAuthenticated = isAuth;
  const monthOrders = orders.filter(
    (o) => String(o.createdAt || "").slice(0, 7) === month,
  );
  const changeMonth = (offset) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 + offset, 1);
    const nextMonth = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}`;
    setMonth(nextMonth);
  };
  const revenue = monthOrders
    .filter((o) => o.status !== "cancelado")
    .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const average = monthOrders.length ? revenue / monthOrders.length : 0;
  const pending = orders.filter((o) => o.status === "pendente").length;
  const initialCatalogMissing = seedProducts.filter(
    (seed) =>
      !products.some(
        (product) =>
          product.id === seed.id ||
          String(product.name || "")
            .trim()
            .toLocaleLowerCase("pt-BR") ===
            seed.name.trim().toLocaleLowerCase("pt-BR"),
      ),
  );
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
        <div className="admin-store-wrap" ref={storeSelectorRef}>
          <button
            type="button"
            className="admin-store"
            aria-haspopup="listbox"
            aria-expanded={storeMenuOpen}
            onClick={() => setStoreMenuOpen((open) => !open)}
          >
            <span className="store-avatar">SB</span>
            <span>
              <b>StopBeer</b>
              <small>Distribuidora</small>
            </span>
            <ChevronDown size={14} />
          </button>
          {storeMenuOpen && (
            <div
              className="admin-store-menu"
              role="listbox"
              aria-label="Empresas"
            >
              <button
                type="button"
                className="admin-store-option"
                role="option"
                aria-selected="true"
                onClick={() => setStoreMenuOpen(false)}
              >
                <span className="store-avatar">SB</span>
                <span>
                  <b>StopBeer</b>
                  <small>Distribuidora</small>
                </span>
                <Check size={15} />
              </button>
            </div>
          )}
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
            <button
              className="profile-avatar profile-trigger"
              title="Editar perfil"
              aria-label="Editar perfil"
              onClick={() => setProfileOpen(true)}
            >
              {ownerInitial}
              {(profilePhoto || user?.photoURL) && (
                <img
                  src={profilePhoto || user?.photoURL}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </button>
            <button
              className="profile-details"
              onClick={() => setProfileOpen(true)}
              title="Editar perfil"
            >
              <b>{ownerDisplayName}</b>
              <small>Proprietário</small>
            </button>
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
            <button
              className="admin-avatar profile-trigger"
              onClick={() => setProfileOpen(true)}
              title="Editar perfil"
              aria-label="Editar perfil"
            >
              {ownerInitial}
              {(profilePhoto || user?.photoURL) && (
                <img
                  src={profilePhoto || user?.photoURL}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}
            </button>
          </div>
        </header>
        {adminTab === "Visão geral" ? (
          <>
            <div className="overview-head dashboard-overview-head">
              <div>
                <h2>Resumo da operação</h2>
                <p>Acompanhe como estão as vendas da sua loja.</p>
              </div>
              <div className="month-picker month-selector">
                <button
                  type="button"
                  className="month-nav"
                  aria-label="Mês anterior"
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <span className="month-label">{formatMonthLabel(month)}</span>
                <label className="month-calendar" aria-label="Escolher mês">
                  <CalendarDays size={16} />
                  <input
                    type="month"
                    value={month}
                    aria-label="Escolher mês"
                    onChange={(event) => {
                      if (event.target.value) setMonth(event.target.value);
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="month-nav"
                  aria-label="Próximo mês"
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
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
            <section className="panel inventory-panel inventory-panel-full">
              <div className="panel-head">
                <div>
                  <h3>Produtos</h3>
                  <p>Gerencie preços e disponibilidade.</p>
                </div>
                <div className="inventory-header-actions">
                  {firebaseEnabled &&
                    !productsLoading &&
                    initialCatalogMissing.length > 0 && (
                      <button
                        type="button"
                        className="text-btn import-catalog-button"
                        onClick={importInitialCatalog}
                        disabled={importingCatalog || !user}
                      >
                        {importingCatalog
                          ? "Importando..."
                          : `Importar ${initialCatalogMissing.length} do catálogo`}
                        <Plus size={16} />
                      </button>
                    )}
                  <button
                    type="button"
                    className="primary-btn add-product-trigger"
                    onClick={() => setAddingProduct(true)}
                  >
                    Novo produto <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="inventory-list">
                {productsLoading && (
                  <div className="admin-empty">
                    <p>Carregando produtos...</p>
                  </div>
                )}
                {!productsLoading && products.length === 0 && (
                  <div className="admin-empty">
                    <Package />
                    <p>
                      {firebaseEnabled
                        ? "Ainda não há produtos no Firestore. Cadastre um produto ou importe o catálogo inicial."
                        : "Nenhum produto cadastrado."}
                    </p>
                  </div>
                )}
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
                      className="edit-product"
                      onClick={() => setEditingProduct(p)}
                      title={`Editar ${p.name}`}
                      aria-label={`Editar ${p.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className={`availability ${p.available ? "on" : ""}`}
                      onClick={() => toggleProduct(p)}
                      title="Alternar disponibilidade"
                      aria-label={`${p.available ? "Pausar" : "Ativar"} ${p.name}`}
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
          </>
        )}
      </main>
      {editingProduct && (
        <div
          className="modal-wrap admin-product-edit-overlay"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditingProduct(null)
          }
        >
          <section
            className="modal admin-product-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-product-title"
          >
            <button
              type="button"
              className="modal-close icon-btn"
              onClick={() => setEditingProduct(null)}
              aria-label="Fechar edição"
            >
              <X />
            </button>
            <ProductForm
              product={editingProduct}
              onSubmit={saveProduct}
              onCancel={() => setEditingProduct(null)}
            />
          </section>
        </div>
      )}
      {addingProduct && (
        <div
          className="modal-wrap admin-product-edit-overlay"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setAddingProduct(false)
          }
        >
          <section
            className="modal admin-product-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-product-title"
          >
            <button
              type="button"
              className="modal-close icon-btn"
              onClick={() => setAddingProduct(false)}
              aria-label="Fechar cadastro de produto"
            >
              <X />
            </button>
            <ProductForm onSubmit={saveProduct} />
          </section>
        </div>
      )}
      {profileOpen && (
        <div
          className="modal-wrap profile-modal-wrap"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setProfileOpen(false)
          }
        >
          <section
            className="modal profile-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
          >
            <button
              type="button"
              className="modal-close icon-btn"
              onClick={() => setProfileOpen(false)}
              aria-label="Fechar edição de perfil"
            >
              <X />
            </button>
            <div className="profile-modal-heading">
              <span className="profile-preview">
                {ownerInitial}
                {(profilePhoto || user?.photoURL) && (
                  <img
                    src={profilePhoto || user?.photoURL}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </span>
              <div>
                <span className="eyebrow">CONTA DO PROPRIETÁRIO</span>
                <h2 id="profile-edit-title">Meu perfil</h2>
              </div>
            </div>
            <form className="profile-edit-form" onSubmit={saveProfile}>
              <label>
                Nome de exibição
                <input
                  name="displayName"
                  type="text"
                  maxLength={60}
                  placeholder="Como quer aparecer no painel"
                  defaultValue={profileName || user?.displayName || ""}
                />
              </label>
              <label>
                URL da imagem de perfil
                <input
                  name="photoURL"
                  type="url"
                  placeholder="https://..."
                  defaultValue={profilePhoto || user?.photoURL || ""}
                />
                <small>Use um link público direto para a imagem.</small>
              </label>
              {user?.email && (
                <p className="profile-email">
                  E-mail de acesso: <b>{user.email}</b>
                </p>
              )}
              <button
                className="primary-btn full"
                type="submit"
                disabled={profileSaving}
              >
                {profileSaving ? "Salvando..." : "Salvar perfil"}
                {!profileSaving && <Check size={16} />}
              </button>
            </form>
          </section>
        </div>
      )}
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
    </div>
  );
}

function ProductForm({ product = null, onSubmit, onCancel }) {
  const editing = Boolean(product);

  return (
    <>
      <div className="panel-head product-form-head">
        <div>
          <h3 id={editing ? "edit-product-title" : "new-product-title"}>
            {editing ? "Editar produto" : "Novo produto"}
          </h3>
          <p>
            {editing
              ? "Atualize os dados e salve as alterações."
              : "Preencha as informações do item."}
          </p>
        </div>
      </div>
      <form
        key={product?.id || "new-product"}
        onSubmit={onSubmit}
        className="add-product-form"
      >
        <label>
          Nome do produto
          <input
            name="name"
            required
            placeholder="Ex: Heineken 350ml"
            defaultValue={product?.name || ""}
          />
        </label>
        <label>
          Descrição
          <textarea
            name="description"
            placeholder="Detalhes do produto"
            rows="2"
            defaultValue={product?.description || ""}
          />
        </label>
        <div className="form-row">
          <label className="grow">
            Categoria
            <select
              name="category"
              defaultValue={product?.category || categories[1]}
            >
              {categories.slice(1).map((category) => (
                <option key={category}>{category}</option>
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
              defaultValue={product?.price ?? ""}
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
              step="1"
              placeholder="0"
              defaultValue={product?.stock ?? ""}
            />
          </label>
          <label className="grow">
            URL da imagem
            <input
              name="imageUrl"
              type="url"
              placeholder="https://..."
              defaultValue={product?.imageUrl || ""}
            />
          </label>
        </div>
        <button className="primary-btn full">
          {editing ? "Salvar alterações" : "Adicionar produto"}
          {editing ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </form>
    </>
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
