export default function HierarchyPanel() {
  return (
    <div className="hierarchy-panel">
      <h3 className="panel-header">Hierarchy</h3>
      <ul className="pl-4 list-disc space-y-1">
        <li>Centro Escolar University Manila</li>
        <li>Librada Avelino Hall
          <ul className="pl-4 list-disc">
            <li>1st Floor</li>
            <li>Room 100
              <ul className="pl-4 list-disc">
                <li>Server Rack
                  <ul className="pl-4 list-disc">
                    <li>Device</li>
                    <li>Device</li>
                    <li>Device</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
}
