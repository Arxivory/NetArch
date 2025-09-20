import { Menu } from "lucide-react";

export default function Topbar() {
  const menus = ["File", "Edit", "Options", "View", "Window", "Help"];

  return (
    <div className="flex bg-gray-100 border-b border-gray-300 text-sm px-3 py-1 select-none">
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
