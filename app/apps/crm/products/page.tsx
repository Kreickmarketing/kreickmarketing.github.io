import { money, type Product } from "../data";
import { getProducts } from "../queries";

function price(p: Product) {
  if (p.price_type === "Range") return p.price_min !== null || p.price_max !== null ? `${money(p.price_min)}–${money(p.price_max)}` : "—";
  return money(p.price);
}

// Product catalog, grouped by category.
export default async function ProductsPage() {
  const products = await getProducts();
  const categories = [...new Set(products.map((p) => p.category ?? "Other"))];

  return (
    <div className="crm-page crm-page-wide">
      <div className="crm-page-head"><h1>Products</h1></div>
      {categories.map((cat) => (
        <section key={cat} className="crm-cat">
          <h2>{cat}</h2>
          <div className="crm-grid">
            {products.filter((p) => (p.category ?? "Other") === cat).map((p) => (
              <article key={p.id} className="crm-product">
                <div className="crm-card-top">
                  <span className="crm-code">{p.product_code}</span>
                  {p.status && <span className={`crm-status crm-status-${p.status.toLowerCase()}`}>{p.status}</span>}
                </div>
                <h3>{p.name}</h3>
                <p className="crm-price">{price(p)}<span>{p.billing_type && ` · ${p.billing_type}`}</span></p>
                {p.description && <p>{p.description}</p>}
                <dl>
                  {p.payment_route && <><dt>Paid via</dt><dd>{p.payment_route}</dd></>}
                  <dt>Funnel</dt><dd>{p.funnel_url ? <a href={p.funnel_url} target="_blank" rel="noopener noreferrer">{p.funnel_url}</a> : "Not set"}</dd>
                </dl>
                {p.notes && <p className="crm-product-notes">{p.notes}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
