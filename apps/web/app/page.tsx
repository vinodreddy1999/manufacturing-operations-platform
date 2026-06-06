const modules = [
  ["Auth", "JWT login, refresh token, logout, RBAC context"],
  ["Platform", "Companies, plants, roles, permissions, feature flags"],
  ["Inventory", "Items, stock balances, movements, reservations"],
  ["Warehouse", "Warehouses, zones, racks, shelves, bins, occupancy"],
  ["Supplier", "Suppliers, contacts, ratings, item sourcing"],
  ["Procurement", "Purchase requisitions, orders, approvals"],
  ["Production", "BOM, routing, work centers, production orders"],
  ["Maintenance", "Machines, maintenance plans, work orders"],
  ["Quality", "Inspections, CAPA, quarantine, rework"],
  ["Reporting", "PDF, Excel, CSV and scheduled reports"],
  ["AI", "Recommendations and draft actions requiring approval"],
  ["Supply Chain", "Forecasting and truck-load optimization"],
];

const kpis = [
  ["Inventory Value", "$18.4M"],
  ["Pending Approvals", "27"],
  ["Open Tasks", "148"],
  ["Warehouse Occupancy", "76%"],
];

export default function Home() {
  return (
    <div className="shell">
      <aside>
        <h1>MOP Console</h1>
        <p>Manufacturing Operations Platform</p>
        <nav>
          {modules.slice(0, 8).map(([name]) => <a href="#" key={name}>{name}</a>)}
        </nav>
      </aside>
      <main>
        <section className="hero">
          <div>
            <h2>Modular SaaS for manufacturing operations</h2>
            <p>Enable inventory, warehouse, production, maintenance, quality, procurement, reporting, and AI per company using feature flags.</p>
          </div>
          <div className="badge"><span><strong>12</strong>Modules</span></div>
        </section>
        <section className="grid">
          {kpis.map(([label, value]) => <div className="card" key={label}><p>{label}</p><h3>{value}</h3><span className="status">Live foundation</span></div>)}
        </section>
        <section className="grid">
          {modules.map(([name, text]) => <article className="card" key={name}><h3>{name}</h3><p>{text}</p><span className="status">Feature-flag ready</span></article>)}
        </section>
        <table className="table">
          <thead><tr><th>Runtime</th><th>Command</th><th>Output</th></tr></thead>
          <tbody>
            <tr><td>API</td><td>npm run dev:api</td><td>http://localhost:4000/api/v1</td></tr>
            <tr><td>Web</td><td>npm run dev</td><td>http://localhost:3000</td></tr>
            <tr><td>Docker</td><td>docker compose -f infra/docker/docker-compose.yml up --build</td><td>Full stack</td></tr>
          </tbody>
        </table>
      </main>
    </div>
  );
}
