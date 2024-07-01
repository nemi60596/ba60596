export default function Spinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div
        className="w-16 h-16 border-4 border-t-4 border-t-transparent border-blue-900 rounded-full animate-spin"
        style={{ borderColor: "#00305d", borderTopColor: "transparent" }}
      ></div>
    </div>
  );
}
