import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("xlsx")) return "xlsx-vendor";
          if (id.includes("recharts")) return "charts-vendor";
          if (id.includes("embla-carousel-react") || id.includes("embla-carousel")) return "carousel-vendor";
          if (id.includes("date-fns")) return "date-vendor";
          if (id.includes("sonner")) return "toast-vendor";
          if (id.includes("react") || id.includes("scheduler")) return "react-vendor";
          if (id.includes("react-router")) return "router-vendor";
          if (id.includes("@tanstack/react-query")) return "query-vendor";
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("@radix-ui")) return "ui-vendor";

          return "vendor";
        },
      },
    },
  },
}));
