import CanvasShell from "@/components/canvas/CanvasShell";
import ArtifactRenderer, { type ArtifactData } from "@/components/canvas/ArtifactRenderer";

// ─── Fixture: 50 fake customer records ──────────────────────────────

const FIRST_NAMES = [
  "James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda",
  "David","Elizabeth","William","Barbara","Richard","Susan","Joseph","Jessica",
  "Thomas","Sarah","Christopher","Karen","Charles","Lisa","Daniel","Nancy",
  "Matthew","Betty","Anthony","Margaret","Mark","Sandra","Donald","Ashley",
  "Steven","Kimberly","Paul","Emily","Andrew","Donna","Joshua","Michelle",
  "Kenneth","Carol","Kevin","Amanda","Brian","Dorothy","George","Melissa",
  "Timothy","Deborah",
];

const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
  "Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson",
  "Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson",
  "White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker",
  "Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell",
  "Carter","Roberts",
];

const DOMAINS = ["gmail.com","outlook.com","yahoo.com","proton.me","icloud.com"];
const PLANS = ["Growth","Enterprise","Starter","Professional","Business"];
const STATUSES = ["active","active","active","active","past_due","cancelled","trial"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCustomers(count: number) {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = pick(LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${pick(DOMAINS)}`;
    const plan = pick(PLANS);
    const status = pick(STATUSES);
    const mrr = [29, 49, 79, 99, 149, 199, 299, 499][Math.floor(Math.random() * 8)];
    const joinedDays = Math.floor(Math.random() * 720) + 1;
    const joined = new Date(Date.now() - joinedDays * 86400000).toISOString().split("T")[0];
    const lastPayment = status === "active"
      ? new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString().split("T")[0]
      : new Date(Date.now() - Math.floor(Math.random() * 90 + 30) * 86400000).toISOString().split("T")[0];
    const recoveryAttempts = status === "past_due" ? Math.floor(Math.random() * 6) + 1 : 0;

    rows.push({
      id: `CUST-${String(i + 1).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      email,
      plan,
      status,
      mrr: `$${mrr}`,
      joined,
      lastPayment,
      recoveryAttempts,
    });
  }
  return rows;
}

const DEMO_COLUMNS = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "plan", label: "Plan", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "mrr", label: "MRR", sortable: true },
  { key: "joined", label: "Joined", sortable: true },
  { key: "lastPayment", label: "Last Payment", sortable: true },
  { key: "recoveryAttempts", label: "Recovery", sortable: true },
];

const DEMO_ROWS = generateCustomers(50);

const DEMO_ARTIFACT: ArtifactData = {
  type: "data",
  columns: DEMO_COLUMNS,
  rows: DEMO_ROWS,
  totalRows: 50,
};

export default function DemoDataPage() {
  return (
    <CanvasShell slug="demo-data" title="Customer Records" status="complete">
      <ArtifactRenderer artifact={DEMO_ARTIFACT} />
    </CanvasShell>
  );
}
