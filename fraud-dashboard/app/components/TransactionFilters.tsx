type Props = {
  search: string
  setSearch: (value: string) => void
  decision: string
  setDecision: (value: string) => void
  risk: string
  setRisk: (value: string) => void
}

export default function TransactionFilters({
  search,
  setSearch,
  decision,
  setDecision,
  risk,
  setRisk,
}: Props) {
  return (
    <div className="flex flex-col xl:flex-row gap-4 justify-between mt-5">
      <input
        type="text"
        placeholder="Search transaction ID or user..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 w-full xl:w-[400px] outline-none focus:border-cyan-500 transition-all"
      />

      <div className="flex gap-3">
        <select
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500"
        >
          <option value="ALL">
            All Decisions
          </option>
          <option value="APPROVED">
            Approved
          </option>
          <option value="FLAGGED">
            Flagged
          </option>
          <option value="BLOCKED">
            Blocked
          </option>
        </select>

        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none focus:border-cyan-500"
        >
          <option value="ALL">
            All Risk Levels
          </option>
          <option value="HIGH">
            High Risk
          </option>
          <option value="MEDIUM">
            Medium Risk
          </option>
          <option value="LOW">
            Low Risk
          </option>
        </select>
      </div>
    </div>
  )
}