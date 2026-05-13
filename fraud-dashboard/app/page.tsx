
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import MetricCard from './components/MetricCard'
import TransactionTable from './components/TransactionTable'
import FraudCharts from './components/FraudCharts'
import AlertPanel from './components/Alerts'
import StatusBar from './components/StatusBar'


export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Navbar />
        <StatusBar />

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
          <MetricCard title="Approved" value="240" />
          <MetricCard title="Flagged" value="19" />
          <MetricCard title="Blocked" value="7" />
          <MetricCard title="Fraud Rate" value="8%" />
          <MetricCard title="High Risk Users" value="12" />
        </section>

        <FraudCharts />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TransactionTable />
        </div>

        <AlertPanel />
      </section>
      </main>
    </div>
  )
}