import { Menu } from "lucide-react";

export default function Topbar() {
  const menus = ["File", "Edit", "Options", "View", "Window", "Help"];

  return (
    <div className="topbar">
      {menus.map((m) => (
        <button
          key={m}
          className="px-3 py-1 hover:bg-gray-200 rounded-sm transition"
        >
          {m}
        </button>
      ))}
    </div>
  );
}
